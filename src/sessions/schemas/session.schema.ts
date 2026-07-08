import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type SessionDocument = Session & Document;

@Schema({ timestamps: true })
export class Session {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  user: User;

  @Prop({ required: true })
  ip: string;

  @Prop({ required: true })
  userAgent: string;

  @Prop({ type: Date, default: Date.now })
  loginAt: Date;

  @Prop({ type: Date, required: true })
  expireAt: Date;

  @Prop({ type: Boolean, default: false })
  isRevoked: boolean;

  @Prop({ type: Boolean, required: true })
  wasSuccessful: boolean;

  @Prop({ type: String, default: null })
  failureReason: string | null;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// TTL index to automatically remove expired sessions from MongoDB
SessionSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
