import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Brand, BrandDocument } from './schemas/brand.schema';
import { Category, CategoryDocument } from './schemas/category.schema';
import { Provider, ProviderDocument } from './schemas/provider.schema';
import { Product, ProductDocument } from './schemas/product.schema';
import {
  StockMovement,
  StockMovementDocument,
} from './schemas/stock-movement.schema';
import {
  StockReception,
  StockReceptionDocument,
} from './schemas/stock-reception.schema';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProviderDto } from './dto/create-provider.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { CreateStockReceptionDto } from './dto/create-stock-reception.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nContext } from 'nestjs-i18n';
import { buildFuzzyRegex } from '../../common/utils/search.util';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(Brand.name) private brandModel: Model<BrandDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Provider.name) private providerModel: Model<ProviderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(StockMovement.name)
    private movementModel: Model<StockMovementDocument>,
    @InjectModel(StockReception.name)
    private receptionModel: Model<StockReceptionDocument>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  // --- BRAND CRUD ---
  async createBrand(
    createBrandDto: CreateBrandDto,
    branchId: string,
  ): Promise<Brand> {
    const existing = await this.brandModel.findOne({
      name: createBrandDto.name.trim(),
      branch: branchId,
    });
    if (existing) {
      const i18n = I18nContext.current();
      throw new BadRequestException(
        i18n
          ? i18n.t('common.errors.brandRegistered')
          : 'Esta marca ya está registrada',
      );
    }
    return this.brandModel.create({
      name: createBrandDto.name.trim(),
      branch: branchId,
    });
  }

  async findAllBrands(
    branchId: string,
    search?: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResult<Brand>> {
    const query: any = { branch: branchId };
    if (search) {
      query.name = buildFuzzyRegex(search);
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.brandModel
        .find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.brandModel.countDocuments(query),
    ]);
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async searchBrandsByName(
    branchId: string,
    search: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResult<Brand>> {
    return this.findAllBrands(branchId, search, page, limit);
  }

  async deleteBrand(id: string, branchId: string): Promise<void> {
    // Check if any product is using this brand
    const productsUsing = await this.productModel.countDocuments({
      brand: id as any,
      branch: branchId,
    });
    if (productsUsing > 0) {
      const i18n = I18nContext.current();
      throw new BadRequestException(
        i18n
          ? i18n.t('common.errors.brandHasProducts')
          : 'No se puede eliminar la marca porque hay productos asociados a ella',
      );
    }
    const res = await this.brandModel.findOneAndDelete({
      _id: id,
      branch: branchId,
    });
    if (!res) {
      const i18n = I18nContext.current();
      throw new NotFoundException(
        i18n ? i18n.t('common.errors.brandNotFound') : 'Marca no encontrada',
      );
    }
  }

  // --- CATEGORY CRUD ---
  async createCategory(
    createCategoryDto: CreateCategoryDto,
    branchId: string,
  ): Promise<Category> {
    const existing = await this.categoryModel.findOne({
      name: createCategoryDto.name.trim(),
      branch: branchId,
    });
    if (existing) {
      const i18n = I18nContext.current();
      throw new BadRequestException(
        i18n
          ? i18n.t('common.errors.categoryRegistered')
          : 'Esta categoría ya está registrada',
      );
    }
    return this.categoryModel.create({
      name: createCategoryDto.name.trim(),
      branch: branchId,
    });
  }

  async findAllCategories(
    branchId: string,
    search?: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResult<Category>> {
    const query: any = { branch: branchId };
    if (search) {
      query.name = buildFuzzyRegex(search);
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.categoryModel
        .find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.categoryModel.countDocuments(query),
    ]);
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async searchCategoriesByName(
    branchId: string,
    search: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResult<Category>> {
    return this.findAllCategories(branchId, search, page, limit);
  }

  async deleteCategory(id: string, branchId: string): Promise<void> {
    const productsUsing = await this.productModel.countDocuments({
      category: id as any,
      branch: branchId,
    });
    if (productsUsing > 0) {
      const i18n = I18nContext.current();
      throw new BadRequestException(
        i18n
          ? i18n.t('common.errors.categoryHasProducts')
          : 'No se puede eliminar la categoría porque hay productos asociados a ella',
      );
    }
    const res = await this.categoryModel.findOneAndDelete({
      _id: id,
      branch: branchId,
    });
    if (!res) {
      const i18n = I18nContext.current();
      throw new NotFoundException(
        i18n
          ? i18n.t('common.errors.categoryNotFound')
          : 'Categoría no encontrada',
      );
    }
  }

  // --- PROVIDER CRUD ---
  async createProvider(
    createProviderDto: CreateProviderDto,
    branchId: string,
  ): Promise<Provider> {
    return this.providerModel.create({
      ...createProviderDto,
      branch: branchId,
    });
  }

  async findAllProviders(
    branchId: string,
    search?: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResult<Provider>> {
    const query: any = { branch: branchId };
    if (search) {
      const regex = buildFuzzyRegex(search);
      query.$or = [{ name: regex }, { providerCode: regex }];
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.providerModel
        .find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.providerModel.countDocuments(query),
    ]);
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async searchProviders(
    branchId: string,
    search: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResult<Provider>> {
    return this.findAllProviders(branchId, search, page, limit);
  }

  async updateProvider(
    id: string,
    branchId: string,
    createProviderDto: CreateProviderDto,
  ): Promise<Provider> {
    const provider = await this.providerModel.findOneAndUpdate(
      { _id: id, branch: branchId },
      createProviderDto,
      { new: true },
    );
    if (!provider) {
      const i18n = I18nContext.current();
      throw new NotFoundException(
        i18n
          ? i18n.t('common.errors.providerNotFound')
          : 'Proveedor no encontrado',
      );
    }
    return provider;
  }

  async deleteProvider(id: string, branchId: string): Promise<void> {
    const productsUsing = await this.productModel.countDocuments({
      provider: id,
      branch: branchId,
    });
    if (productsUsing > 0) {
      const i18n = I18nContext.current();
      throw new BadRequestException(
        i18n
          ? i18n.t('common.errors.providerHasProducts')
          : 'No se puede eliminar el proveedor porque hay productos asociados a él',
      );
    }
    const res = await this.providerModel.findOneAndDelete({
      _id: id,
      branch: branchId,
    });
    if (!res) {
      const i18n = I18nContext.current();
      throw new NotFoundException(
        i18n
          ? i18n.t('common.errors.providerNotFound')
          : 'Proveedor no encontrado',
      );
    }
  }

  // --- PRODUCT CRUD ---
  async createProduct(
    createProductDto: CreateProductDto,
    branchId: string,
  ): Promise<ProductDocument> {
    const existing = await this.productModel.findOne({
      sku: createProductDto.sku.toUpperCase(),
      branch: branchId,
    });
    if (existing) {
      const i18n = I18nContext.current();
      throw new BadRequestException(
        i18n
          ? i18n.t('common.errors.skuRegistered')
          : 'Ya existe un producto registrado con este SKU',
      );
    }

    // Verify brand, category, and provider exist
    const brandExists = await this.brandModel.exists({
      _id: createProductDto.brandId,
      branch: branchId,
    });
    if (!brandExists) {
      const i18n = I18nContext.current();
      throw new NotFoundException(
        i18n
          ? i18n.t('common.errors.brandNotFound')
          : 'La marca especificada no existe',
      );
    }

    const categoryExists = await this.categoryModel.exists({
      _id: createProductDto.categoryId,
      branch: branchId,
    });
    if (!categoryExists) {
      const i18n = I18nContext.current();
      throw new NotFoundException(
        i18n
          ? i18n.t('common.errors.categoryNotFound')
          : 'La categoría especificada no existe',
      );
    }

    const product = new this.productModel({
      ...createProductDto,
      sku: createProductDto.sku.toUpperCase(),
      branch: branchId,
      brand: createProductDto.brandId,
      category: createProductDto.categoryId,
    });

    return (await product.save()).populate(['brand', 'category']);
  }

  async findAllProducts(
    branchId: string,
    filters: {
      search?: string;
      categoryId?: string;
      brandId?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedResult<ProductDocument>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const query: any = { isActive: true, branch: branchId };

    if (filters.categoryId) {
      query.category = filters.categoryId;
    }
    if (filters.brandId) {
      query.brand = filters.brandId;
    }
    if (filters.search) {
      const regex = buildFuzzyRegex(filters.search);
      query.$or = [{ name: regex }, { sku: regex }, { compatibility: regex }];
    }

    const [items, total] = await Promise.all([
      this.productModel
        .find(query)
        .populate(['brand', 'category'])
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(query),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async searchProducts(
    branchId: string,
    search: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResult<ProductDocument>> {
    const regex = buildFuzzyRegex(search);
    const query = {
      isActive: true,
      branch: branchId,
      $or: [{ name: regex }, { sku: regex }, { compatibility: regex }],
    };
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.productModel
        .find(query)
        .populate(['brand', 'category'])
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(query),
    ]);
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findProductById(
    id: string,
    branchId: string,
  ): Promise<ProductDocument> {
    const product = await this.productModel
      .findOne({ _id: id, branch: branchId })
      .populate(['brand', 'category'])
      .exec();
    if (!product) {
      const i18n = I18nContext.current();
      throw new NotFoundException(
        i18n
          ? i18n.t('common.errors.productNotFound')
          : 'Producto no encontrado',
      );
    }
    return product;
  }

  async findProductBySku(
    sku: string,
    branchId: string,
  ): Promise<ProductDocument> {
    const product = await this.productModel
      .findOne({ sku: sku.toUpperCase(), branch: branchId })
      .populate(['brand', 'category'])
      .exec();
    if (!product) {
      const i18n = I18nContext.current();
      throw new NotFoundException(
        i18n
          ? i18n.t('common.errors.productSkuNotFound')
          : 'Producto con SKU especificado no encontrado',
      );
    }
    return product;
  }

  async updateProduct(
    id: string,
    branchId: string,
    updateProductDto: UpdateProductDto,
    userId?: string,
  ): Promise<ProductDocument> {
    const product = await this.findProductById(id, branchId);

    if (updateProductDto.sku) {
      const newSku = updateProductDto.sku.toUpperCase();
      if (newSku !== product.sku) {
        const existing = await this.productModel.findOne({
          sku: newSku,
          branch: branchId,
          _id: { $ne: id },
        });
        if (existing) {
          const i18n = I18nContext.current();
          throw new BadRequestException(
            i18n
              ? i18n.t('common.errors.skuRegistered')
              : 'Ya existe un producto registrado con este SKU',
          );
        }
        product.sku = newSku;
      }
    }

    if (updateProductDto.brandId) {
      const brandExists = await this.brandModel.exists({
        _id: updateProductDto.brandId,
        branch: branchId,
      });
      if (!brandExists) {
        const i18n = I18nContext.current();
        throw new NotFoundException(
          i18n
            ? i18n.t('common.errors.brandNotFound')
            : 'La marca especificada no existe',
        );
      }
      product.brand = updateProductDto.brandId as any;
    }

    if (updateProductDto.categoryId) {
      const categoryExists = await this.categoryModel.exists({
        _id: updateProductDto.categoryId,
        branch: branchId,
      });
      if (!categoryExists) {
        const i18n = I18nContext.current();
        throw new NotFoundException(
          i18n
            ? i18n.t('common.errors.categoryNotFound')
            : 'La categoría especificada no existe',
        );
      }
      product.category = updateProductDto.categoryId as any;
    }

    // Register stock movement if stock was modified
    if (
      updateProductDto.stock !== undefined &&
      updateProductDto.stock !== product.stock
    ) {
      const oldStock = product.stock;
      const newStock = updateProductDto.stock;
      const diff = newStock - oldStock;
      product.stock = newStock;

      await this.movementModel.create({
        product: product._id as any,
        branch: branchId,
        type: diff > 0 ? 'in' : 'out',
        quantity: Math.abs(diff),
        reason: `Ajuste manual de stock por edición (Anterior: ${oldStock}, Nuevo: ${newStock})`,
        performedBy: userId as any,
        balanceAfter: newStock,
      });
    }

    // Explicitly update simple fields
    if (updateProductDto.name) product.name = updateProductDto.name;
    if (updateProductDto.description)
      product.description = updateProductDto.description;
    if (updateProductDto.costPrice !== undefined)
      product.costPrice = updateProductDto.costPrice;
    if (updateProductDto.sellingPrice !== undefined)
      product.sellingPrice = updateProductDto.sellingPrice;
    if (updateProductDto.minStock !== undefined)
      product.minStock = updateProductDto.minStock;
    if (updateProductDto.unit) product.unit = updateProductDto.unit;
    if (updateProductDto.photos) product.photos = updateProductDto.photos;
    if (updateProductDto.compatibility)
      product.compatibility = updateProductDto.compatibility;
    if (updateProductDto.isActive !== undefined)
      product.isActive = updateProductDto.isActive;

    const saved = await product.save();
    return saved.populate(['brand', 'category']);
  }

  async deleteProduct(id: string, branchId: string): Promise<void> {
    const product = await this.findProductById(id, branchId);
    product.isActive = false;
    await product.save();
  }

  // --- STOCK MOVEMENT ---
  async registerMovement(
    createStockMovementDto: CreateStockMovementDto,
    userId: string,
    branchId: string,
  ): Promise<StockMovementDocument> {
    const product = await this.productModel.findOne({
      _id: createStockMovementDto.productId,
      branch: branchId,
    });
    if (!product) {
      const i18n = I18nContext.current();
      throw new NotFoundException(
        i18n
          ? i18n.t('common.errors.productNotFound')
          : 'Producto no encontrado',
      );
    }

    const { type, quantity, reason } = createStockMovementDto;

    if (type === 'in') {
      product.stock += quantity;
    } else if (type === 'out') {
      if (product.stock < quantity) {
        const i18n = I18nContext.current();
        const message = i18n
          ? i18n.t('common.errors.insufficientStockDetailed', {
              args: { stock: product.stock, required: quantity },
            })
          : `Stock insuficiente. Stock actual: ${product.stock}, Requerido: ${quantity}`;
        throw new BadRequestException(message);
      }
      product.stock -= quantity;
    } else if (type === 'adjustment') {
      // In adjustments, the quantity can be positive or negative
      const newStock = product.stock + quantity;
      if (newStock < 0) {
        const i18n = I18nContext.current();
        const message = i18n
          ? i18n.t('common.errors.negativeStockAdjustment', {
              args: { stock: newStock },
            })
          : `El ajuste dejaría el stock en negativo: ${newStock}`;
        throw new BadRequestException(message);
      }
      product.stock = newStock;
    }

    await product.save();

    const movement = new this.movementModel({
      product: product._id,
      branch: branchId,
      type,
      quantity,
      reason,
      performedBy: userId as any,
      balanceAfter: product.stock,
    });

    if (createStockMovementDto.providerId) {
      const providerExists = await this.providerModel.exists({
        _id: createStockMovementDto.providerId,
        branch: branchId,
      });
      if (providerExists) {
        movement.provider = createStockMovementDto.providerId as any;
      }
    }

    return (await movement.save()).populate([
      { path: 'product', populate: ['brand', 'category'] },
      { path: 'performedBy', select: 'name email' },
      { path: 'provider', select: 'name providerCode' },
    ]);
  }

  async findMovementsByProduct(
    productId: string,
    branchId: string,
  ): Promise<StockMovementDocument[]> {
    return this.movementModel
      .find({ product: productId as any, branch: branchId })
      .populate('performedBy', 'name email')
      .populate('provider', 'name providerCode')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAllMovements(branchId: string): Promise<StockMovementDocument[]> {
    return this.movementModel
      .find({ branch: branchId })
      .populate('product', 'sku name')
      .populate('performedBy', 'name email')
      .populate('provider', 'name providerCode')
      .sort({ createdAt: -1 })
      .exec();
  }

  async deleteMovement(
    id: string,
    branchId: string,
  ): Promise<{ success: boolean; message: string }> {
    const movement = await this.movementModel.findOne({
      _id: id,
      branch: branchId,
    });
    if (!movement) {
      throw new NotFoundException('Movimiento no encontrado');
    }

    const productId = (movement.product as any)?._id || (movement.product as any);
    const product = await this.productModel.findOne({
      _id: productId,
      branch: branchId,
    });

    if (product) {
      if (movement.type === 'in') {
        if (product.stock < movement.quantity) {
          throw new BadRequestException(
            `No es posible eliminar el ingreso: el stock actual (${product.stock}) es menor a la cantidad ingresada a descontar (${movement.quantity})`,
          );
        }
        product.stock -= movement.quantity;
        await product.save();
      } else if (movement.type === 'out') {
        product.stock += movement.quantity;
        await product.save();
      }
    }

    await this.movementModel.deleteOne({ _id: id });

    await this.auditLogsService.logAction({
      action: 'DELETE_STOCK_MOVEMENT',
      module: 'inventory',
      description: `Movimiento de stock eliminado y revertido (ID ${id})`,
      branchId,
      entityId: id,
      entityType: 'StockMovement',
    });

    return {
      success: true,
      message: 'Movimiento eliminado y stock revertido correctamente',
    };
  }

  // --- STOCK RECEPTIONS & BOX MANAGEMENT ---

  async createReception(
    dto: CreateStockReceptionDto,
    userId: string,
    branchId: string,
  ): Promise<StockReceptionDocument> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        'La recepción debe contener al menos un producto',
      );
    }

    const itemsWithDetails: any[] = [];
    let counter = 1;

    for (const item of dto.items) {
      const product = await this.findProductById(item.productId, branchId);
      const timestampPart = Date.now().toString(36).toUpperCase();
      const randomSuffix = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');
      const boxCode = `BOX-${timestampPart}-${counter++}-${randomSuffix}`;

      itemsWithDetails.push({
        product: product._id,
        sku: product.sku,
        name: product.name,
        quantity: item.quantity,
        costPrice: item.costPrice,
        sellingPrice:
          item.sellingPrice !== undefined && item.sellingPrice > 0
            ? item.sellingPrice
            : product.sellingPrice,
        boxCode,
        isBoxSealed: true,
        openedAt: null,
        openedBy: null,
      });
    }

    const reception = new this.receptionModel({
      branch: branchId,
      provider: dto.providerId ? (dto.providerId as any) : null,
      receivedBy: userId as any,
      status: 'draft',
      items: itemsWithDetails,
      invoiceOrFolio: dto.invoiceOrFolio || '',
      notes: dto.notes || '',
    });

    return (await reception.save()).populate([
      { path: 'provider', select: 'name providerCode' },
      { path: 'receivedBy', select: 'name email' },
      { path: 'items.product', populate: ['brand', 'category'] },
    ]);
  }

  async findAllReceptions(
    branchId: string,
    status?: string,
  ): Promise<StockReceptionDocument[]> {
    const query: any = { branch: branchId };
    if (status) {
      query.status = status;
    }

    return this.receptionModel
      .find(query)
      .populate('provider', 'name providerCode')
      .populate('receivedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate({ path: 'items.product', populate: ['brand', 'category'] })
      .populate('items.openedBy', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findReceptionById(
    id: string,
    branchId: string,
  ): Promise<StockReceptionDocument> {
    const reception = await this.receptionModel
      .findOne({ _id: id, branch: branchId })
      .populate('provider', 'name providerCode')
      .populate('receivedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate({ path: 'items.product', populate: ['brand', 'category'] })
      .populate('items.openedBy', 'name email')
      .exec();

    if (!reception) {
      throw new NotFoundException('Recepción de inventario no encontrada');
    }
    return reception;
  }

  async approveReception(
    id: string,
    userId: string,
    branchId: string,
  ): Promise<StockReceptionDocument> {
    const reception = await this.findReceptionById(id, branchId);
    if (reception.status !== 'draft') {
      throw new BadRequestException(
        `Solo se pueden aprobar recepciones en estado draft. Estado actual: ${reception.status}`,
      );
    }

    reception.status = 'approved';
    reception.approvedBy = userId as any;
    reception.approvedAt = new Date();

    const saved = await reception.save();

    await this.auditLogsService.logAction({
      action: 'APPROVE_RECEPTION',
      module: 'inventory',
      description: `Recepción aprobada. Cajas generadas: ${saved.items.length}`,
      branchId,
      performedBy: userId,
      entityId: (saved._id as any).toString(),
      entityType: 'StockReception',
      metadata: { folio: saved.invoiceOrFolio, itemsCount: saved.items.length },
    });

    return saved.populate([
      { path: 'provider', select: 'name providerCode' },
      { path: 'receivedBy', select: 'name email' },
      { path: 'approvedBy', select: 'name email' },
      { path: 'items.product', populate: ['brand', 'category'] },
    ]);
  }

  async rejectReception(
    id: string,
    userId: string,
    branchId: string,
    reason?: string,
  ): Promise<StockReceptionDocument> {
    const reception = await this.findReceptionById(id, branchId);
    if (reception.status !== 'draft') {
      throw new BadRequestException(
        `Solo se pueden rechazar recepciones en estado draft. Estado actual: ${reception.status}`,
      );
    }

    reception.status = 'rejected';
    reception.approvedBy = userId as any;
    reception.rejectionReason = reason || 'Rechazado por el administrador';

    const saved = await reception.save();

    await this.auditLogsService.logAction({
      action: 'REJECT_RECEPTION',
      module: 'inventory',
      description: `Recepción rechazada. Razón: ${saved.rejectionReason}`,
      branchId,
      performedBy: userId,
      entityId: (saved._id as any).toString(),
      entityType: 'StockReception',
      metadata: { reason: saved.rejectionReason },
    });

    return saved.populate([
      { path: 'provider', select: 'name providerCode' },
      { path: 'receivedBy', select: 'name email' },
      { path: 'approvedBy', select: 'name email' },
      { path: 'items.product', populate: ['brand', 'category'] },
    ]);
  }

  async openBox(boxCode: string, userId: string, branchId: string) {
    const cleanCode = (boxCode || '').trim();
    if (!cleanCode) {
      throw new BadRequestException('Se requiere el código de la caja');
    }

    const reception = await this.receptionModel
      .findOne({
        branch: branchId,
        'items.boxCode': cleanCode,
      })
      .populate('provider', 'name providerCode')
      .exec();

    if (!reception) {
      throw new NotFoundException(
        `No se encontró ninguna caja con el código: ${cleanCode}`,
      );
    }

    if (reception.status !== 'approved') {
      throw new BadRequestException(
        `Esta caja pertenece a una recepción en estado "${reception.status}". Primero debe ser aprobada por el administrador.`,
      );
    }

    const item = reception.items.find((i) => i.boxCode === cleanCode);
    if (!item) {
      throw new NotFoundException(
        `Ítem no encontrado para el código ${cleanCode}`,
      );
    }

    if (!item.isBoxSealed) {
      throw new BadRequestException(
        `Esta caja ya fue abierta anteriormente el ${item.openedAt?.toLocaleString() || ''}`,
      );
    }

    const productId = (item.product as any)?._id || (item.product as any);
    const product = await this.productModel.findOne({
      _id: productId,
      branch: branchId,
    });
    if (!product) {
      throw new NotFoundException('Producto asociado a la caja no encontrado');
    }

    // 1. Aumentar stock de mostrador
    const oldStock = product.stock;
    product.stock += item.quantity;

    // 2. Unificar precio de venta en mostrador (si el lote trae nuevo precio, todas las piezas en mostrador adoptan el nuevo precio)
    const oldSellingPrice = product.sellingPrice;
    if (item.sellingPrice && item.sellingPrice > 0) {
      product.sellingPrice = item.sellingPrice;
    }
    product.costPrice = item.costPrice;
    await product.save();

    // 3. Registrar movimiento de stock formal en Kardex
    const movement = new this.movementModel({
      product: product._id,
      branch: branchId,
      type: 'in',
      quantity: item.quantity,
      reason: `Apertura de caja/lote #${item.boxCode} (Precio venta actualizado de $${oldSellingPrice} a $${product.sellingPrice})`,
      performedBy: userId as any,
      provider: reception.provider
        ? (reception.provider as any)._id || reception.provider
        : null,
      balanceAfter: product.stock,
    });
    await movement.save();

    // 4. Marcar caja como abierta
    item.isBoxSealed = false;
    item.openedAt = new Date();
    item.openedBy = userId as any;
    await reception.save();

    await this.auditLogsService.logAction({
      action: 'OPEN_BOX',
      module: 'inventory',
      description: `Caja ${item.boxCode} abierta. ${item.quantity} piezas ingresadas al stock. Precio venta unificado: $${product.sellingPrice}`,
      branchId,
      performedBy: userId,
      entityId: (product._id as any).toString(),
      entityType: 'Product',
      metadata: {
        boxCode: item.boxCode,
        sku: product.sku,
        quantity: item.quantity,
        sellingPrice: product.sellingPrice,
        receptionId: (reception._id as any).toString(),
      },
    });

    return {
      success: true,
      message: `Caja ${item.boxCode} abierta exitosamente. Se agregaron ${item.quantity} piezas al stock (Total: ${product.stock}) y el precio se actualizó a $${product.sellingPrice}`,
      boxCode: item.boxCode,
      product: {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        previousStock: oldStock,
        currentStock: product.stock,
        previousSellingPrice: oldSellingPrice,
        currentSellingPrice: product.sellingPrice,
      },
    };
  }
}
