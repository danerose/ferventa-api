import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Branch } from '../../branches/schemas/branch.schema';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class AuditLog {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Branch',
    required: false,
    index: true,
  })
  branch?: Branch | any;

  @Prop({
    required: true,
    type: String,
    enum: [
      'appointments',
      'sales',
      'maintenance',
      'inventory',
      'orders',
      'attendance',
      'users',
    ],
    index: true,
  })
  module: string;

  @Prop({
    required: true,
    type: String,
    index: true,
  })
  action: string; // 'created', 'updated', 'cancelled', 'rejected', 'approved', 'deleted', 'collected', 'box_opened', etc.

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
    index: true,
  })
  performedBy?: User | null;

  @Prop({ type: String, required: false, default: '', index: true })
  entityId?: string;

  @Prop({ type: String, required: false, default: '', index: true })
  entityType?: string;

  @Prop({ type: String, required: false, default: '', index: true })
  entityFolio?: string;

  @Prop({ required: true, type: String })
  description: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ module: 1, action: 1, createdAt: -1 });
