import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Product } from './product.schema';
import { User } from '../../users/schemas/user.schema';
import { Provider } from './provider.schema';
import { Branch } from '../../branches/schemas/branch.schema';

export type StockMovementDocument = StockMovement & Document;

@Schema({ timestamps: true })
export class StockMovement {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true, index: true })
  product: Product;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Provider' })
  provider: Provider;

  @Prop({ required: true, type: String, enum: ['in', 'out', 'adjustment'] })
  type: string;

  @Prop({ required: true, type: Number })
  quantity: number;

  @Prop({ required: true, type: String })
  reason: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  performedBy: User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Branch', required: true })
  branch: Branch | any;
}

export const StockMovementSchema = SchemaFactory.createForClass(StockMovement);
