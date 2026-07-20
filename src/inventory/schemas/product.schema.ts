import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Brand } from './brand.schema';
import { Category } from './category.schema';
import { Provider } from './provider.schema';
import { Branch } from '../../branches/schemas/branch.schema';
export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, unique: true, trim: true, index: true })
  sku: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Branch', required: true })
  branch: Branch | any;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Brand', required: true })
  brand: Brand;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category', required: true })
  category: Category;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Provider', required: true })
  provider: Provider;

  @Prop({ required: true, type: Number })
  costPrice: number;

  @Prop({ required: true, type: Number })
  sellingPrice: number;

  @Prop({ required: true, type: Number, default: 0 })
  stock: number;

  @Prop({ required: true, type: Number, default: 5 })
  minStock: number;

  @Prop({ required: true, type: String, default: 'piece' })
  unit: string;

  @Prop({ type: [String], default: [] })
  photos: string[];

  @Prop({ type: [String], default: [] })
  compatibility: string[];

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
