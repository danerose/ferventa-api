import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Sale, SaleDocument } from './schemas/sale.schema';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CancelSaleDto } from './dto/cancel-sale.dto';
import { CustomersService } from '../customers/customers.service';
import { InventoryService } from '../inventory/inventory.service';
import { QuotesService } from '../quotes/quotes.service';
import { MercadoPagoService } from './mercado-pago.service';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
    private readonly customersService: CustomersService,
    private readonly inventoryService: InventoryService,
    private readonly quotesService: QuotesService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  async create(createSaleDto: CreateSaleDto, userId: string, branchId: string): Promise<SaleDocument> {
    const folio = this.generateFolio();
    let customerId = createSaleDto.customerId;
    let saleItems: any[] = [];
    let subtotal = 0;
    let discount = 0;
    let quoteRef: string | undefined = undefined;

    // 1. If sale originates from a Quote
    if (createSaleDto.quoteId) {
      const quote = await this.quotesService.findById(createSaleDto.quoteId, branchId);
      
      if (quote.status === 'converted_to_sale') {
        const i18n = I18nContext.current();
        throw new BadRequestException(i18n ? i18n.t('common.errors.quoteAlreadyConverted') : 'Esta cotización ya fue convertida en venta');
      }

      if (quote.validUntil < new Date()) {
        const i18n = I18nContext.current();
        throw new BadRequestException(i18n ? i18n.t('common.errors.quoteExpired') : 'La cotización especificada ya ha expirado');
      }

      customerId = (quote.customer as any)._id.toString();
      subtotal = quote.subtotal;
      discount = quote.discount;
      quoteRef = (quote._id as any).toString();

      // Check stock for all items
      for (const item of quote.items) {
        const product = await this.inventoryService.findProductById((item.product as any)._id.toString(), branchId);
        if (product.stock < item.quantity) {
          const i18n = I18nContext.current();
          const message = i18n
            ? i18n.t('common.errors.insufficientStockProduct', { args: { name: product.name, stock: product.stock, required: item.quantity } })
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
          product: (item.product as any)._id,
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          priceSnapshot: item.priceSnapshot,
          discount: item.discount,
        });
      }

      // Mark quote as converted
      await this.quotesService.changeStatus(createQuoteDtoId(quote), 'converted_to_sale');

    } else {
      // 2. Direct POS sale (no quote)
      if (!customerId) {
        const i18n = I18nContext.current();
        throw new BadRequestException(i18n ? i18n.t('common.errors.customerIdRequired') : 'El ID del cliente es requerido para ventas directas');
      }
      if (!createSaleDto.items || createSaleDto.items.length === 0) {
        const i18n = I18nContext.current();
        throw new BadRequestException(i18n ? i18n.t('common.errors.atLeastOneProductRequired') : 'Se requiere al menos un producto para registrar la venta');
      }

      await this.customersService.findById(customerId, branchId);

      let itemsDiscount = 0;

      // Check stock for all items
      for (const item of createSaleDto.items) {
        const product = await this.inventoryService.findProductById(item.productId, branchId);
        if (product.stock < item.quantity) {
          const i18n = I18nContext.current();
          const message = i18n
            ? i18n.t('common.errors.insufficientStockProduct', { args: { name: product.name, stock: product.stock, required: item.quantity } })
            : `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`;
          throw new BadRequestException(message);
        }
      }

      // Process and deduct stock
      for (const item of createSaleDto.items) {
        const product = await this.inventoryService.findProductById(item.productId, branchId);
        
        await this.inventoryService.registerMovement(
          {
            productId: item.productId,
            type: 'out',
            quantity: item.quantity,
            reason: `Venta Directa Folio #${folio}`,
          },
          userId,
          branchId,
        );

        const priceSnapshot = product.sellingPrice;
        const itemDisc = item.discount || 0;

        subtotal += priceSnapshot * item.quantity;
        itemsDiscount += itemDisc * item.quantity;

        saleItems.push({
          product: product._id,
          sku: product.sku,
          name: product.name,
          quantity: item.quantity,
          priceSnapshot,
          discount: itemDisc,
        });
      }

      const globalDiscount = createSaleDto.globalDiscount || 0;
      discount = itemsDiscount + globalDiscount;
    }

    const total = subtotal - discount;

    if (total < 0) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.discountExceedsSubtotal') : 'El descuento total no puede superar el subtotal');
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

    return (await sale.save()).populate(['customer', 'seller', 'quoteRef']);
  }

  async cancel(id: string, branchId: string, cancelSaleDto: CancelSaleDto, userId: string): Promise<SaleDocument> {
    const sale = await this.findById(id, branchId);

    if (sale.isCancelled) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.alreadyCancelled') : 'Esta venta ya se encuentra cancelada');
    }

    // Restore stock in inventory
    for (const item of sale.items) {
      await this.inventoryService.registerMovement(
        {
          productId: (item.product as any)._id.toString(),
          type: 'in',
          quantity: item.quantity,
          reason: `Cancelación de Venta Folio #${sale.folio}`,
        },
        userId,
        branchId,
      );
    }

    sale.isCancelled = true;
    sale.cancelledAt = new Date();
    sale.cancelledBy = userId as any;
    sale.cancelReason = cancelSaleDto.reason;

    return (await sale.save()).populate(['customer', 'seller', 'cancelledBy']);
  }

  async findAll(branchId: string, filters: { customerId?: string; isCancelled?: boolean }): Promise<SaleDocument[]> {
    const query: any = { branch: branchId };
    if (filters.customerId) {
      query.customer = filters.customerId;
    }
    if (filters.isCancelled !== undefined) {
      query.isCancelled = filters.isCancelled;
    }
    return this.saleModel
      .find(query)
      .populate(['customer', 'seller'])
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string, branchId?: string): Promise<SaleDocument> {
    if (!Types.ObjectId.isValid(id)) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.invalidSaleId') : 'ID de venta inválido');
    }
    const query: any = { _id: id };
    if (branchId) query.branch = branchId;
    const sale = await this.saleModel
      .findOne(query)
      .populate(['customer', 'seller', 'items.product', 'quoteRef'])
      .exec();
    if (!sale) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.saleNotFound') : 'Venta no encontrada');
    }
    return sale;
  }

  async findByFolio(folio: string, branchId: string): Promise<SaleDocument> {
    const sale = await this.saleModel
      .findOne({ folio: folio.toUpperCase().trim(), branch: branchId })
      .populate(['customer', 'seller', 'items.product', 'quoteRef'])
      .exec();
    if (!sale) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.saleFolioNotFound') : 'Venta con ese folio no encontrada');
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
  return (quote._id as any).toString();
}
