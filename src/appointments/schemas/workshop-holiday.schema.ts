import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WorkshopHolidayDocument = WorkshopHoliday & Document;

@Schema({ timestamps: true })
export class WorkshopHoliday {
  @Prop({ required: true, type: String, unique: true })
  date: string; // format "YYYY-MM-DD"

  @Prop({ required: true, type: String })
  description: string;
}

export const WorkshopHolidaySchema = SchemaFactory.createForClass(WorkshopHoliday);
