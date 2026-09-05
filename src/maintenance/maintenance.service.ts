import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Maintenance, MaintenanceDocument } from './schemas/maintenance.schema';
import { Appointment, AppointmentDocument } from '../appointments/schemas/appointment.schema';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { AddItemUsedDto } from './dto/add-item-used.dto';
import { CustomersService } from '../customers/customers.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { InventoryService } from '../inventory/inventory.service';
import { SalesService } from '../sales/sales.service';
import { I18nContext } from 'nestjs-i18n';
import { CreateDirectReceptionDto } from './dto/create-direct-reception.dto';
import { LinkSaleDto } from './dto/link-sale.dto';
import { buildFuzzyRegex } from '../common/utils/search.util';

export interface MaintenanceFilters {
  customerId?: string;
  status?: string;
  scope?: 'active' | 'delivered_recent' | 'history';
  from?: string;
  to?: string;
  dateField?: 'receptionDate' | 'completedAt' | 'deliveredAt' | 'createdAt' | 'startDate' | 'endDate';
  search?: string;
}

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectModel(Maintenance.name) private maintenanceModel: Model<MaintenanceDocument>,
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    private readonly customersService: CustomersService,
    private readonly vehiclesService: VehiclesService,
    private readonly inventoryService: InventoryService,
    @Inject(forwardRef(() => SalesService))
    private readonly salesService: SalesService,
  ) {}


  /**
   * Direct vehicle reception without a prior appointment (Walk-in).
   * Finds/creates customer, finds/creates vehicle, auto-registers a completed appointment,
   * and creates an active maintenance order (status: 'not_started').
   */
  async directReception(dto: CreateDirectReceptionDto, userId: string, branchId: string): Promise<MaintenanceDocument> {
    let customerId = dto.customerId;
    const phone = dto.customerPhone.trim();

    let customer: any = null;
    if (customerId) {
      customer = await this.customersService.findById(customerId, branchId);
    } else {
      try {
        customer = await this.customersService.findByPhone(phone, branchId);
        customerId = (customer._id as any).toString();
      } catch (e) {
        if (!(e instanceof NotFoundException)) throw e;
        customer = await this.customersService.create(
          {
            name: dto.customerName,
            email: dto.customerEmail,
            phone: phone,
            whatsappId: dto.whatsappId,
          },
          branchId,
        );
        customerId = (customer._id as any).toString();
      }
    }

    const serialNumberLastFour = dto.vehicle.serialNumberLastFour.toUpperCase().trim();
    let vehicle: any = null;
    try {
      vehicle = await this.vehiclesService.findBySerialNumberLastFour(serialNumberLastFour, branchId);
    } catch (e) {
      if (!(e instanceof NotFoundException)) throw e;
      vehicle = await this.vehiclesService.create(
        {
          customerId: customerId!,
          brand: dto.vehicle.brand,
          model: dto.vehicle.model,
          year: dto.vehicle.year,
          serialNumberLastFour: serialNumberLastFour,
          color: dto.vehicle.color,
        },
        branchId,
      );
    }

    // Register a completed appointment record for workshop analytics & timeline
    let appointment: any = null;
    try {
      const appt = new this.appointmentModel({
        branch: branchId,
        customer: customerId as any,
        customerName: dto.customerName,
        customerPhone: phone,
        customerEmail: dto.customerEmail,
        whatsappId: dto.whatsappId,
        vehicle: {
          brand: dto.vehicle.brand,
          model: dto.vehicle.model,
          year: dto.vehicle.year,
          serialNumberLastFour,
        },
        serviceRequested: dto.serviceRequested,
        scheduledAt: new Date(),
        duration: 15,
        status: 'completed',
        notes: dto.notes || 'Recepción directa en sucursal (Walk-in)',
        assignedMechanic: dto.assignedMechanic || null,
      });
      appointment = await appt.save();
    } catch (err) {
      console.error('Error auto-creating completed appointment during direct reception:', err);
    }

    const now = new Date();
    const maintenance = new this.maintenanceModel({
      branch: branchId,
      customer: customerId as any,
      vehicle: (vehicle._id as any).toString(),
      appointment: appointment ? (appointment._id as any).toString() : null,
      laborCost: dto.laborCost || 0,
      notes: dto.notes || dto.serviceRequested,
      status: 'not_started',
      createdBy: userId as any,
      receptionDate: now,
      startDate: now,
      assignedMechanic: dto.assignedMechanic || null,
      statusHistory: [
        {
          status: 'not_started',
          changedAt: now,
          changedBy: userId as any,
          notes: 'Recepción directa en sucursal (Walk-in)',
        },
      ],
    });

    const saved = await maintenance.save();
    return saved.populate(['customer', 'vehicle', 'createdBy', 'appointment']);
  }

  async create(createMaintenanceDto: CreateMaintenanceDto, userId: string, branchId: string): Promise<MaintenanceDocument> {
    // Verify customer
    await this.customersService.findById(createMaintenanceDto.customerId, branchId);

    // Verify vehicle & ensure it belongs to the customer
    const vehicle = await this.vehiclesService.findById(createMaintenanceDto.vehicleId, branchId);
    if ((vehicle.customer as any)._id.toString() !== createMaintenanceDto.customerId) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.vehicleNotBelongToCustomer') : 'El vehículo no pertenece al cliente especificado');
    }

    // If an appointmentId is supplied, validate it exists
    if (createMaintenanceDto.appointmentId) {
      const appt = await this.appointmentModel.findOne({ _id: createMaintenanceDto.appointmentId, branch: branchId }).exec();
      if (!appt) {
        const i18n = I18nContext.current();
        throw new BadRequestException(i18n ? i18n.t('common.errors.appointmentNotFound') : 'La cita especificada no fue encontrada');
      }
    }

    // Determine initial status:
    //  - Walk-in (no appointment) → not_started (entra directo al taller)
    //  - Linked to appointment   → awaiting_appointment (limbo hasta que la cita se complete)
    const initialStatus = createMaintenanceDto.appointmentId ? 'awaiting_appointment' : 'not_started';
    const now = new Date();

    const maintenance = new this.maintenanceModel({
      ...createMaintenanceDto,
      branch: branchId,
      customer: createMaintenanceDto.customerId as any,
      vehicle: createMaintenanceDto.vehicleId as any,
      appointment: createMaintenanceDto.appointmentId ? (createMaintenanceDto.appointmentId as any) : null,
      sale: createMaintenanceDto.saleId ? (createMaintenanceDto.saleId as any) : null,
      createdBy: userId as any,
      status: initialStatus,
      receptionDate: now,
      startDate: now,
      statusHistory: [
        {
          status: initialStatus,
          changedAt: now,
          changedBy: userId as any,
          notes: createMaintenanceDto.notes || 'Creación de orden de mantenimiento',
        },
      ],
    });

    return (await maintenance.save()).populate(['customer', 'vehicle', 'createdBy', 'appointment', 'sale']);
  }

  async findAll(branchId: string, filters: MaintenanceFilters): Promise<MaintenanceDocument[]> {
    const query: any = { branch: branchId };

    if (filters.customerId) {
      query.customer = filters.customerId;
    }

    // Handle view scopes (active vs delivered recent vs history)
    if (filters.scope === 'active') {
      query.status = { $in: ['not_started', 'in_progress', 'completed'] };
    } else if (filters.scope === 'delivered_recent') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query.status = 'delivered';
      query.$or = [
        { deliveredAt: { $gte: sevenDaysAgo } },
        { deliveredAt: null, updatedAt: { $gte: sevenDaysAgo } },
      ];
    } else if (filters.status) {
      query.status = filters.status;
    } else {
      query.status = { $ne: 'awaiting_appointment' };
    }

    // Date range filters
    if (filters.from || filters.to) {
      const dateField = filters.dateField || 'receptionDate';
      const dateRange: any = {};
      if (filters.from) {
        dateRange.$gte = new Date(`${filters.from}T00:00:00.000Z`);
      }
      if (filters.to) {
        const toDate = new Date(`${filters.to}T23:59:59.999Z`);
        dateRange.$lte = toDate;
      }

      if (dateField === 'receptionDate' || dateField === 'startDate') {
        const dateConditions = [
          { receptionDate: dateRange },
          { receptionDate: null, startDate: dateRange },
          { receptionDate: null, startDate: null, createdAt: dateRange },
        ];
        if (query.$or) {
          query.$and = [{ $or: query.$or }, { $or: dateConditions }];
          delete query.$or;
        } else {
          query.$or = dateConditions;
        }
      } else if (dateField === 'completedAt') {
        const dateConditions = [
          { completedAt: dateRange },
          { completedAt: null, endDate: dateRange },
        ];
        if (query.$or) {
          query.$and = [{ $or: query.$or }, { $or: dateConditions }];
          delete query.$or;
        } else {
          query.$or = dateConditions;
        }
      } else if (dateField === 'deliveredAt' || dateField === 'endDate') {
        const dateConditions = [
          { deliveredAt: dateRange },
          { deliveredAt: null, endDate: dateRange },
        ];
        if (query.$or) {
          query.$and = [{ $or: query.$or }, { $or: dateConditions }];
          delete query.$or;
        } else {
          query.$or = dateConditions;
        }
      } else {
        query[dateField] = dateRange;
      }
    }

    // Search filter across customers and vehicles
    if (filters.search && filters.search.trim()) {
      const search = filters.search.trim();
      const regex = buildFuzzyRegex(search);

      // Find matching vehicles and customers
      const [vehicles, customers] = await Promise.all([
        this.vehiclesService.findAll(branchId, { search }),
        this.customersService.findAll(branchId, search),
      ]);

      const vehicleIds = vehicles.map((v) => v._id);
      const customerIds = customers.map((c) => c._id);

      const searchConditions: any[] = [
        { notes: regex },
      ];
      if (vehicleIds.length > 0) searchConditions.push({ vehicle: { $in: vehicleIds } });
      if (customerIds.length > 0) searchConditions.push({ customer: { $in: customerIds } });

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else if (query.$and) {
        query.$and.push({ $or: searchConditions });
      } else {
        query.$or = searchConditions;
      }
    }

    const orders = await this.maintenanceModel
      .find(query)
      .populate(['customer', 'vehicle', 'createdBy', 'appointment', 'sale'])
      .sort({ createdAt: -1 })
      .exec();

    // Do not return orders in awaiting_appointment limbo or linked to non-approved/cancelled appointments
    return orders.filter((order) => {
      if (order.status === 'awaiting_appointment') return false;
      if (!order.appointment) return true;
      const apptStatus = (order.appointment as any)?.status;
      return apptStatus === 'approved' || apptStatus === 'completed' || apptStatus === 'rescheduled';
    });
  }

  async findById(id: string, branchId: string): Promise<MaintenanceDocument> {
    if (!Types.ObjectId.isValid(id)) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.invalidMaintenanceId') : 'ID de orden de mantenimiento inválido');
    }
    const order = await this.maintenanceModel
      .findOne({ _id: id, branch: branchId })
      .populate(['customer', 'vehicle', 'createdBy', 'appointment', 'itemsUsed.product', 'statusHistory.changedBy', 'diagnosticNotes.createdBy', 'sale'])
      .exec();
    if (!order) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.maintenanceNotFound') : 'Orden de mantenimiento no encontrada');
    }
    return order;
  }

  async update(id: string, branchId: string, updateMaintenanceDto: UpdateMaintenanceDto, userId?: string): Promise<MaintenanceDocument> {
    const order = await this.findById(id, branchId);
    const now = new Date();

    if (updateMaintenanceDto.status && updateMaintenanceDto.status !== order.status) {
      // Block manual status changes while the appointment hasn't been completed yet
      if (order.status === 'awaiting_appointment' && updateMaintenanceDto.status !== 'awaiting_appointment') {
        const i18n = I18nContext.current();
        throw new BadRequestException(
          i18n
            ? i18n.t('common.errors.maintenanceAwaitingAppointment')
            : 'No se puede cambiar el estado del mantenimiento hasta que la cita asociada sea completada',
        );
      }

      order.status = updateMaintenanceDto.status;

      if (updateMaintenanceDto.status === 'in_progress' && !order.startedAt) {
        order.startedAt = now;
      } else if (updateMaintenanceDto.status === 'completed') {
        if (!order.completedAt) order.completedAt = now;
        order.endDate = now;
      } else if (updateMaintenanceDto.status === 'delivered') {
        if (!order.deliveredAt) order.deliveredAt = now;
        order.endDate = now;
      }

      if (!order.statusHistory) {
        order.statusHistory = [];
      }
      order.statusHistory.push({
        status: updateMaintenanceDto.status,
        changedAt: now,
        changedBy: userId as any,
        notes: updateMaintenanceDto.notes || `Estado actualizado a ${updateMaintenanceDto.status}`,
      });
      order.markModified('statusHistory');
    }

    if (updateMaintenanceDto.laborCost !== undefined) {
      order.laborCost = updateMaintenanceDto.laborCost;
    }

    if (updateMaintenanceDto.notes !== undefined) {
      order.notes = updateMaintenanceDto.notes;
    }

    if (updateMaintenanceDto.receptionNotes !== undefined) {
      order.receptionNotes = updateMaintenanceDto.receptionNotes;
    }

    if (updateMaintenanceDto.assignedMechanic !== undefined) {
      order.assignedMechanic = updateMaintenanceDto.assignedMechanic;
    }

    if (updateMaintenanceDto.saleId !== undefined) {
      if (updateMaintenanceDto.saleId) {
        await this.salesService.findById(updateMaintenanceDto.saleId, branchId);
        order.sale = updateMaintenanceDto.saleId as any;
      } else {
        order.sale = null;
      }
    }

    const saved = await order.save();
    return saved.populate(['customer', 'vehicle', 'createdBy', 'appointment', 'itemsUsed.product', 'statusHistory.changedBy', 'diagnosticNotes.createdBy', 'sale']);
  }

  /**
   * Link a completed sale / POS ticket to this maintenance order
   */
  async linkSale(id: string, branchId: string, dto: LinkSaleDto, userId?: string): Promise<MaintenanceDocument> {
    const order = await this.findById(id, branchId);
    let sale: any = null;
    if (dto.saleId) {
      sale = await this.salesService.findById(dto.saleId, branchId);
    } else if (dto.folio) {
      sale = await this.salesService.findByFolio(dto.folio, branchId);
    } else {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.saleIdOrFolioRequired') : 'Debe proporcionar saleId o folio de la venta');
    }

    order.sale = (sale._id as any).toString();
    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    order.statusHistory.push({
      status: order.status,
      changedAt: new Date(),
      changedBy: userId as any,
      notes: `Ticket de venta vinculado: Folio #${sale.folio} (Total: $${sale.total})`,
    });
    order.markModified('statusHistory');

    const saved = await order.save();
    return this.findById((saved._id as any).toString(), branchId);
  }

  /**
   * Unlink sale / POS ticket from this maintenance order
   */
  async unlinkSale(id: string, branchId: string, userId?: string): Promise<MaintenanceDocument> {
    const order = await this.findById(id, branchId);
    const previousFolio = (order.sale as any)?.folio || '';
    order.sale = null;

    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    order.statusHistory.push({
      status: order.status,
      changedAt: new Date(),
      changedBy: userId as any,
      notes: `Ticket de venta desvinculado${previousFolio ? ` (Folio #${previousFolio})` : ''}`,
    });
    order.markModified('statusHistory');

    const saved = await order.save();
    return this.findById((saved._id as any).toString(), branchId);
  }

  /**
   * Append a diagnostic or failure note observed during maintenance
   */
  async addDiagnosticNote(id: string, branchId: string, note: string, userId?: string): Promise<MaintenanceDocument> {
    const order = await this.findById(id, branchId);
    if (!order.diagnosticNotes) {
      order.diagnosticNotes = [];
    }

    order.diagnosticNotes.push({
      note: note.trim(),
      createdAt: new Date(),
      createdBy: userId as any,
    });
    order.markModified('diagnosticNotes');

    const saved = await order.save();
    return saved.populate(['customer', 'vehicle', 'createdBy', 'appointment', 'itemsUsed.product', 'statusHistory.changedBy', 'diagnosticNotes.createdBy', 'sale']);
  }

  /**
   * Register that customer was notified that the vehicle is ready for pickup
   */
  async notifyClient(id: string, branchId: string, userId?: string, notes?: string): Promise<MaintenanceDocument> {
    const order = await this.findById(id, branchId);
    const now = new Date();
    order.notifiedAt = now;

    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    order.statusHistory.push({
      status: order.status,
      changedAt: now,
      changedBy: userId as any,
      notes: notes || 'Se notificó al cliente que su vehículo está listo para entrega',
    });
    order.markModified('statusHistory');

    const saved = await order.save();
    return saved.populate(['customer', 'vehicle', 'createdBy', 'appointment', 'itemsUsed.product', 'statusHistory.changedBy', 'diagnosticNotes.createdBy', 'sale']);
  }

  /**
   * Called by AppointmentsService when a cita is marked as `completed`.
   * Finds any maintenance in `awaiting_appointment` linked to this appointment
   * and promotes it to `not_started` so workshop staff can begin.
   */
  async activateFromAppointment(appointmentId: string, branchId: string, receptionNotes?: string): Promise<MaintenanceDocument | null> {
    if (!Types.ObjectId.isValid(appointmentId)) return null;
    const now = new Date();

    const updateSet: any = { status: 'not_started', receptionDate: now, startDate: now };
    if (receptionNotes) {
      updateSet.receptionNotes = receptionNotes;
    }

    let order: any = await this.maintenanceModel
      .findOneAndUpdate(
        { appointment: appointmentId, status: 'awaiting_appointment', branch: branchId } as any,
        {
          $set: updateSet,
          $push: {
            statusHistory: {
              status: 'not_started',
              changedAt: now,
              notes: 'Cita completada, vehículo ingresado formalmente a cola de taller',
            },
          },
        },
        { new: true },
      )
      .populate(['customer', 'vehicle', 'createdBy', 'appointment', 'diagnosticNotes.createdBy'])
      .exec();

    if (!order) {
      order = await this.maintenanceModel
        .findOne({ appointment: appointmentId, branch: branchId } as any)
        .populate(['customer', 'vehicle', 'createdBy', 'appointment', 'diagnosticNotes.createdBy'])
        .exec();
    }

    return order as MaintenanceDocument | null;
  }

  /**
   * Automatically creates a Maintenance order linked to a newly scheduled Appointment.
   * The maintenance order starts in the "awaiting_appointment" limbo status.
   */
  async createFromAppointment(
    appointmentId: string,
    customerId: string,
    vehicleId: string,
    serviceRequested: string,
    branchId: string,
    receptionNotes?: string,
  ): Promise<MaintenanceDocument> {
    const now = new Date();
    const maintenance = new this.maintenanceModel({
      branch: branchId,
      customer: customerId as any,
      vehicle: vehicleId as any,
      appointment: appointmentId as any,
      laborCost: 0,
      notes: serviceRequested || 'Servicio programado por cita',
      receptionNotes: receptionNotes || '',
      diagnosticNotes: [],
      status: 'awaiting_appointment',
      createdBy: null,
      receptionDate: now,
      startDate: now,
      statusHistory: [
        {
          status: 'awaiting_appointment',
          changedAt: now,
          notes: 'Cita agendada (pendiente de llegada)',
        },
      ],
    });
    return maintenance.save();
  }

  async addItemUsed(id: string, branchId: string, addItemUsedDto: AddItemUsedDto, userId: string): Promise<MaintenanceDocument> {
    const order = await this.findById(id, branchId);

    if (order.status === 'delivered') {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.maintenanceAlreadyDelivered') : 'No se pueden añadir productos a una orden que ya fue entregada');
    }

    // Find product to check stock & prices
    const product = await this.inventoryService.findProductById(addItemUsedDto.productId, branchId);

    // Register stock movement (which deducts the stock and throws stock errors if insufficient)
    await this.inventoryService.registerMovement(
      {
        productId: addItemUsedDto.productId,
        type: 'out',
        quantity: addItemUsedDto.quantity,
        reason: `Consumo en orden de mantenimiento #${order._id}`,
      },
      userId,
      branchId,
    );

    // Add product to maintenance items used (with snapshot prices)
    order.itemsUsed.push({
      product: product._id as any,
      sku: product.sku,
      name: product.name,
      quantity: addItemUsedDto.quantity,
      costPriceSnapshot: product.costPrice,
      sellingPriceSnapshot: product.sellingPrice,
    });

    const saved = await order.save();
    return saved.populate(['customer', 'vehicle', 'createdBy', 'appointment', 'itemsUsed.product', 'statusHistory.changedBy', 'diagnosticNotes.createdBy', 'sale']);
  }

  async addEvidencePhotos(id: string, branchId: string, stage: string, photoUrls: string[]): Promise<MaintenanceDocument> {
    const order = await this.findById(id, branchId);

    // Check if stage exists
    const stageIndex = order.evidencePhotos.findIndex((item) => item.stage.toLowerCase() === stage.toLowerCase());

    if (stageIndex >= 0) {
      // Append photos
      order.evidencePhotos[stageIndex].photos.push(...photoUrls);
      order.evidencePhotos[stageIndex].uploadedAt = new Date();
    } else {
      // Create new stage entry
      order.evidencePhotos.push({
        stage: stage.toLowerCase(),
        photos: photoUrls,
        uploadedAt: new Date(),
      });
    }

    // Trigger document modification detection for nested arrays in Mongoose
    order.markModified('evidencePhotos');

    const saved = await order.save();
    return saved.populate(['customer', 'vehicle', 'createdBy', 'appointment', 'itemsUsed.product', 'statusHistory.changedBy', 'diagnosticNotes.createdBy', 'sale']);
  }

  async findClientView(serialOrPhone: string, branchId: string): Promise<MaintenanceDocument[]> {
    const query: any = { branch: branchId };
    const input = serialOrPhone.trim();

    if (Types.ObjectId.isValid(input)) {
      query._id = input;
    } else {
      // Find matching vehicles or customers first
      const vehicles = await this.vehiclesService.findAll(branchId, { search: input });
      const customers = await this.customersService.findAll(branchId, input);

      const vehicleIds = vehicles.map((v) => v._id);
      const customerIds = customers.map((c) => c._id);

      if (vehicleIds.length === 0 && customerIds.length === 0) {
        return [];
      }

      query.$or = [
        { vehicle: { $in: vehicleIds } },
        { customer: { $in: customerIds } },
      ];
    }

    // Public view only exposes safe details: client name, vehicle serial number, service status, and photos
    const results = await this.maintenanceModel
      .find({ ...query, status: { $ne: 'awaiting_appointment' } })
      .select('customer vehicle appointment status laborCost evidencePhotos notes startDate endDate')
      .populate('customer', 'name')
      .populate('vehicle', 'brand model serialNumberLastFour color')
      .populate('appointment', 'status')
      .sort({ createdAt: -1 })
      .exec();

    return results.filter((order) => {
      if (order.status === 'awaiting_appointment') return false;
      if (!order.appointment) return true;
      const apptStatus = (order.appointment as any)?.status;
      return apptStatus === 'approved' || apptStatus === 'completed' || apptStatus === 'rescheduled';
    });
  }

  /**
   * Cleans up any maintenance in 'awaiting_appointment' limbo when an appointment is cancelled, rejected, or deleted.
   */
  async handleAppointmentCancelled(appointmentId: string, branchId: string): Promise<void> {
    if (!Types.ObjectId.isValid(appointmentId)) return;
    await this.maintenanceModel.deleteMany({
      appointment: appointmentId,
      status: 'awaiting_appointment',
      branch: branchId,
    } as any).exec();
  }

  async remove(id: string, branchId: string): Promise<void> {
    const order = await this.findById(id, branchId);
    if (order.status === 'in_progress' || order.status === 'completed') {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.maintenanceCannotDelete') : 'No se puede eliminar una orden de servicio en curso o completada');
    }
    await this.maintenanceModel.findOneAndDelete({ _id: id, branch: branchId }).exec();
  }
}
