import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from './schemas/session.schema';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {}

  async create(
    userId: string,
    ip: string,
    userAgent: string,
    expireAt: Date,
    wasSuccessful: boolean,
    failureReason?: string,
  ): Promise<SessionDocument> {
    return this.sessionModel.create({
      user: userId as any,
      ip,
      userAgent,
      expireAt,
      wasSuccessful,
      failureReason: failureReason || null,
    });
  }

  async findActiveByUser(userId: string): Promise<SessionDocument[]> {
    return this.sessionModel
      .find({
        user: userId as any,
        wasSuccessful: true,
        isRevoked: false,
        expireAt: { $gt: new Date() },
      })
      .sort({ loginAt: -1 })
      .exec();
  }

  async findActiveAll(): Promise<SessionDocument[]> {
    return this.sessionModel
      .find({
        wasSuccessful: true,
        isRevoked: false,
        expireAt: { $gt: new Date() },
      })
      .populate('user', 'name email')
      .sort({ loginAt: -1 })
      .exec();
  }

  async revoke(sessionId: string, userId: string, isAdmin: boolean): Promise<void> {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.sessionNotFound') : 'Sesión no encontrada');
    }

    if (!isAdmin && session.user.toString() !== userId) {
      const i18n = I18nContext.current();
      throw new ForbiddenException(i18n ? i18n.t('common.errors.forbidden') : 'No tienes permisos para revocar esta sesión');
    }

    session.isRevoked = true;
    await session.save();
  }

  async isValid(sessionId: string): Promise<boolean> {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) return false;
    return session.wasSuccessful && !session.isRevoked && session.expireAt > new Date();
  }
}
