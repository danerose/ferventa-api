import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Customer } from '../../customers/schemas/customer.schema';
import { Vehicle } from '../../vehicles/schemas/vehicle.schema';
import { Product } from '../../inventory/schemas/product.schema';
import { User } from '../../users/schemas/user.schema';

export type MaintenanceDocument = Maintenance & Document;

@Schema({ _id: false })
export class ProductUsed {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  product: Product;

  @Prop({ required: true })
  sku: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: Number })
  quantity: number;

  @Prop({ required: true, type: Number })
  costPriceSnapshot: number;

  @Prop({ required: true, type: Number })
  sellingPriceSnapshot: number;
}

@Schema({ _id: false })
export class EvidencePhoto {
  @Prop({ required: true, trim: true })
  stage: string; // e.g., 'reception', 'disassembly', 'completed'

  @Prop({ type: [String], default: [] })
  photos: string[]; // URLs or paths to uploaded photos

  @Prop({ type: Date, default: Date.now })
  uploadedAt: Date;
}

@Schema({ timestamps: true })
export class Maintenance {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Customer', required: true, index: true })
  customer: Customer;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Vehicle', required: true, index: true })
  vehicle: Vehicle;

  @Prop({
    required: true,
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'delivered'],
    default: 'not_started',
    index: true,
  })
  status: string;

  @Prop({ required: true, type: Number, default: 0 })
  laborCost: number;

  @Prop({ type: [ProductUsed], default: [] })
  itemsUsed: ProductUsed[];

  @Prop({ type: [EvidencePhoto], default: [] })
  evidencePhotos: EvidencePhoto[];

  @Prop({ type: String, default: '' })
  notes: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: User;

  @Prop({ type: Date, default: Date.now })
  startDate: Date;

  @Prop({ type: Date, default: null })
  endDate: Date | null;
}

export const MaintenanceSchema = SchemaFactory.createForClass(Maintenance);
