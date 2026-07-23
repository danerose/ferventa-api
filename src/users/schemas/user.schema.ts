import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Role } from './role.schema';
import { Branch } from '../../branches/schemas/branch.schema';
export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: false, unique: true, lowercase: true, trim: true, sparse: true, index: true })
  username?: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Role', required: true })
  role: Role;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Branch' }], default: [] })
  branches: Branch[];

  @Prop({ required: false, trim: true, default: '' })
  phone?: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  @Prop({ type: Date, default: null })
  lastLoginAt: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Ensure index for soft deletes and lookup performance
UserSchema.index({ email: 1, deletedAt: 1 });
UserSchema.index({ username: 1, deletedAt: 1 }, { sparse: true });
