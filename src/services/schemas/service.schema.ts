import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Product } from '../../inventory/schemas/product.schema';

export type PredefinedServiceDocument = PredefinedService & Document;

@Schema({ _id: false })
export class ServiceSupply {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  product: Product;

  @Prop({ required: true, type: Number })
  quantity: number;
}

@Schema({ timestamps: true })
export class PredefinedService {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ required: true, type: Number })
  basePrice: number;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: [ServiceSupply], default: [] })
  supplies: ServiceSupply[];
}

export const PredefinedServiceSchema = SchemaFactory.createForClass(PredefinedService);
