import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PredefinedService, PredefinedServiceDocument } from './schemas/service.schema';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { InventoryService } from '../inventory/inventory.service';
import { PaginatedResult } from '../common/dto/pagination.dto';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(PredefinedService.name) private serviceModel: Model<PredefinedServiceDocument>,
    private readonly inventoryService: InventoryService,
  ) {}

  async create(createServiceDto: CreateServiceDto, branchId: string): Promise<PredefinedServiceDocument> {
    const supplies = await this.validateSupplies(createServiceDto.supplies, branchId);

    const service = new this.serviceModel({
      ...createServiceDto,
      supplies,
    });

    return (await service.save()).populate('supplies.product');
  }

  async findAll(filters: { isActive?: boolean; search?: string; page?: number; limit?: number }): Promise<PaginatedResult<PredefinedServiceDocument>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const query: any = {};
    
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.serviceModel
        .find(query)
        .populate('supplies.product')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.serviceModel.countDocuments(query),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  async searchByName(search: string, isActive?: boolean, page = 1, limit = 10): Promise<PaginatedResult<PredefinedServiceDocument>> {
    const query: any = { name: { $regex: search, $options: 'i' } };
    if (isActive !== undefined) {
      query.isActive = isActive;
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.serviceModel.find(query).populate('supplies.product').sort({ name: 1 }).skip(skip).limit(limit).exec(),
      this.serviceModel.countDocuments(query),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  async findById(id: string): Promise<PredefinedServiceDocument> {
    if (!Types.ObjectId.isValid(id)) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.invalidId') : 'ID inválido');
    }

    const service = await this.serviceModel
      .findById(id)
      .populate('supplies.product')
      .exec();

    if (!service) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.serviceNotFound') : 'Servicio no encontrado');
    }

    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto, branchId: string): Promise<PredefinedServiceDocument> {
    const service = await this.findById(id);

    if (updateServiceDto.name) service.name = updateServiceDto.name;
    if (updateServiceDto.description !== undefined) service.description = updateServiceDto.description;
    if (updateServiceDto.basePrice !== undefined) service.basePrice = updateServiceDto.basePrice;
    if (updateServiceDto.isActive !== undefined) service.isActive = updateServiceDto.isActive;

    if (updateServiceDto.supplies) {
      service.supplies = await this.validateSupplies(updateServiceDto.supplies, branchId);
    }

    return (await service.save()).populate('supplies.product');
  }

  async remove(id: string): Promise<void> {
    const service = await this.findById(id);
    await this.serviceModel.deleteOne({ _id: service._id }).exec();
  }

  private async validateSupplies(suppliesDto: any[] | undefined, branchId: string): Promise<any[]> {
    if (!suppliesDto || suppliesDto.length === 0) return [];
    
    const validSupplies: any[] = [];
    for (const supply of suppliesDto) {
      // Validates product exists
      const product = await this.inventoryService.findProductById(supply.productId, branchId);
      validSupplies.push({
        product: product._id,
        quantity: supply.quantity,
      });
    }
    return validSupplies;
  }
}
