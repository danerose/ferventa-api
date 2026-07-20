import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Branch } from '../../branches/schemas/branch.schema';

export type WorkshopHolidayDocument = WorkshopHoliday & Document;

@Schema({ timestamps: true })
export class WorkshopHoliday {
  @Prop({ required: true, type: String })
  date: string; // format "YYYY-MM-DD"

  @Prop({ required: true, type: String })
  description: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Branch', required: true })
  branch: Branch | any;
}

export const WorkshopHolidaySchema = SchemaFactory.createForClass(WorkshopHoliday);

// Compound index to ensure that each branch can only have one holiday per date
WorkshopHolidaySchema.index({ date: 1, branch: 1 }, { unique: true });
