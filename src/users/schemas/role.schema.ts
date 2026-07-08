import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoleDocument = Role & Document;

@Schema({ timestamps: true })
export class Role {
  @Prop({ required: true, unique: true, uppercase: false, lowercase: true, trim: true })
  name: string;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
