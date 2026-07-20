import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Customer } from '../../customers/schemas/customer.schema';
import { Branch } from '../../branches/schemas/branch.schema';

export type VehicleDocument = Vehicle & Document;

@Schema({ timestamps: true })
export class Vehicle {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Customer', required: true, index: true })
  customer: Customer;

  @Prop({ required: true, trim: true })
  brand: string;

  @Prop({ required: true, trim: true })
  model: string;

  @Prop({ required: true, type: Number })
  year: number;

  @Prop({ required: true, unique: true, trim: true, uppercase: true, index: true })
  serialNumberLastFour: string;

  @Prop({ type: String, default: '' })
  color: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Branch', required: true })
  branch: Branch | any;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);
