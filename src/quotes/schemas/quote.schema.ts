import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Customer } from '../../customers/schemas/customer.schema';
import { Product } from '../../inventory/schemas/product.schema';
import { User } from '../../users/schemas/user.schema';
import { Branch } from '../../branches/schemas/branch.schema';

export type QuoteDocument = Quote & Document;

@Schema({ _id: false })
export class QuoteItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  product: Product;

  @Prop({ required: true })
  sku: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: Number })
  quantity: number;

  @Prop({ required: true, type: Number })
  priceSnapshot: number; // Selling price at the time of quote

  @Prop({ type: Number, default: 0 })
  discount: number; // Unit discount amount
}

@Schema({ timestamps: true })
export class Quote {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Customer', required: true, index: true })
  customer: Customer;

  @Prop({ type: [QuoteItem], required: true })
  items: QuoteItem[];

  @Prop({ required: true, type: Number })
  subtotal: number;

  @Prop({ required: true, type: Number, default: 0 })
  discount: number; // Global discount amount

  @Prop({ required: true, type: Number })
  total: number;

  @Prop({ required: true, type: Date })
  validUntil: Date;

  @Prop({
    required: true,
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'converted_to_sale'],
    default: 'pending',
    index: true,
  })
  status: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Branch', required: true })
  branch: Branch | any;
}

export const QuoteSchema = SchemaFactory.createForClass(Quote);
