import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Customer } from '../../customers/schemas/customer.schema';
import { User } from '../../users/schemas/user.schema';
import { Branch } from '../../branches/schemas/branch.schema';

export type OrderDocument = Order & Document;

export enum OrderStatus {
  ORDER_PLACED = 'order_placed', // Pedido Levantado
  ORDERED = 'ordered', // Pedido (Solicitado al proveedor)
  IN_TRANSIT = 'in_transit', // En tránsito
  IN_BRANCH = 'in_branch', // En Sucursal
  READY_FOR_PICKUP = 'ready_for_pickup', // Pendiente de entrega
  DELIVERED = 'delivered', // Entregado
  CANCELLED = 'cancelled', // Cancelado
}

@Schema({ _id: false })
export class OrderPayment {
  @Prop({ required: true, type: Number })
  amount: number;

  @Prop({
    required: true,
    type: String,
    enum: ['cash', 'card', 'transfer'],
    default: 'cash',
  })
  paymentMethod: string;

  @Prop({ type: String, default: '' })
  paymentReference?: string;

  @Prop({ type: Date, default: Date.now })
  date: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
  })
  receivedBy?: User | null;

  @Prop({ type: String, default: '' })
  notes?: string;
}

@Schema({ _id: false })
export class OrderStatusHistory {
  @Prop({ required: true, type: String })
  status: string;

  @Prop({ type: Date, default: Date.now })
  changedAt: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
  })
  changedBy?: User | null;

  @Prop({ type: String, default: '' })
  notes?: string;
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true, index: true })
  folio: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true,
  })
  customer: Customer;

  @Prop({ required: true, trim: true })
  customerName: string;

  @Prop({ required: true, trim: true, index: true })
  customerPhone: string;

  @Prop({ type: String, trim: true, lowercase: true, default: '' })
  customerEmail?: string;

  @Prop({ required: true, trim: true })
  itemDescription: string;

  @Prop({ required: true, type: Number, min: 0 })
  costPrice: number; // Precio de lista / costo de compra

  @Prop({ required: true, type: Number, min: 0 })
  sellingPrice: number; // Precio de venta al cliente

  @Prop({ required: true, type: Number, default: 0, min: 0 })
  advancePayment: number; // Monto acumulado de anticipo/abonos

  @Prop({ required: true, type: Number })
  minAdvanceRequired: number; // Mínimo 50% del precio de venta

  @Prop({ required: true, type: Number })
  advancePercentage: number; // Porcentaje pagado (ej. 50, 75, 100)

  @Prop({ required: true, type: Number })
  remainingBalance: number; // Saldo restante por pagar

  @Prop({ required: true, type: Boolean, default: false })
  isFullyPaid: boolean; // ¿Está liquidado?

  @Prop({
    required: true,
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.ORDER_PLACED,
    index: true,
  })
  status: string;

  @Prop({ type: String, default: '' })
  cancellationReason?: string;

  @Prop({ type: String, default: '' })
  notes: string;

  @Prop({ type: [OrderPayment], default: [] })
  payments: OrderPayment[];

  @Prop({ type: [OrderStatusHistory], default: [] })
  statusHistory: OrderStatusHistory[];

  @Prop({ type: Date, default: null })
  estimatedArrivalDate?: Date | null;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
  })
  createdBy?: User | null;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Branch',
    required: true,
    index: true,
  })
  branch: Branch | any;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
