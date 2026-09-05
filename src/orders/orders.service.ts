import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AddOrderPaymentDto } from './dto/add-order-payment.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CustomersService } from '../customers/customers.service';
import { I18nContext } from 'nestjs-i18n';
import { buildFuzzyRegex } from '../common/utils/search.util';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly customersService: CustomersService,
  ) {}

  private generateFolio(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `PED-${yyyy}${mm}${dd}-${random}`;
  }

  async create(createOrderDto: CreateOrderDto, userId: string, branchId: string): Promise<OrderDocument> {
    const sellingPrice = Number(createOrderDto.sellingPrice);
    const costPrice = Number(createOrderDto.costPrice);
    const advancePayment = Number(createOrderDto.advancePayment || 0);

    if (sellingPrice <= 0) {
      throw new BadRequestException('El precio de venta debe ser mayor a 0');
    }

    // Regla de negocio: Mínimo 50% de anticipo
    const minAdvanceRequired = Math.round(sellingPrice * 0.5 * 100) / 100;

    if (advancePayment < minAdvanceRequired) {
      const currentPercent = Math.round((advancePayment / sellingPrice) * 1000) / 10;
      throw new BadRequestException(
        `El anticipo mínimo requerido es del 50% ($${minAdvanceRequired.toFixed(2)}). Se intentó registrar $${advancePayment.toFixed(2)} (${currentPercent}%).`,
      );
    }

    if (advancePayment > sellingPrice) {
      throw new BadRequestException(
        `El anticipo ($${advancePayment.toFixed(2)}) no puede exceder el precio de venta total ($${sellingPrice.toFixed(2)}).`,
      );
    }

    // Buscar o crear cliente
    let customerId = createOrderDto.customerId;
    const phone = createOrderDto.customerPhone.trim();
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
            name: createOrderDto.customerName,
            email: createOrderDto.customerEmail,
            phone: phone,
          },
          branchId,
        );
        customerId = (customer._id as any).toString();
      }
    }

    const advancePercentage = Math.round((advancePayment / sellingPrice) * 1000) / 10;
    const remainingBalance = Math.round((sellingPrice - advancePayment) * 100) / 100;
    const isFullyPaid = remainingBalance <= 0;

    const folio = this.generateFolio();

    const initialPayments: any[] = [];
    if (advancePayment > 0) {
      initialPayments.push({
        amount: advancePayment,
        paymentMethod: createOrderDto.paymentMethod || 'cash',
        paymentReference: createOrderDto.paymentReference || '',
        date: new Date(),
        receivedBy: userId as any,
        notes: 'Anticipo inicial de apartado',
      });
    }

    const initialStatusHistory = [
      {
        status: OrderStatus.ORDER_PLACED,
        changedAt: new Date(),
        changedBy: userId as any,
        notes: 'Pedido levantado con anticipo inicial',
      },
    ];

    const order = new this.orderModel({
      folio,
      customer: customerId as any,
      customerName: createOrderDto.customerName,
      customerPhone: phone,
      customerEmail: createOrderDto.customerEmail || '',
      itemDescription: createOrderDto.itemDescription,
      costPrice,
      sellingPrice,
      advancePayment,
      minAdvanceRequired,
      advancePercentage,
      remainingBalance,
      isFullyPaid,
      status: OrderStatus.ORDER_PLACED,
      notes: createOrderDto.notes || '',
      payments: initialPayments,
      statusHistory: initialStatusHistory,
      estimatedArrivalDate: createOrderDto.estimatedArrivalDate ? new Date(createOrderDto.estimatedArrivalDate) : null,
      createdBy: userId as any,
      branch: branchId as any,
    });

    const saved = await order.save();
    return saved.populate(['customer', 'createdBy', 'branch']);
  }

  async findAll(
    branchId: string,
    filters: {
      search?: string;
      status?: string;
      isFullyPaid?: boolean;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<OrderDocument[]> {
    const query: any = { branch: branchId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.isFullyPaid !== undefined) {
      query.isFullyPaid = filters.isFullyPaid;
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setUTCHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (filters.search) {
      const regex = buildFuzzyRegex(filters.search);
      query.$or = [
        { folio: { $regex: filters.search.trim(), $options: 'i' } },
        { customerName: regex },
        { customerPhone: { $regex: filters.search.trim(), $options: 'i' } },
        { itemDescription: regex },
      ];
    }

    return this.orderModel
      .find(query)
      .populate(['customer', 'createdBy', 'branch'])
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string, branchId: string): Promise<OrderDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de pedido inválido');
    }

    const order = await this.orderModel
      .findOne({ _id: id, branch: branchId })
      .populate(['customer', 'createdBy', 'branch', 'payments.receivedBy', 'statusHistory.changedBy'])
      .exec();

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return order;
  }

  async updateStatus(
    id: string,
    branchId: string,
    dto: UpdateOrderStatusDto,
    userId: string,
  ): Promise<OrderDocument> {
    const order = await this.findById(id, branchId);

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('No se puede cambiar el estado de un pedido que ya está cancelado');
    }

    order.status = dto.status;
    order.statusHistory.push({
      status: dto.status,
      changedAt: new Date(),
      changedBy: userId as any,
      notes: dto.notes || `Cambio de estado a ${dto.status}`,
    });

    const saved = await order.save();
    return saved.populate(['customer', 'createdBy', 'branch', 'payments.receivedBy', 'statusHistory.changedBy']);
  }

  async addPayment(
    id: string,
    branchId: string,
    dto: AddOrderPaymentDto,
    userId: string,
  ): Promise<OrderDocument> {
    const order = await this.findById(id, branchId);

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('No se pueden registrar pagos a un pedido cancelado');
    }

    if (order.isFullyPaid) {
      throw new BadRequestException('Este pedido ya se encuentra completamente liquidado (100%)');
    }

    const paymentAmount = Number(dto.amount);
    if (paymentAmount <= 0) {
      throw new BadRequestException('El monto del abono debe ser mayor a 0');
    }

    if (paymentAmount > order.remainingBalance) {
      throw new BadRequestException(
        `El monto ($${paymentAmount.toFixed(2)}) supera el saldo restante ($${order.remainingBalance.toFixed(2)})`,
      );
    }

    const newAdvance = Math.round((order.advancePayment + paymentAmount) * 100) / 100;
    const newRemaining = Math.round((order.sellingPrice - newAdvance) * 100) / 100;
    const newPercentage = Math.round((newAdvance / order.sellingPrice) * 1000) / 10;
    const isFullyPaid = newRemaining <= 0;

    order.advancePayment = newAdvance;
    order.remainingBalance = newRemaining;
    order.advancePercentage = newPercentage;
    order.isFullyPaid = isFullyPaid;

    order.payments.push({
      amount: paymentAmount,
      paymentMethod: dto.paymentMethod || 'cash',
      paymentReference: dto.paymentReference || '',
      date: new Date(),
      receivedBy: userId as any,
      notes: dto.notes || (isFullyPaid ? 'Liquidación total' : 'Abono parcial'),
    });

    // Registrar en historial si se liquidó
    if (isFullyPaid) {
      order.statusHistory.push({
        status: order.status,
        changedAt: new Date(),
        changedBy: userId as any,
        notes: `Pedido liquidado al 100% con abono de $${paymentAmount.toFixed(2)}`,
      });
    }

    const saved = await order.save();
    return saved.populate(['customer', 'createdBy', 'branch', 'payments.receivedBy', 'statusHistory.changedBy']);
  }

  async cancel(
    id: string,
    branchId: string,
    dto: CancelOrderDto,
    userId: string,
  ): Promise<OrderDocument> {
    const order = await this.findById(id, branchId);

    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('No se puede cancelar un pedido que ya fue entregado al cliente');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('El pedido ya se encuentra cancelado');
    }

    order.status = OrderStatus.CANCELLED;
    order.cancellationReason = dto.reason;

    order.statusHistory.push({
      status: OrderStatus.CANCELLED,
      changedAt: new Date(),
      changedBy: userId as any,
      notes: `Cancelación: ${dto.reason}`,
    });

    const saved = await order.save();
    return saved.populate(['customer', 'createdBy', 'branch', 'payments.receivedBy', 'statusHistory.changedBy']);
  }

  async update(id: string, branchId: string, dto: UpdateOrderDto): Promise<OrderDocument> {
    const order = await this.findById(id, branchId);

    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('No se puede modificar un pedido cancelado o entregado');
    }

    if (dto.itemDescription) order.itemDescription = dto.itemDescription;
    if (dto.notes !== undefined) order.notes = dto.notes;
    if (dto.estimatedArrivalDate !== undefined) {
      order.estimatedArrivalDate = dto.estimatedArrivalDate ? new Date(dto.estimatedArrivalDate) : null;
    }

    // Si cambian los precios, recalcular métricas financieras
    if (dto.sellingPrice !== undefined || dto.costPrice !== undefined) {
      if (dto.costPrice !== undefined) order.costPrice = Number(dto.costPrice);
      if (dto.sellingPrice !== undefined) {
        const newSellingPrice = Number(dto.sellingPrice);
        if (newSellingPrice <= 0) {
          throw new BadRequestException('El precio de venta debe ser mayor a 0');
        }

        order.sellingPrice = newSellingPrice;
        order.minAdvanceRequired = Math.round(newSellingPrice * 0.5 * 100) / 100;
        order.remainingBalance = Math.round((newSellingPrice - order.advancePayment) * 100) / 100;
        order.advancePercentage = Math.round((order.advancePayment / newSellingPrice) * 1000) / 10;
        order.isFullyPaid = order.remainingBalance <= 0;
      }
    }

    const saved = await order.save();
    return saved.populate(['customer', 'createdBy', 'branch', 'payments.receivedBy', 'statusHistory.changedBy']);
  }

  async getSummary(branchId: string): Promise<any> {
    const orders = await this.orderModel.find({ branch: branchId }).exec();

    const totalOrders = orders.length;
    let activeOrders = 0;
    let deliveredOrders = 0;
    let cancelledOrders = 0;
    let totalPendingBalance = 0;
    let totalCollected = 0;
    let totalSalesValue = 0;

    const byStatus: Record<string, number> = {
      [OrderStatus.ORDER_PLACED]: 0,
      [OrderStatus.ORDERED]: 0,
      [OrderStatus.IN_TRANSIT]: 0,
      [OrderStatus.IN_BRANCH]: 0,
      [OrderStatus.READY_FOR_PICKUP]: 0,
      [OrderStatus.DELIVERED]: 0,
      [OrderStatus.CANCELLED]: 0,
    };

    for (const ord of orders) {
      if (byStatus[ord.status] !== undefined) {
        byStatus[ord.status]++;
      }

      if (ord.status === OrderStatus.CANCELLED) {
        cancelledOrders++;
      } else if (ord.status === OrderStatus.DELIVERED) {
        deliveredOrders++;
        totalCollected += ord.advancePayment;
        totalSalesValue += ord.sellingPrice;
      } else {
        activeOrders++;
        totalPendingBalance += Math.max(0, ord.remainingBalance);
        totalCollected += ord.advancePayment;
        totalSalesValue += ord.sellingPrice;
      }
    }

    return {
      totalOrders,
      activeOrders,
      deliveredOrders,
      cancelledOrders,
      totalPendingBalance: Math.round(totalPendingBalance * 100) / 100,
      totalCollected: Math.round(totalCollected * 100) / 100,
      totalSalesValue: Math.round(totalSalesValue * 100) / 100,
      byStatus,
    };
  }
}
