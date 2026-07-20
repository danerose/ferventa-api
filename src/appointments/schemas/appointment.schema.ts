import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Customer } from '../../customers/schemas/customer.schema';
import { Branch } from '../../branches/schemas/branch.schema';
export type AppointmentDocument = Appointment & Document;

@Schema({ _id: false })
export class AppointmentVehicle {
  @Prop({ required: true, trim: true })
  brand: string;

  @Prop({ required: true, trim: true })
  model: string;

  @Prop({ required: true, type: Number })
  year: number;

  @Prop({ required: true, trim: true, uppercase: true })
  serialNumberLastFour: string;
}

@Schema({ timestamps: true })
export class Appointment {
  @Prop({ required: true, trim: true })
  customerName: string;

  @Prop({ required: true, trim: true, index: true })
  customerPhone: string;

  @Prop({ type: String, trim: true, lowercase: true })
  customerEmail?: string;

  @Prop({ type: String, default: '' })
  whatsappId?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Customer', required: false })
  customer?: Customer;

  @Prop({ type: AppointmentVehicle, required: true })
  vehicle: AppointmentVehicle;

  @Prop({ required: true, trim: true })
  serviceRequested: string;

  @Prop({ required: true, type: Date, index: true })
  scheduledAt: Date;

  @Prop({ type: Number, default: 15 })
  duration: number; // in minutes

  @Prop({ type: String, default: null })
  assignedMechanic?: string | null;

  @Prop({
    required: true,
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed', 'rescheduled'],
    default: 'pending',
  })
  status: string;

  @Prop({ type: String, default: '' })
  notes: string;

  @Prop({ type: String, trim: true })
  branchName?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Branch', required: true })
  branch: Branch | any;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
