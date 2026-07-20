import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Customer } from '../../customers/schemas/customer.schema';
import { Quote } from '../../quotes/schemas/quote.schema';
import { Product } from '../../inventory/schemas/product.schema';
import { User } from '../../users/schemas/user.schema';
import { Branch } from '../../branches/schemas/branch.schema';

export type SaleDocument = Sale & Document;

@Schema({ _id: false })
export class SaleItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  product: Product;

  @Prop({ required: true })
  sku: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: Number })
  quantity: number;

  @Prop({ required: true, type: Number })
  priceSnapshot: number; // Selling price at the time of sale

  @Prop({ type: Number, default: 0 })
  discount: number; // Unit discount amount
}

@Schema({ timestamps: true })
export class Sale {
  @Prop({ required: true, unique: true, index: true, trim: true })
  folio: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Customer', required: true, index: true })
  customer: Customer;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Quote', required: false, index: true })
  quoteRef?: Quote;

  @Prop({ type: [SaleItem], required: true })
  items: SaleItem[];

  @Prop({ required: true, type: Number })
  subtotal: number;

  @Prop({ required: true, type: Number, default: 0 })
  discount: number; // Global discount

  @Prop({ required: true, type: Number })
  total: number;

  @Prop({ required: true, type: String, enum: ['cash', 'card'] })
  paymentMethod: string;

  @Prop({ type: String, default: '' })
  paymentReference?: string; // e.g. Mercado Pago Reference ID

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  seller: User;

  @Prop({ type: Boolean, default: false })
  isCancelled: boolean;

  @Prop({ type: Date, default: null })
  cancelledAt: Date | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  cancelledBy?: User;

  @Prop({ type: String, default: '' })
  cancelReason: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Branch', required: true })
  branch: Branch | any;
}

export const SaleSchema = SchemaFactory.createForClass(Sale);
