import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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

  async getMaintenanceSummary(branchId?: string) {
    const matchStage: any = {
      status: { $nin: ['awaiting_appointment'] },
    };
    if (branchId && Types.ObjectId.isValid(branchId)) {
      matchStage.branch = new Types.ObjectId(branchId);
    }

    const stats = await this.maintenanceModel.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'appointments',
          localField: 'appointment',
          foreignField: '_id',
          as: 'apptDoc',
        },
      },
      {
        $match: {
          $or: [
            { appointment: null },
            { 'apptDoc.0.status': { $in: ['approved', 'completed', 'rescheduled'] } },
          ],
        },
      },
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

  async getMaintenanceMetrics(branchId?: string, start?: string, end?: string) {
    const matchQuery: any = {
      // Excluir órdenes en limbo de cita no completada
      status: { $nin: ['awaiting_appointment'] },
    };
    if (branchId) {
      matchQuery.branch = branchId;
    }

    if (start || end) {
      const dateRange: any = {};
      if (start) dateRange.$gte = new Date(start);
      if (end) {
        const toDate = new Date(end);
        toDate.setUTCHours(23, 59, 59, 999);
        dateRange.$lte = toDate;
      }
      matchQuery.$or = [
        { receptionDate: dateRange },
        { receptionDate: null, startDate: dateRange },
        { receptionDate: null, startDate: null, createdAt: dateRange },
      ];
    }

    const rawOrders = await this.maintenanceModel
      .find(matchQuery)
      .populate('customer', 'name phone')
      .populate('vehicle', 'brand model serialNumberLastFour')
      .populate('appointment', 'status')
      .exec();

    // Only include orders without a linked appointment (walk-in) or with an approved/completed/rescheduled appointment
    const orders = rawOrders.filter((o) => {
      if (!o.appointment) return true;
      const apptStatus = (o.appointment as any)?.status;
      return apptStatus === 'approved' || apptStatus === 'completed' || apptStatus === 'rescheduled';
    });

    let totalQueueHours = 0;
    let queueCount = 0;
    let totalWorkHours = 0;
    let workCount = 0;
    let totalPickupHours = 0;
    let pickupCount = 0;
    let totalStayHours = 0;
    let stayCount = 0;

    let completedInRangeCount = 0;
    let deliveredInRangeCount = 0;

    orders.forEach((o) => {
      const recDate = o.receptionDate || o.startDate || (o as any).createdAt;
      const started = o.startedAt;
      const compDate = o.completedAt || o.endDate;
      const delivDate = o.deliveredAt || (o.status === 'delivered' ? o.endDate : null);

      if (recDate && started) {
        const diffMs = new Date(started).getTime() - new Date(recDate).getTime();
        if (diffMs >= 0) {
          totalQueueHours += diffMs / (1000 * 60 * 60);
          queueCount++;
        }
      }

      if (started && compDate) {
        const diffMs = new Date(compDate).getTime() - new Date(started).getTime();
        if (diffMs >= 0) {
          totalWorkHours += diffMs / (1000 * 60 * 60);
          workCount++;
        }
      }

      if (compDate && delivDate) {
        const diffMs = new Date(delivDate).getTime() - new Date(compDate).getTime();
        if (diffMs >= 0) {
          totalPickupHours += diffMs / (1000 * 60 * 60);
          pickupCount++;
        }
      }

      if (recDate && delivDate) {
        const diffMs = new Date(delivDate).getTime() - new Date(recDate).getTime();
        if (diffMs >= 0) {
          totalStayHours += diffMs / (1000 * 60 * 60);
          stayCount++;
        }
      }

      if (o.status === 'completed' || o.status === 'delivered') {
        completedInRangeCount++;
      }
      if (o.status === 'delivered') {
        deliveredInRangeCount++;
      }
    });

    // Find all vehicles currently in 'completed' status awaiting pickup (excluding non-approved/cancelled appointments)
    const rawPendingPickupOrders = await this.maintenanceModel
      .find({ branch: branchId, status: 'completed' })
      .populate('customer', 'name phone')
      .populate('vehicle', 'brand model serialNumberLastFour')
      .populate('appointment', 'status')
      .sort({ updatedAt: 1 })
      .exec();

    const pendingPickupOrders = rawPendingPickupOrders.filter((order) => {
      if (!order.appointment) return true;
      const apptStatus = (order.appointment as any)?.status;
      return apptStatus === 'approved' || apptStatus === 'completed' || apptStatus === 'rescheduled';
    });

    const now = Date.now();
    const pendingPickupVehicles = pendingPickupOrders.map((order) => {
      const finishDate = order.completedAt || order.endDate || (order as any).updatedAt || (order as any).createdAt;
      const finishMs = finishDate ? new Date(finishDate).getTime() : now;
      const daysWaiting = Math.max(0, Math.floor((now - finishMs) / (1000 * 60 * 60 * 24)));

      const notifiedDate = order.notifiedAt ? new Date(order.notifiedAt).getTime() : null;
      const daysSinceNotified = notifiedDate ? Math.max(0, Math.floor((now - notifiedDate) / (1000 * 60 * 60 * 24))) : null;

      return {
        _id: order._id,
        customerName: (order.customer as any)?.name || 'Cliente sin nombre',
        customerPhone: (order.customer as any)?.phone || 'Sin teléfono',
        vehicle: `${(order.vehicle as any)?.brand || ''} ${(order.vehicle as any)?.model || ''} (${(order.vehicle as any)?.serialNumberLastFour || ''})`.trim(),
        completedAt: finishDate,
        notifiedAt: order.notifiedAt || null,
        daysWaiting,
        daysSinceNotified,
        notes: order.notes,
      };
    });

    return {
      volume: {
        totalReceived: orders.length,
        totalCompleted: completedInRangeCount,
        totalDelivered: deliveredInRangeCount,
        pendingPickupCount: pendingPickupOrders.length,
      },
      averages: {
        avgQueueHours: queueCount > 0 ? +(totalQueueHours / queueCount).toFixed(1) : 0,
        avgQueueDays: queueCount > 0 ? +(totalQueueHours / queueCount / 24).toFixed(1) : 0,
        avgWorkHours: workCount > 0 ? +(totalWorkHours / workCount).toFixed(1) : 0,
        avgWorkDays: workCount > 0 ? +(totalWorkHours / workCount / 24).toFixed(1) : 0,
        avgPickupHours: pickupCount > 0 ? +(totalPickupHours / pickupCount).toFixed(1) : 0,
        avgPickupDays: pickupCount > 0 ? +(totalPickupHours / pickupCount / 24).toFixed(1) : 0,
        avgTotalStayHours: stayCount > 0 ? +(totalStayHours / stayCount).toFixed(1) : 0,
        avgTotalStayDays: stayCount > 0 ? +(totalStayHours / stayCount / 24).toFixed(1) : 0,
      },
      pendingPickupVehicles,
    };
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
