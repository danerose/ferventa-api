import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { buildFuzzyRegex } from '../../common/utils/search.util';

export interface AuditLogFilters {
  module?: string;
  action?: string;
  userId?: string;
  entityId?: string;
  entityType?: string;
  from?: string;
  to?: string;
  search?: string;
}

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private auditLogModel: Model<AuditLogDocument>,
  ) {}

  /**
   * Log an action safely without interrupting the main application request
   */
  async logAction(params: {
    module: string;
    action: string;
    description: string;
    performedBy?: string;
    branchId?: string;
    entityId?: string;
    entityType?: string;
    entityFolio?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await this.auditLogModel.create({
        module: params.module,
        action: params.action,
        description: params.description,
        performedBy: params.performedBy ? (params.performedBy as any) : null,
        branch: params.branchId ? (params.branchId as any) : null,
        entityId: params.entityId || '',
        entityType: params.entityType || '',
        entityFolio: params.entityFolio || '',
        metadata: params.metadata || {},
      });
    } catch (err: any) {
      this.logger.error(`Error saving audit log: ${err?.message || err}`);
    }
  }

  async findAll(
    branchId: string,
    filters: AuditLogFilters,
  ): Promise<AuditLogDocument[]> {
    const query: any = { branch: branchId };

    if (filters.module) {
      query.module = filters.module;
    }

    if (filters.action) {
      query.action = filters.action;
    }

    if (filters.userId) {
      query.performedBy = filters.userId;
    }

    if (filters.entityId) {
      query.entityId = filters.entityId;
    }

    if (filters.entityType) {
      query.entityType = filters.entityType;
    }

    if (filters.from || filters.to) {
      const dateRange: any = {};
      if (filters.from) {
        dateRange.$gte = new Date(`${filters.from}T00:00:00.000Z`);
      }
      if (filters.to) {
        dateRange.$lte = new Date(`${filters.to}T23:59:59.999Z`);
      }
      query.createdAt = dateRange;
    }

    if (filters.search && filters.search.trim()) {
      const regex = buildFuzzyRegex(filters.search.trim());
      query.$or = [{ description: regex }, { entityFolio: regex }, { action: regex }];
    }

    return this.auditLogModel
      .find(query)
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(200)
      .exec();
  }
}
