import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectModel(Maintenance.name) private maintenanceModel: Model<MaintenanceDocument>,
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    private readonly customersService: CustomersService,
    private readonly vehiclesService: VehiclesService,
    private readonly inventoryService: InventoryService,
  ) {}

  async create(createMaintenanceDto: CreateMaintenanceDto, userId: string): Promise<MaintenanceDocument> {
    // Verify customer
    await this.customersService.findById(createMaintenanceDto.customerId);

    // Verify vehicle & ensure it belongs to the customer
    const vehicle = await this.vehiclesService.findById(createMaintenanceDto.vehicleId);
    if ((vehicle.customer as any)._id.toString() !== createMaintenanceDto.customerId) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.vehicleNotBelongToCustomer') : 'El vehículo no pertenece al cliente especificado');
    }

    // If an appointmentId is supplied, validate it exists
    if (createMaintenanceDto.appointmentId) {
      const appt = await this.appointmentModel.findById(createMaintenanceDto.appointmentId).exec();
      if (!appt) {
        const i18n = I18nContext.current();
        throw new BadRequestException(i18n ? i18n.t('common.errors.appointmentNotFound') : 'La cita especificada no fue encontrada');
      }
    }

    // Determine initial status:
    //  - Walk-in (no appointment) → not_started (entra directo al taller)
    //  - Linked to appointment   → awaiting_appointment (limbo hasta que la cita se complete)
    const initialStatus = createMaintenanceDto.appointmentId ? 'awaiting_appointment' : 'not_started';

    const maintenance = new this.maintenanceModel({
      ...createMaintenanceDto,
      customer: createMaintenanceDto.customerId as any,
      vehicle: createMaintenanceDto.vehicleId as any,
      appointment: createMaintenanceDto.appointmentId ? (createMaintenanceDto.appointmentId as any) : null,
      createdBy: userId as any,
      status: initialStatus,
    });

    return (await maintenance.save()).populate(['customer', 'vehicle', 'createdBy', 'appointment']);
  }

  async findAll(filters: { customerId?: string; status?: string }): Promise<MaintenanceDocument[]> {
    const query: any = {};
    if (filters.customerId) {
      query.customer = filters.customerId;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    return this.maintenanceModel
      .find(query)
      .populate(['customer', 'vehicle', 'createdBy'])
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<MaintenanceDocument> {
    if (!Types.ObjectId.isValid(id)) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.invalidMaintenanceId') : 'ID de orden de mantenimiento inválido');
    }
    const order = await this.maintenanceModel
      .findById(id)
      .populate(['customer', 'vehicle', 'createdBy', 'itemsUsed.product'])
      .exec();
    if (!order) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.maintenanceNotFound') : 'Orden de mantenimiento no encontrada');
    }
    return order;
  }

  async update(id: string, updateMaintenanceDto: UpdateMaintenanceDto): Promise<MaintenanceDocument> {
    const order = await this.findById(id);

    if (updateMaintenanceDto.status) {
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
      if (updateMaintenanceDto.status === 'completed' || updateMaintenanceDto.status === 'delivered') {
        order.endDate = new Date();
      }
    }

    if (updateMaintenanceDto.laborCost !== undefined) {
      order.laborCost = updateMaintenanceDto.laborCost;
    }

    if (updateMaintenanceDto.notes !== undefined) {
      order.notes = updateMaintenanceDto.notes;
    }

    const saved = await order.save();
    return saved.populate(['customer', 'vehicle', 'createdBy', 'appointment']);
  }

  /**
   * Called by AppointmentsService when a cita is marked as `completed`.
   * Finds any maintenance in `awaiting_appointment` linked to this appointment
   * and promotes it to `not_started` so workshop staff can begin.
   */
  async activateFromAppointment(appointmentId: string): Promise<void> {
    if (!Types.ObjectId.isValid(appointmentId)) return;

    await this.maintenanceModel
      .updateMany(
        { appointment: appointmentId, status: 'awaiting_appointment' } as any,
        { $set: { status: 'not_started' } },
      )
      .exec();
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
  ): Promise<MaintenanceDocument> {
    const maintenance = new this.maintenanceModel({
      customer: customerId as any,
      vehicle: vehicleId as any,
      appointment: appointmentId as any,
      laborCost: 0,
      notes: serviceRequested || 'Servicio programado por cita',
      status: 'awaiting_appointment',
      createdBy: null,
    });
    return maintenance.save();
  }

  async addItemUsed(id: string, addItemUsedDto: AddItemUsedDto, userId: string): Promise<MaintenanceDocument> {
    const order = await this.findById(id);

    if (order.status === 'delivered') {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.maintenanceAlreadyDelivered') : 'No se pueden añadir productos a una orden que ya fue entregada');
    }

    // Find product to check stock & prices
    const product = await this.inventoryService.findProductById(addItemUsedDto.productId);

    // Register stock movement (which deducts the stock and throws stock errors if insufficient)
    await this.inventoryService.registerMovement(
      {
        productId: addItemUsedDto.productId,
        type: 'out',
        quantity: addItemUsedDto.quantity,
        reason: `Consumo en orden de mantenimiento #${order._id}`,
      },
      userId,
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
    return saved.populate(['customer', 'vehicle', 'createdBy', 'itemsUsed.product']);
  }

  async addEvidencePhotos(id: string, stage: string, photoUrls: string[]): Promise<MaintenanceDocument> {
    const order = await this.findById(id);

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
    return saved.populate(['customer', 'vehicle', 'createdBy']);
  }

  async findClientView(serialOrPhone: string): Promise<MaintenanceDocument[]> {
    const query: any = {};
    const input = serialOrPhone.trim();

    if (Types.ObjectId.isValid(input)) {
      query._id = input;
    } else {
      // Find matching vehicles or customers first
      const vehicles = await this.vehiclesService.findAll({ search: input });
      const customers = await this.customersService.findAll(input);

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
    return this.maintenanceModel
      .find(query)
      .select('customer vehicle status laborCost evidencePhotos notes startDate endDate')
      .populate('customer', 'name')
      .populate('vehicle', 'brand model serialNumberLastFour color')
      .sort({ createdAt: -1 })
      .exec();
  }

  async remove(id: string): Promise<void> {
    const order = await this.findById(id);
    if (order.status === 'in_progress' || order.status === 'completed') {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.maintenanceCannotDelete') : 'No se puede eliminar una orden de servicio en curso o completada');
    }
    await this.maintenanceModel.findByIdAndDelete(id).exec();
  }
}
