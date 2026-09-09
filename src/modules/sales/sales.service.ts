import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Sale, SaleDocument, SaleItem } from './schemas/sale.schema';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CancelSaleDto } from './dto/cancel-sale.dto';
import { SalesStatsQueryDto } from './dto/sales-stats-query.dto';
import { CustomersService } from '../customers/customers.service';
import { InventoryService } from '../inventory/inventory.service';
import { QuotesService } from '../quotes/quotes.service';
import { MercadoPagoService } from './mercado-pago.service';
import { ServicesService } from '../services/services.service';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
    private readonly customersService: CustomersService,
    private readonly inventoryService: InventoryService,
    private readonly quotesService: QuotesService,
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly servicesService: ServicesService,
  ) {}

  async create(
    createSaleDto: CreateSaleDto,
    userId: string,
    branchId: string,
  ): Promise<SaleDocument> {
    const folio = this.generateFolio();
    let customerId = createSaleDto.customerId;
    const saleItems: SaleItem[] = [];
    let subtotal = 0;
    let discount = 0;
    let quoteRef: string | undefined = undefined;

    // 1. If sale originates from a Quote
    if (createSaleDto.quoteId) {
      const quote = await this.quotesService.findById(
        createSaleDto.quoteId,
        branchId,
      );

      if (quote.status === 'converted_to_sale') {
        const i18n = I18nContext.current();
        throw new BadRequestException(
          i18n
            ? i18n.t('common.errors.quoteAlreadyConverted')
            : 'Esta cotización ya fue convertida en venta',
        );
      }

      if (quote.validUntil < new Date()) {
        const i18n = I18nContext.current();
        throw new BadRequestException(
          i18n
            ? i18n.t('common.errors.quoteExpired')
            : 'La cotización especificada ya ha expirado',
        );
      }

      customerId = (quote.customer as any)._id.toString();
      subtotal = quote.subtotal;
      discount = quote.discount;
      quoteRef = (quote._id as any).toString();

      // Check stock for all items
      for (const item of quote.items) {
        const product = await this.inventoryService.findProductById(
          (item.product as any)._id.toString(),
          branchId,
        );
        if (product.stock < item.quantity) {
          const i18n = I18nContext.current();
          const message = i18n
            ? i18n.t('common.errors.insufficientStockProduct', {
                args: {
                  name: product.name,
                  stock: product.stock,
                  required: item.quantity,
                },
              })
            : `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Cotizado: ${item.quantity}`;
          throw new BadRequestException(message);
        }
      }

      // Deduct stock and register movements
      for (const item of quote.items) {
        await this.inventoryService.registerMovement(
          {
            productId: (item.product as any)._id.toString(),
            type: 'out',
            quantity: item.quantity,
            reason: `Venta Folio #${folio} (Conversión de cotización)`,
          },
          userId,
          branchId,
        );

        saleItems.push({
          type: 'product',
          product: (item.product as any)._id,
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          priceSnapshot: item.priceSnapshot,
          discount: item.discount,
          origin: 'direct',
        });
      }

      // Mark quote as converted
      await this.quotesService.changeStatus(
        createQuoteDtoId(quote),
        'converted_to_sale',
      );
    } else {
      // 2. Direct POS sale (no quote)
      if (!createSaleDto.items || createSaleDto.items.length === 0) {
        const i18n = I18nContext.current();
        throw new BadRequestException(
          i18n
            ? i18n.t('common.errors.atLeastOneProductRequired')
            : 'Se requiere al menos un producto o servicio para registrar la venta',
        );
      }

      if (customerId) {
        await this.customersService.findById(customerId, branchId);
      }

      let itemsDiscount = 0;

      // First pass: Verify everything (Stock and existence)
      for (const item of createSaleDto.items) {
        if (item.type === 'product') {
          if (!item.productId)
            throw new BadRequestException(
              'Falta el productId en un ítem de tipo producto',
            );
          const product = await this.inventoryService.findProductById(
            item.productId,
            branchId,
          );
          if (product.stock < item.quantity) {
            const i18n = I18nContext.current();
            const message = i18n
              ? i18n.t('common.errors.insufficientStockProduct', {
                  args: {
                    name: product.name,
                    stock: product.stock,
                    required: item.quantity,
                  },
                })
              : `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`;
            throw new BadRequestException(message);
          }
        } else if (item.type === 'service') {
          if (item.serviceId) {
            const service = await this.servicesService.findById(item.serviceId);
            if (!service.isActive) {
              throw new BadRequestException(
                `El servicio ${service.name} no está activo.`,
              );
            }
          } else {
            if (!item.name || !item.name.trim()) {
              throw new BadRequestException(
                'Falta el campo name para el servicio temporal',
              );
            }
            if (item.unitPrice === undefined || item.unitPrice < 0) {
              throw new BadRequestException(
                'Falta el precio (unitPrice) para el servicio temporal',
              );
            }
          }
        } else {
          throw new BadRequestException(
            `Tipo de ítem desconocido: ${item.type}`,
          );
        }
      }

      // Second pass: Process and deduct stock
      for (const item of createSaleDto.items) {
        const itemDisc = item.discount || 0;

        if (item.type === 'product') {
          const product = await this.inventoryService.findProductById(
            item.productId!,
            branchId,
          );

          await this.inventoryService.registerMovement(
            {
              productId: item.productId!,
              type: 'out',
              quantity: item.quantity,
              reason: `Venta Directa Folio #${folio}`,
            },
            userId,
            branchId,
          );

          const priceSnapshot =
            item.unitPrice !== undefined
              ? item.unitPrice
              : product.sellingPrice;

          subtotal += priceSnapshot * item.quantity;
          itemsDiscount += itemDisc * item.quantity;

          saleItems.push({
            type: 'product',
            product: product._id,
            sku: product.sku,
            name: product.name,
            quantity: item.quantity,
            priceSnapshot,
            discount: itemDisc,
            origin: 'direct',
          });
        } else if (item.type === 'service') {
          let serviceName = item.name;
          let priceSnapshot = item.unitPrice !== undefined ? item.unitPrice : 0;
          let serviceId: any = undefined;

          if (item.serviceId) {
            const service = await this.servicesService.findById(item.serviceId);
            serviceName = serviceName || service.name;
            priceSnapshot =
              item.unitPrice !== undefined ? item.unitPrice : service.basePrice;
            serviceId = service._id;
          }

          subtotal += priceSnapshot * item.quantity;
          itemsDiscount += itemDisc * item.quantity;

          saleItems.push({
            type: 'service',
            serviceId,
            name: serviceName!,
            quantity: item.quantity,
            priceSnapshot,
            discount: itemDisc,
            origin: 'service',
          });
        }
      }

      const globalDiscount = createSaleDto.globalDiscount || 0;
      discount = itemsDiscount + globalDiscount;
    }

    const total = subtotal - discount;

    if (total < 0) {
      const i18n = I18nContext.current();
      throw new BadRequestException(
        i18n
          ? i18n.t('common.errors.discountExceedsSubtotal')
          : 'El descuento total no puede superar el subtotal',
      );
    }

    // 3. Card payment processing via Mercado Pago SDK Point terminal
    let paymentReference = createSaleDto.paymentReference || '';
    if (createSaleDto.paymentMethod === 'card') {
      const mpResult = await this.mercadoPagoService.processPointPayment(
        total,
        `Venta POS Folio: ${folio}`,
      );
      paymentReference = mpResult.paymentId;
    }

    const sale = new this.saleModel({
      folio,
      customer: customerId as any,
      quoteRef: quoteRef as any,
      items: saleItems,
      subtotal,
      discount,
      total,
      paymentMethod: createSaleDto.paymentMethod,
      paymentReference,
      seller: userId as any,
      branch: branchId as any,
    });

    return (await sale.save()).populate([
      'customer',
      'seller',
      'items.product',
      {
        path: 'items.serviceId',
        populate: {
          path: 'supplies.product',
          model: 'Product',
        },
      },
      'quoteRef',
    ]);
  }

  async cancel(
    id: string,
    branchId: string,
    cancelSaleDto: CancelSaleDto,
    userId: string,
  ): Promise<SaleDocument> {
    if (!Types.ObjectId.isValid(id)) {
      const i18n = I18nContext.current();
      throw new BadRequestException(
        i18n ? i18n.t('common.errors.invalidSaleId') : 'ID de venta inválido',
      );
    }

    // Atomic update to mark cancelled and prevent race conditions / duplicate stock restorations
    const sale = await this.saleModel
      .findOneAndUpdate(
        { _id: id, branch: branchId, isCancelled: { $ne: true } },
        {
          isCancelled: true,
          cancelledAt: new Date(),
          cancelledBy: userId as any,
          cancelReason: cancelSaleDto.reason,
        },
        { new: true },
      )
      .populate([
        'customer',
        'seller',
        'items.product',
        {
          path: 'items.serviceId',
          populate: {
            path: 'supplies.product',
            model: 'Product',
          },
        },
        'quoteRef',
      ])
      .exec();

    if (!sale) {
      const i18n = I18nContext.current();
      throw new BadRequestException(
        i18n
          ? i18n.t('common.errors.alreadyCancelled')
          : 'Esta venta ya se encuentra cancelada o no existe',
      );
    }

    // Restore stock in inventory for direct products and service supplies
    for (const item of sale.items) {
      if (item.type === 'product' && item.product) {
        const prodId = item.product._id
          ? item.product._id.toString()
          : item.product.toString();
        await this.inventoryService.registerMovement(
          {
            productId: prodId,
            type: 'in',
            quantity: item.quantity,
            reason: `Cancelación de Venta Folio #${sale.folio}`,
          },
          userId,
          branchId,
        );
      } else if (
        item.type === 'service' &&
        item.serviceId &&
        item.serviceId.supplies
      ) {
        for (const supply of item.serviceId.supplies) {
          if (supply.product) {
            const supplyProdId = supply.product._id
              ? supply.product._id.toString()
              : supply.product.toString();
            await this.inventoryService.registerMovement(
              {
                productId: supplyProdId,
                type: 'in',
                quantity: supply.quantity * item.quantity,
                reason: `Cancelación de Venta Folio #${sale.folio} (Devolución insumo servicio)`,
              },
              userId,
              branchId,
            );
          }
        }
      }
    }

    return sale;
  }

  async findAll(
    branchId: string,
    filters: {
      customerId?: string;
      isCancelled?: boolean;
      hasService?: boolean;
      paymentMethod?: string;
      startDate?: string;
      endDate?: string;
      utcOffsetMinutes?: number;
    },
  ): Promise<SaleDocument[]> {
    const query: any = { branch: branchId };
    if (filters.customerId) {
      query.customer = filters.customerId;
    }
    if (filters.isCancelled !== undefined) {
      query.isCancelled = filters.isCancelled;
    }
    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      query.paymentMethod = filters.paymentMethod;
    }
    if (filters.hasService) {
      query['items.type'] = 'service';
    }
    if (filters.startDate || filters.endDate) {
      const offsetMs = (filters.utcOffsetMinutes ?? 0) * 60 * 1000;
      query.createdAt = {};
      if (filters.startDate) {
        const startUtcMidnight = new Date(`${filters.startDate}T00:00:00.000Z`);
        query.createdAt.$gte = new Date(startUtcMidnight.getTime() + offsetMs);
      }
      if (filters.endDate) {
        const endUtcMidnight = new Date(`${filters.endDate}T00:00:00.000Z`);
        endUtcMidnight.setUTCDate(endUtcMidnight.getUTCDate() + 1);
        query.createdAt.$lt = new Date(endUtcMidnight.getTime() + offsetMs);
      }
    }
    return this.saleModel
      .find(query)
      .populate([
        'customer',
        'seller',
        'items.product',
        {
          path: 'items.serviceId',
          populate: {
            path: 'supplies.product',
            model: 'Product',
          },
        },
      ])
      .sort({ createdAt: -1 })
      .exec();
  }

  async getStats(
    branchId: string,
    filters: SalesStatsQueryDto,
  ): Promise<any> {
    const targetBranch = filters.branchId || branchId;
    const branchObjId = Types.ObjectId.isValid(targetBranch)
      ? new Types.ObjectId(targetBranch)
      : targetBranch;

    let isCancelledValue: boolean | undefined = false; // Default: active sales
    if (filters.isCancelled !== undefined) {
      if (filters.isCancelled === 'true') {
        isCancelledValue = true;
      } else if (
        filters.isCancelled === 'false' ||
        filters.isCancelled === 'only_active'
      ) {
        isCancelledValue = false;
      } else if (filters.isCancelled === 'all') {
        isCancelledValue = undefined;
      }
    }

    const offsetMinutes = filters.utcOffsetMinutes ?? 0;
    const offsetMs = offsetMinutes * 60 * 1000;
    const sign = offsetMinutes > 0 ? '-' : '+';
    const absMinutes = Math.abs(offsetMinutes);
    const pad = (n: number) => String(n).padStart(2, '0');
    const tzString = `${sign}${pad(Math.floor(absMinutes / 60))}:${pad(absMinutes % 60)}`;

    const matchStage: any = { branch: branchObjId };
    if (isCancelledValue !== undefined) {
      matchStage.isCancelled = isCancelledValue;
    }
    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      matchStage.paymentMethod = filters.paymentMethod;
    }
    if (filters.customerId && Types.ObjectId.isValid(filters.customerId)) {
      matchStage.customer = new Types.ObjectId(filters.customerId);
    }

    // Date range handling for main period
    if (filters.startDate || filters.endDate) {
      matchStage.createdAt = {};
      if (filters.startDate) {
        const startUtc = new Date(`${filters.startDate}T00:00:00.000Z`);
        matchStage.createdAt.$gte = new Date(startUtc.getTime() + offsetMs);
      }
      if (filters.endDate) {
        const endUtc = new Date(`${filters.endDate}T00:00:00.000Z`);
        endUtc.setUTCDate(endUtc.getUTCDate() + 1);
        matchStage.createdAt.$lt = new Date(endUtc.getTime() + offsetMs);
      }
    }

    // 1. Faceted aggregation for Summary, Payment Methods, Daily Breakdown, and Services vs Products
    const [facetResults] = await this.saleModel.aggregate([
      { $match: matchStage },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: '$total' },
                subtotal: { $sum: '$subtotal' },
                discount: { $sum: '$discount' },
                totalSales: { $sum: 1 },
              },
            },
          ],
          paymentMethods: [
            {
              $group: {
                _id: '$paymentMethod',
                revenue: { $sum: '$total' },
                count: { $sum: 1 },
              },
            },
          ],
          dailyStats: [
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: '%Y-%m-%d',
                    date: '$createdAt',
                    timezone: tzString,
                  },
                },
                revenue: { $sum: '$total' },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
          itemBreakdown: [
            { $unwind: '$items' },
            {
              $project: {
                saleId: '$_id',
                type: '$items.type',
                quantity: { $ifNull: ['$items.quantity', 1] },
                itemTotal: {
                  $multiply: [
                    { $ifNull: ['$items.quantity', 1] },
                    {
                      $subtract: [
                        { $ifNull: ['$items.priceSnapshot', 0] },
                        { $ifNull: ['$items.discount', 0] },
                      ],
                    },
                  ],
                },
              },
            },
            {
              $group: {
                _id: '$type',
                revenue: { $sum: '$itemTotal' },
                itemsCount: { $sum: '$quantity' },
                uniqueSales: { $addToSet: '$saleId' },
              },
            },
            {
              $project: {
                _id: 1,
                revenue: 1,
                itemsCount: 1,
                salesCount: { $size: '$uniqueSales' },
              },
            },
          ],
        },
      },
    ]);

    const rawSummary = facetResults?.summary?.[0] || {
      totalRevenue: 0,
      subtotal: 0,
      discount: 0,
      totalSales: 0,
    };

    const totalRevenue = rawSummary.totalRevenue || 0;
    const totalSales = rawSummary.totalSales || 0;
    const subtotal = rawSummary.subtotal || 0;
    const discount = rawSummary.discount || 0;
    const averageTicket =
      totalSales > 0 ? Number((totalRevenue / totalSales).toFixed(2)) : 0;

    // 2. Payment methods mapping (Cash, Card, Transfer)
    const paymentMethods: Record<
      string,
      { revenue: number; count: number; percentage: number; label: string }
    > = {
      cash: { revenue: 0, count: 0, percentage: 0, label: 'Efectivo' },
      card: { revenue: 0, count: 0, percentage: 0, label: 'Tarjeta' },
      transfer: { revenue: 0, count: 0, percentage: 0, label: 'Transferencia' },
    };

    for (const pm of facetResults?.paymentMethods || []) {
      if (paymentMethods[pm._id]) {
        paymentMethods[pm._id].revenue = pm.revenue;
        paymentMethods[pm._id].count = pm.count;
        paymentMethods[pm._id].percentage =
          totalRevenue > 0
            ? Number(((pm.revenue / totalRevenue) * 100).toFixed(1))
            : 0;
      }
    }

    // Determine Main Payment Method (by transaction count, fallback to revenue)
    let mainPaymentMethod = 'none';
    let mainPaymentMethodLabel = 'Sin ventas';
    let maxCount = -1;
    let maxRev = -1;

    for (const [key, val] of Object.entries(paymentMethods)) {
      if (
        val.count > maxCount ||
        (val.count === maxCount && val.revenue > maxRev && maxCount > 0)
      ) {
        maxCount = val.count;
        maxRev = val.revenue;
        mainPaymentMethod = key;
        mainPaymentMethodLabel = val.label;
      }
    }

    if (totalSales === 0) {
      mainPaymentMethod = 'none';
      mainPaymentMethodLabel = 'Sin ventas';
    }

    // 3. Daily Series (Filling days with 0s to guarantee continuous chart)
    const dayNames = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    const dailyMap = new Map<string, { revenue: number; count: number }>();
    for (const dayItem of facetResults?.dailyStats || []) {
      dailyMap.set(dayItem._id, {
        revenue: dayItem.revenue,
        count: dayItem.count,
      });
    }

    const dailyRevenue: Array<{
      date: string;
      label: string;
      revenue: number;
      count: number;
    }> = [];

    if (filters.startDate && filters.endDate) {
      const cur = new Date(`${filters.startDate}T00:00:00.000Z`);
      const end = new Date(`${filters.endDate}T00:00:00.000Z`);

      while (cur <= end) {
        const dateStr = cur.toISOString().slice(0, 10);
        const dayOfWeek = cur.getUTCDay();
        const found = dailyMap.get(dateStr) || { revenue: 0, count: 0 };
        dailyRevenue.push({
          date: dateStr,
          label: dayNames[dayOfWeek],
          revenue: found.revenue,
          count: found.count,
        });
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    } else {
      // Default: last 7 days ending today
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setUTCDate(d.getUTCDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayOfWeek = d.getUTCDay();
        const found = dailyMap.get(dateStr) || { revenue: 0, count: 0 };
        dailyRevenue.push({
          date: dateStr,
          label: dayNames[dayOfWeek],
          revenue: found.revenue,
          count: found.count,
        });
      }
    }

    // 4. Monthly Trend (last 6 months ending on filter endDate or current month)
    const monthNames = [
      'ene',
      'feb',
      'mar',
      'abr',
      'may',
      'jun',
      'jul',
      'ago',
      'sep',
      'oct',
      'nov',
      'dic',
    ];
    const refDate = filters.endDate
      ? new Date(`${filters.endDate}T00:00:00.000Z`)
      : new Date();
    const endYear = refDate.getUTCFullYear();
    const endMonth = refDate.getUTCMonth(); // 0-indexed

    const start6MonthsUtc = new Date(
      Date.UTC(endYear, endMonth - 5, 1, 0, 0, 0, 0),
    );
    const end6MonthsUtc = new Date(
      Date.UTC(endYear, endMonth + 1, 1, 0, 0, 0, 0),
    );

    const monthlyMatch: any = {
      branch: branchObjId,
      createdAt: {
        $gte: new Date(start6MonthsUtc.getTime() + offsetMs),
        $lt: new Date(end6MonthsUtc.getTime() + offsetMs),
      },
    };
    if (isCancelledValue !== undefined) {
      monthlyMatch.isCancelled = isCancelledValue;
    }
    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      monthlyMatch.paymentMethod = filters.paymentMethod;
    }
    if (filters.customerId && Types.ObjectId.isValid(filters.customerId)) {
      monthlyMatch.customer = new Types.ObjectId(filters.customerId);
    }

    const rawMonthlyStats = await this.saleModel.aggregate([
      { $match: monthlyMatch },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m',
              date: '$createdAt',
              timezone: tzString,
            },
          },
          revenue: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
    ]);

    const monthlyMap = new Map<string, { revenue: number; count: number }>();
    for (const m of rawMonthlyStats) {
      monthlyMap.set(m._id, { revenue: m.revenue, count: m.count });
    }

    const monthlyTrend: Array<{
      month: string;
      label: string;
      revenue: number;
      count: number;
    }> = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(endYear, endMonth - i, 1));
      const yearStr = d.getUTCFullYear();
      const monthStr = pad(d.getUTCMonth() + 1);
      const key = `${yearStr}-${monthStr}`;
      const found = monthlyMap.get(key) || { revenue: 0, count: 0 };
      monthlyTrend.push({
        month: key,
        label: monthNames[d.getUTCMonth()],
        revenue: found.revenue,
        count: found.count,
      });
    }

    // 5. Item Types Breakdown (Services vs Products)
    const itemTypesBreakdown = {
      services: {
        revenue: 0,
        itemsCount: 0,
        salesCount: 0,
        revenuePercentage: 0,
      },
      products: {
        revenue: 0,
        itemsCount: 0,
        salesCount: 0,
        revenuePercentage: 0,
      },
    };

    for (const item of facetResults?.itemBreakdown || []) {
      if (item._id === 'service') {
        itemTypesBreakdown.services.revenue = item.revenue;
        itemTypesBreakdown.services.itemsCount = item.itemsCount;
        itemTypesBreakdown.services.salesCount = item.salesCount;
        itemTypesBreakdown.services.revenuePercentage =
          totalRevenue > 0
            ? Number(((item.revenue / totalRevenue) * 100).toFixed(1))
            : 0;
      } else if (item._id === 'product') {
        itemTypesBreakdown.products.revenue = item.revenue;
        itemTypesBreakdown.products.itemsCount = item.itemsCount;
        itemTypesBreakdown.products.salesCount = item.salesCount;
        itemTypesBreakdown.products.revenuePercentage =
          totalRevenue > 0
            ? Number(((item.revenue / totalRevenue) * 100).toFixed(1))
            : 0;
      }
    }

    return {
      summary: {
        totalRevenue,
        totalSales,
        averageTicket,
        subtotal,
        discount,
        mainPaymentMethod,
        mainPaymentMethodLabel,
      },
      paymentMethods,
      dailyRevenue,
      monthlyTrend,
      itemTypesBreakdown,
    };
  }

  async findById(id: string, branchId?: string): Promise<SaleDocument> {
    if (!Types.ObjectId.isValid(id)) {
      const i18n = I18nContext.current();
      throw new BadRequestException(
        i18n ? i18n.t('common.errors.invalidSaleId') : 'ID de venta inválido',
      );
    }
    const query: any = { _id: id };
    if (branchId) query.branch = branchId;
    const sale = await this.saleModel
      .findOne(query)
      .populate([
        'customer',
        'seller',
        'items.product',
        {
          path: 'items.serviceId',
          populate: {
            path: 'supplies.product',
            model: 'Product',
          },
        },
        'quoteRef',
      ])
      .exec();
    if (!sale) {
      const i18n = I18nContext.current();
      throw new NotFoundException(
        i18n ? i18n.t('common.errors.saleNotFound') : 'Venta no encontrada',
      );
    }
    return sale;
  }

  async findByFolio(folio: string, branchId: string): Promise<SaleDocument> {
    const sale = await this.saleModel
      .findOne({ folio: folio.toUpperCase().trim(), branch: branchId })
      .populate([
        'customer',
        'seller',
        'items.product',
        {
          path: 'items.serviceId',
          populate: {
            path: 'supplies.product',
            model: 'Product',
          },
        },
        'quoteRef',
      ])
      .exec();
    if (!sale) {
      const i18n = I18nContext.current();
      throw new NotFoundException(
        i18n
          ? i18n.t('common.errors.saleFolioNotFound')
          : 'Venta con ese folio no encontrada',
      );
    }
    return sale;
  }

  private generateFolio(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `SALE-${dateStr}-${rand}`;
  }
}

// Utility helper to safely get quote ID as string
function createQuoteDtoId(quote: any): string {
  return quote._id.toString();
}
