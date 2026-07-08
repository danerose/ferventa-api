import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Brand, BrandDocument } from './schemas/brand.schema';
import { Category, CategoryDocument } from './schemas/category.schema';
import { Provider, ProviderDocument } from './schemas/provider.schema';
import { Product, ProductDocument } from './schemas/product.schema';
import { StockMovement, StockMovementDocument } from './schemas/stock-movement.schema';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProviderDto } from './dto/create-provider.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(Brand.name) private brandModel: Model<BrandDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Provider.name) private providerModel: Model<ProviderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(StockMovement.name) private movementModel: Model<StockMovementDocument>,
  ) {}

  // --- BRAND CRUD ---
  async createBrand(createBrandDto: CreateBrandDto): Promise<Brand> {
    const existing = await this.brandModel.findOne({ name: createBrandDto.name.trim() });
    if (existing) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.brandRegistered') : 'Esta marca ya está registrada');
    }
    return this.brandModel.create({ name: createBrandDto.name.trim() });
  }

  async findAllBrands(): Promise<Brand[]> {
    return this.brandModel.find().sort({ name: 1 }).exec();
  }

  async deleteBrand(id: string): Promise<void> {
    // Check if any product is using this brand
    const productsUsing = await this.productModel.countDocuments({ brand: id as any });
    if (productsUsing > 0) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.brandHasProducts') : 'No se puede eliminar la marca porque hay productos asociados a ella');
    }
    const res = await this.brandModel.findByIdAndDelete(id);
    if (!res) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.brandNotFound') : 'Marca no encontrada');
    }
  }

  // --- CATEGORY CRUD ---
  async createCategory(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoryModel.findOne({ name: createCategoryDto.name.trim() });
    if (existing) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.categoryRegistered') : 'Esta categoría ya está registrada');
    }
    return this.categoryModel.create({ name: createCategoryDto.name.trim() });
  }

  async findAllCategories(): Promise<Category[]> {
    return this.categoryModel.find().sort({ name: 1 }).exec();
  }

  async deleteCategory(id: string): Promise<void> {
    const productsUsing = await this.productModel.countDocuments({ category: id as any });
    if (productsUsing > 0) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.categoryHasProducts') : 'No se puede eliminar la categoría porque hay productos asociados a ella');
    }
    const res = await this.categoryModel.findByIdAndDelete(id);
    if (!res) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.categoryNotFound') : 'Categoría no encontrada');
    }
  }

  // --- PROVIDER CRUD ---
  async createProvider(createProviderDto: CreateProviderDto): Promise<Provider> {
    return this.providerModel.create(createProviderDto);
  }

  async findAllProviders(): Promise<Provider[]> {
    return this.providerModel.find().sort({ name: 1 }).exec();
  }

  async updateProvider(id: string, createProviderDto: CreateProviderDto): Promise<Provider> {
    const provider = await this.providerModel.findByIdAndUpdate(id, createProviderDto, { new: true });
    if (!provider) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.providerNotFound') : 'Proveedor no encontrado');
    }
    return provider;
  }

  async deleteProvider(id: string): Promise<void> {
    const productsUsing = await this.productModel.countDocuments({ provider: id as any });
    if (productsUsing > 0) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.providerHasProducts') : 'No se puede eliminar el proveedor porque hay productos asociados a él');
    }
    const res = await this.providerModel.findByIdAndDelete(id);
    if (!res) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.providerNotFound') : 'Proveedor no encontrado');
    }
  }

  // --- PRODUCT CRUD ---
  async createProduct(createProductDto: CreateProductDto): Promise<ProductDocument> {
    const existing = await this.productModel.findOne({ sku: createProductDto.sku.toUpperCase() });
    if (existing) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.skuRegistered') : 'Ya existe un producto registrado con este SKU');
    }

    // Verify brand, category, and provider exist
    const brandExists = await this.brandModel.exists({ _id: createProductDto.brandId });
    if (!brandExists) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.brandNotFound') : 'La marca especificada no existe');
    }

    const categoryExists = await this.categoryModel.exists({ _id: createProductDto.categoryId });
    if (!categoryExists) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.categoryNotFound') : 'La categoría especificada no existe');
    }

    const providerExists = await this.providerModel.exists({ _id: createProductDto.providerId });
    if (!providerExists) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.providerNotFound') : 'El proveedor especificado no existe');
    }

    const product = new this.productModel({
      ...createProductDto,
      sku: createProductDto.sku.toUpperCase(),
      brand: createProductDto.brandId,
      category: createProductDto.categoryId,
      provider: createProductDto.providerId,
    });

    return (await product.save()).populate(['brand', 'category', 'provider']);
  }

  async findAllProducts(filters: { search?: string; categoryId?: string; brandId?: string }): Promise<ProductDocument[]> {
    const query: any = { isActive: true };

    if (filters.categoryId) {
      query.category = filters.categoryId;
    }
    if (filters.brandId) {
      query.brand = filters.brandId;
    }
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { sku: { $regex: filters.search, $options: 'i' } },
        { compatibility: { $regex: filters.search, $options: 'i' } },
      ];
    }

    return this.productModel
      .find(query)
      .populate(['brand', 'category', 'provider'])
      .sort({ name: 1 })
      .exec();
  }

  async findProductById(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id).populate(['brand', 'category', 'provider']).exec();
    if (!product) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.productNotFound') : 'Producto no encontrado');
    }
    return product;
  }

  async findProductBySku(sku: string): Promise<ProductDocument> {
    const product = await this.productModel.findOne({ sku: sku.toUpperCase() }).populate(['brand', 'category', 'provider']).exec();
    if (!product) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.productSkuNotFound') : 'Producto con SKU especificado no encontrado');
    }
    return product;
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto): Promise<ProductDocument> {
    const product = await this.findProductById(id);

    if (updateProductDto.brandId) {
      const brandExists = await this.brandModel.exists({ _id: updateProductDto.brandId });
      if (!brandExists) {
        const i18n = I18nContext.current();
        throw new NotFoundException(i18n ? i18n.t('common.errors.brandNotFound') : 'La marca especificada no existe');
      }
      product.brand = updateProductDto.brandId as any;
    }

    if (updateProductDto.categoryId) {
      const categoryExists = await this.categoryModel.exists({ _id: updateProductDto.categoryId });
      if (!categoryExists) {
        const i18n = I18nContext.current();
        throw new NotFoundException(i18n ? i18n.t('common.errors.categoryNotFound') : 'La categoría especificada no existe');
      }
      product.category = updateProductDto.categoryId as any;
    }

    if (updateProductDto.providerId) {
      const providerExists = await this.providerModel.exists({ _id: updateProductDto.providerId });
      if (!providerExists) {
        const i18n = I18nContext.current();
        throw new NotFoundException(i18n ? i18n.t('common.errors.providerNotFound') : 'El proveedor especificado no existe');
      }
      product.provider = updateProductDto.providerId as any;
    }

    // Explicitly update simple fields
    if (updateProductDto.name) product.name = updateProductDto.name;
    if (updateProductDto.description) product.description = updateProductDto.description;
    if (updateProductDto.costPrice !== undefined) product.costPrice = updateProductDto.costPrice;
    if (updateProductDto.sellingPrice !== undefined) product.sellingPrice = updateProductDto.sellingPrice;
    if (updateProductDto.stock !== undefined) product.stock = updateProductDto.stock;
    if (updateProductDto.minStock !== undefined) product.minStock = updateProductDto.minStock;
    if (updateProductDto.unit) product.unit = updateProductDto.unit;
    if (updateProductDto.photos) product.photos = updateProductDto.photos;
    if (updateProductDto.compatibility) product.compatibility = updateProductDto.compatibility;
    if (updateProductDto.isActive !== undefined) product.isActive = updateProductDto.isActive;

    const saved = await product.save();
    return saved.populate(['brand', 'category', 'provider']);
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await this.findProductById(id);
    product.isActive = false;
    await product.save();
  }

  // --- STOCK MOVEMENT ---
  async registerMovement(
    createStockMovementDto: CreateStockMovementDto,
    userId: string,
  ): Promise<StockMovementDocument> {
    const product = await this.productModel.findById(createStockMovementDto.productId);
    if (!product) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.productNotFound') : 'Producto no encontrado');
    }

    const { type, quantity, reason } = createStockMovementDto;

    if (type === 'in') {
      product.stock += quantity;
    } else if (type === 'out') {
      if (product.stock < quantity) {
        const i18n = I18nContext.current();
        const message = i18n
          ? i18n.t('common.errors.insufficientStockDetailed', { args: { stock: product.stock, required: quantity } })
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
          ? i18n.t('common.errors.negativeStockAdjustment', { args: { stock: newStock } })
          : `El ajuste dejaría el stock en negativo: ${newStock}`;
        throw new BadRequestException(message);
      }
      product.stock = newStock;
    }

    await product.save();

    const movement = new this.movementModel({
      product: product._id,
      type,
      quantity,
      reason,
      performedBy: userId as any,
    });

    return (await movement.save()).populate([
      { path: 'product', populate: ['brand', 'category'] },
      { path: 'performedBy', select: 'name email' }
    ]);
  }

  async findMovementsByProduct(productId: string): Promise<StockMovementDocument[]> {
    return this.movementModel
      .find({ product: productId as any })
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAllMovements(): Promise<StockMovementDocument[]> {
    return this.movementModel
      .find()
      .populate('product', 'sku name')
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }
}
