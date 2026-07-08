import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Quote, QuoteDocument } from './schemas/quote.schema';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { CustomersService } from '../customers/customers.service';
import { InventoryService } from '../inventory/inventory.service';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class QuotesService {
  constructor(
    @InjectModel(Quote.name) private quoteModel: Model<QuoteDocument>,
    private readonly customersService: CustomersService,
    private readonly inventoryService: InventoryService,
  ) {}

  async create(createQuoteDto: CreateQuoteDto, userId: string): Promise<QuoteDocument> {
    // 1. Verify customer
    await this.customersService.findById(createQuoteDto.customerId);

    // 2. Fetch and snapshot items prices from Catalog
    const quoteItems: any[] = [];
    let subtotal = 0;
    let itemsDiscount = 0;

    for (const item of createQuoteDto.items) {
      const product = await this.inventoryService.findProductById(item.productId);
      if (!product.isActive) {
        const i18n = I18nContext.current();
        const message = i18n
          ? i18n.t('common.errors.productInactive', { args: { sku: product.sku } })
          : `El producto con SKU ${product.sku} está inactivo`;
        throw new BadRequestException(message);
      }

      const priceSnapshot = product.sellingPrice;
      const discount = item.discount || 0;
      const lineSubtotal = priceSnapshot * item.quantity;
      const lineDiscount = discount * item.quantity;

      subtotal += lineSubtotal;
      itemsDiscount += lineDiscount;

      quoteItems.push({
        product: product._id,
        sku: product.sku,
        name: product.name,
        quantity: item.quantity,
        priceSnapshot,
        discount,
      });
    }

    const globalDiscount = createQuoteDto.globalDiscount || 0;
    const totalDiscount = itemsDiscount + globalDiscount;
    const total = subtotal - totalDiscount;

    if (total < 0) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.discountExceedsSubtotal') : 'El descuento total no puede superar el subtotal de la cotización');
    }

    // Default validity: 15 days
    const validUntil = createQuoteDto.validUntil
      ? new Date(createQuoteDto.validUntil)
      : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    const quote = new this.quoteModel({
      customer: createQuoteDto.customerId as any,
      items: quoteItems,
      subtotal,
      discount: totalDiscount,
      total,
      validUntil,
      status: 'pending',
      createdBy: userId as any,
    });

    return (await quote.save()).populate(['customer', 'createdBy']);
  }

  async findAll(filters: { customerId?: string; status?: string }): Promise<QuoteDocument[]> {
    const query: any = {};
    if (filters.customerId) {
      query.customer = filters.customerId;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    return this.quoteModel
      .find(query)
      .populate(['customer', 'createdBy'])
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<QuoteDocument> {
    if (!Types.ObjectId.isValid(id)) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.invalidQuoteId') : 'ID de cotización inválido');
    }
    const quote = await this.quoteModel
      .findById(id)
      .populate(['customer', 'createdBy', 'items.product'])
      .exec();
    if (!quote) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.quoteNotFound') : 'Cotización no encontrada');
    }
    return quote;
  }

  async update(id: string, updateQuoteDto: UpdateQuoteDto): Promise<QuoteDocument> {
    const quote = await this.findById(id);

    if (quote.status === 'converted_to_sale') {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.quoteAlreadyConverted') : 'No se puede modificar una cotización que ya ha sido convertida en venta');
    }

    if (updateQuoteDto.customerId) {
      await this.customersService.findById(updateQuoteDto.customerId);
      quote.customer = updateQuoteDto.customerId as any;
    }

    if (updateQuoteDto.items) {
      const quoteItems: any[] = [];
      let subtotal = 0;
      let itemsDiscount = 0;

      for (const item of updateQuoteDto.items) {
        const product = await this.inventoryService.findProductById(item.productId);
        const priceSnapshot = product.sellingPrice;
        const discount = item.discount || 0;
        
        subtotal += priceSnapshot * item.quantity;
        itemsDiscount += discount * item.quantity;

        quoteItems.push({
          product: product._id,
          sku: product.sku,
          name: product.name,
          quantity: item.quantity,
          priceSnapshot,
          discount,
        });
      }

      quote.items = quoteItems;
      quote.subtotal = subtotal;
      
      const globalDiscount = updateQuoteDto.globalDiscount !== undefined ? updateQuoteDto.globalDiscount : (quote.discount - itemsDiscount);
      quote.discount = itemsDiscount + globalDiscount;
      quote.total = subtotal - quote.discount;
    } else if (updateQuoteDto.globalDiscount !== undefined) {
      // Re-calculate total with new global discount
      // To preserve items discount, we need to know the old items discount
      // Let's compute it
      let itemsDiscount = 0;
      for (const item of quote.items) {
        itemsDiscount += (item.discount || 0) * item.quantity;
      }
      quote.discount = itemsDiscount + updateQuoteDto.globalDiscount;
      quote.total = quote.subtotal - quote.discount;
    }

    if (quote.total < 0) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.discountExceedsSubtotal') : 'El descuento total no puede superar el subtotal');
    }

    if (updateQuoteDto.validUntil) {
      quote.validUntil = new Date(updateQuoteDto.validUntil);
    }

    if (updateQuoteDto.status) {
      quote.status = updateQuoteDto.status;
    }

    const saved = await quote.save();
    return saved.populate(['customer', 'createdBy']);
  }

  async changeStatus(id: string, status: string): Promise<void> {
    await this.quoteModel.updateOne({ _id: id }, { status }).exec();
  }
}
