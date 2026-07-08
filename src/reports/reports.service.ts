import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sale, SaleDocument } from '../sales/schemas/sale.schema';
import { StockMovement, StockMovementDocument } from '../inventory/schemas/stock-movement.schema';
import { Maintenance, MaintenanceDocument } from '../maintenance/schemas/maintenance.schema';
import { Appointment, AppointmentDocument } from '../appointments/schemas/appointment.schema';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
    @InjectModel(StockMovement.name) private movementModel: Model<StockMovementDocument>,
    @InjectModel(Maintenance.name) private maintenanceModel: Model<MaintenanceDocument>,
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
  ) {}

  async getSalesSummary(start: string, end: string) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.invalidDateFormat') : 'Formato de fecha inválido');
    }

    // Ensure endDate covers the entire end day in UTC
    endDate.setUTCHours(23, 59, 59, 999);

    const matchStage = {
      createdAt: { $gte: startDate, $lte: endDate },
      isCancelled: false,
    };

    // 1. Total revenue and sales count
    const totalStats = await this.saleModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          subtotal: { $sum: '$subtotal' },
          discount: { $sum: '$discount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // 2. Revenue grouped by Payment Method
    const paymentStats = await this.saleModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$paymentMethod',
          revenue: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
    ]);

    // 3. Sales grouped by day
    const dailyStats = await this.saleModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      summary: totalStats[0] || { totalRevenue: 0, subtotal: 0, discount: 0, count: 0 },
      byPaymentMethod: paymentStats.reduce((acc, curr) => {
        acc[curr._id] = { revenue: curr.revenue, count: curr.count };
        return acc;
      }, {}),
      dailySales: dailyStats.map(item => ({ date: item._id, revenue: item.revenue, count: item.count })),
    };
  }

  async getTopProducts(start: string, end: string, limitValue = 5) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setUTCHours(23, 59, 59, 999);

    const stats = await this.saleModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          isCancelled: false,
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          sku: { $first: '$items.sku' },
          name: { $first: '$items.name' },
          totalQty: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.priceSnapshot', '$items.quantity'] } },
        },
      },
      { $sort: { totalQty: -1 } },
      { $limit: limitValue },
    ]);

    return stats;
  }

  async getMaintenanceSummary() {
    const stats = await this.maintenanceModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgLaborCost: { $avg: '$laborCost' },
        },
      },
    ]);

    return stats.reduce((acc, curr) => {
      acc[curr._id] = { count: curr.count, avgLaborCost: Math.round(curr.avgLaborCost) };
      return acc;
    }, {});
  }

  async getAppointmentsSummary(start: string, end: string) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setUTCHours(23, 59, 59, 999);

    const stats = await this.appointmentModel.aggregate([
      {
        $match: {
          scheduledAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    return stats.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});
  }
}
