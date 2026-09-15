import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Product } from './product.schema';
import { Provider } from './provider.schema';
import { User } from '../../users/schemas/user.schema';
import { Branch } from '../../branches/schemas/branch.schema';

export type StockReceptionDocument = StockReception & Document;

@Schema({ _id: true, timestamps: true })
export class ReceptionItem {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  product: Product;

  @Prop({ required: true, trim: true })
  sku: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, type: Number })
  quantity: number;

  @Prop({ required: true, type: Number })
  costPrice: number;

  @Prop({ required: true, type: Number })
  sellingPrice: number;

  /** Código único asignado a este bulto/caja para impresión de ticket QR */
  @Prop({ required: true, trim: true, index: true })
  boxCode: string;

  /** Indica si la caja sigue sellada en bodega (true) o si ya fue abierta para venta en mostrador (false) */
  @Prop({ type: Boolean, default: true })
  isBoxSealed: boolean;

  @Prop({ type: Date, default: null })
  openedAt?: Date | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  openedBy?: User | null;
}

export const ReceptionItemSchema = SchemaFactory.createForClass(ReceptionItem);

@Schema({ timestamps: true })
export class StockReception {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Branch',
    required: true,
    index: true,
  })
  branch: Branch | any;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Provider',
    required: false,
    default: null,
  })
  provider?: Provider | null;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  receivedBy: User;

  @Prop({
    required: true,
    type: String,
    enum: ['draft', 'approved', 'rejected'],
    default: 'draft',
    index: true,
  })
  status: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    default: null,
  })
  approvedBy?: User | null;

  @Prop({ type: Date, default: null })
  approvedAt?: Date | null;

  @Prop({ type: String, default: '' })
  rejectionReason?: string;

  @Prop({ type: [ReceptionItemSchema], default: [] })
  items: ReceptionItem[];

  @Prop({ type: String, default: '', trim: true })
  invoiceOrFolio?: string;

  @Prop({ type: String, default: '', trim: true })
  notes?: string;
}

export const StockReceptionSchema = SchemaFactory.createForClass(StockReception);
