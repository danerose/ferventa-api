import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Branch } from '../../branches/schemas/branch.schema';

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

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Branch', required: true })
  branch: Branch | any;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
