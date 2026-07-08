import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WorkshopScheduleDocument = WorkshopSchedule & Document;

@Schema({ timestamps: true })
export class WorkshopSchedule {
  @Prop({ required: true, type: Number, unique: true })
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  @Prop({ required: true, type: Boolean, default: true })
  isWorking: boolean;

  @Prop({ required: true, type: String, default: '08:00' })
  startTime: string; // e.g. "08:00"

  @Prop({ required: true, type: String, default: '18:00' })
  endTime: string; // e.g. "18:00"
}

export const WorkshopScheduleSchema = SchemaFactory.createForClass(WorkshopSchedule);
