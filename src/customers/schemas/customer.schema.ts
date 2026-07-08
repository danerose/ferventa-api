import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CustomerDocument = Customer & Document;

@Schema({ timestamps: true })
export class Customer {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: String, unique: true, sparse: true, lowercase: true, trim: true })
  email?: string;

  @Prop({ required: true, unique: true, trim: true, index: true })
  phone: string;

  @Prop({ type: String, default: '' })
  whatsappId?: string;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
