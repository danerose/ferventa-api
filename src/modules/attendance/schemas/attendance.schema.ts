import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Branch } from '../../branches/schemas/branch.schema';

export type AttendanceDocument = Attendance & Document;

@Schema({ _id: true })
export class AttendanceBreak {
  @Prop({ required: true, type: Date })
  startTime: Date;

  @Prop({ type: Date, default: null })
  endTime?: Date;

  @Prop({ type: Number, default: 0 })
  durationMinutes?: number;

  @Prop({ type: String, default: '' })
  note?: string;
}

export const AttendanceBreakSchema =
  SchemaFactory.createForClass(AttendanceBreak);

@Schema({ timestamps: true })
export class Attendance {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: User;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Branch',
    required: true,
    index: true,
  })
  branch: Branch;

  @Prop({ required: true, type: String, index: true })
  date: string; // YYYY-MM-DD format

  @Prop({ required: true, type: Date })
  clockIn: Date;

  @Prop({ type: Date, default: null })
  clockOut?: Date;

  @Prop({ type: [AttendanceBreakSchema], default: [] })
  breaks: AttendanceBreak[];

  @Prop({
    required: true,
    type: String,
    enum: ['working', 'on_break', 'completed'],
    default: 'working',
    index: true,
  })
  status: string;

  @Prop({ type: Number, default: 0 })
  totalWorkMinutes: number;

  @Prop({ type: Number, default: 0 })
  totalBreakMinutes: number;

  @Prop({ type: Number, default: 0 })
  netWorkMinutes: number;

  @Prop({ type: String, default: '' })
  clockInNote?: string;

  @Prop({ type: String, default: '' })
  clockOutNote?: string;

  @Prop({ type: String, default: '' })
  adminNotes?: string;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
