import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Branch } from '../../branches/schemas/branch.schema';

export type WorkshopScheduleDocument = WorkshopSchedule & Document;

@Schema({ timestamps: true })
export class WorkshopSchedule {
  @Prop({ required: true, type: Number })
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  @Prop({ required: true, type: Boolean, default: true })
  isWorking: boolean;

  @Prop({ required: true, type: String, default: '08:00' })
  startTime: string; // e.g. "08:00"

  @Prop({ required: true, type: String, default: '18:00' })
  endTime: string; // e.g. "18:00"

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Branch', required: true })
  branch: Branch | any;
}

export const WorkshopScheduleSchema = SchemaFactory.createForClass(WorkshopSchedule);

// Compound index to ensure that each branch can only have one schedule per dayOfWeek
WorkshopScheduleSchema.index({ dayOfWeek: 1, branch: 1 }, { unique: true });
