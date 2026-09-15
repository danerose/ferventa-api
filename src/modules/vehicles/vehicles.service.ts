import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vehicle, VehicleDocument } from './schemas/vehicle.schema';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { CustomersService } from '../customers/customers.service';
import { I18nContext } from 'nestjs-i18n';
import {
  buildFuzzyRegex,
  calculateVehicleMatchScore,
} from '../../common/utils/search.util';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectModel(Vehicle.name) private vehicleModel: Model<VehicleDocument>,
    private readonly customersService: CustomersService,
  ) {}

  async create(
    createVehicleDto: CreateVehicleDto,
    branchId: string,
  ): Promise<VehicleDocument> {
    return this.findOrCreateByClosestMatch(
      createVehicleDto.customerId,
      createVehicleDto,
      branchId,
    );
  }

  /**
   * Finds the closest matching vehicle for a customer in the branch,
   * or creates a new one if no close match is found.
   */
  async findOrCreateByClosestMatch(
    customerId: string,
    dto: {
      brand: string;
      model: string;
      year?: number;
      serialNumberLastFour?: string;
      color?: string;
    },
    branchId: string,
  ): Promise<VehicleDocument> {
    // Verify customer exists and belongs to the same branch
    await this.customersService.findById(customerId, branchId);

    const formattedBrand = (dto.brand || '').trim();
    const formattedModel = (dto.model || '').trim();
    const formattedYear =
      dto.year !== undefined && dto.year !== null && !isNaN(Number(dto.year))
        ? Number(dto.year)
        : undefined;
    const formattedSerial = (dto.serialNumberLastFour || '')
      .toUpperCase()
      .trim();
    const formattedColor = (dto.color || '').trim();

    // Check if customer already has vehicles in this branch
    const customerVehicles = await this.vehicleModel
      .find({
        customer: customerId as any,
        branch: branchId,
      })
      .populate('customer')
      .exec();

    let bestMatch: VehicleDocument | null = null;
    let bestScore = 0;
    const MATCH_THRESHOLD = 0.65;

    for (const vehicle of customerVehicles) {
      const score = calculateVehicleMatchScore(
        {
          brand: formattedBrand,
          model: formattedModel,
          year: formattedYear,
          serialNumberLastFour: formattedSerial,
        },
        {
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          serialNumberLastFour: vehicle.serialNumberLastFour,
        },
      );

      if (score > bestScore) {
        bestScore = score;
        bestMatch = vehicle;
      }
    }

    if (bestMatch && bestScore >= MATCH_THRESHOLD) {
      // Enrich matched vehicle with incoming fields if it was missing them
      let hasChanges = false;
      if (formattedSerial && !bestMatch.serialNumberLastFour) {
        bestMatch.serialNumberLastFour = formattedSerial;
        hasChanges = true;
      }
      if (formattedYear !== undefined && !bestMatch.year) {
        bestMatch.year = formattedYear;
        hasChanges = true;
      }
      if (formattedColor && !bestMatch.color) {
        bestMatch.color = formattedColor;
        hasChanges = true;
      }

      if (hasChanges) {
        await bestMatch.save();
      }

      return bestMatch;
    }

    // No close match found or no vehicles registered: create a new vehicle for this customer
    const created = new this.vehicleModel({
      customer: customerId as any,
      branch: branchId,
      brand: formattedBrand,
      model: formattedModel,
      ...(formattedYear !== undefined ? { year: formattedYear } : {}),
      serialNumberLastFour: formattedSerial,
      color: formattedColor,
    });

    return (await created.save()).populate('customer');
  }

  async findOrCreateByExactMatch(
    customerId: string,
    dto: {
      brand: string;
      model: string;
      year?: number;
      serialNumberLastFour?: string;
      color?: string;
    },
    branchId: string,
  ): Promise<VehicleDocument> {
    return this.findOrCreateByClosestMatch(customerId, dto, branchId);
  }

  async findAll(
    branchId: string,
    filters: { customerId?: string; search?: string },
  ): Promise<VehicleDocument[]> {
    const query: any = { branch: branchId };
    if (filters.customerId) {
      query.customer = filters.customerId;
    }
    if (filters.search) {
      const regex = buildFuzzyRegex(filters.search);
      query.$or = [
        { brand: regex },
        { model: regex },
        {
          serialNumberLastFour: {
            $regex: filters.search.trim(),
            $options: 'i',
          },
        },
      ];
    }
    return this.vehicleModel.find(query).populate('customer').exec();
  }

  async findById(id: string, branchId: string): Promise<VehicleDocument> {
    const vehicle = await this.vehicleModel
      .findOne({ _id: id, branch: branchId })
      .populate('customer')
      .exec();
    if (!vehicle) {
      const i18n = I18nContext.current();
      throw new NotFoundException(
        i18n
          ? i18n.t('common.errors.vehicleNotFound')
          : 'Vehículo no encontrado',
      );
    }
    return vehicle;
  }

  async findBySerialNumberLastFour(
    serialNumberLastFour: string,
    branchId: string,
  ): Promise<VehicleDocument> {
    const vehicle = await this.vehicleModel
      .findOne({
        serialNumberLastFour: serialNumberLastFour.toUpperCase().trim(),
        branch: branchId,
      })
      .populate('customer')
      .exec();
    if (!vehicle) {
      const i18n = I18nContext.current();
      throw new NotFoundException(
        i18n
          ? i18n.t('common.errors.vehicleSerialNumberNotFound')
          : 'Vehículo con ese número de serie (últimos 4 dígitos) no encontrado',
      );
    }
    return vehicle;
  }

  async findByCustomerAndSerial(
    customerId: string,
    serialNumberLastFour: string,
    branchId: string,
  ): Promise<VehicleDocument | null> {
    return this.vehicleModel
      .findOne({
        customer: customerId as any,
        serialNumberLastFour: serialNumberLastFour.toUpperCase().trim(),
        branch: branchId,
      })
      .populate('customer')
      .exec();
  }

  async update(
    id: string,
    branchId: string,
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<VehicleDocument> {
    const vehicle = await this.findById(id, branchId);

    if (updateVehicleDto.customerId) {
      await this.customersService.findById(
        updateVehicleDto.customerId,
        branchId,
      );
      vehicle.customer = updateVehicleDto.customerId as any;
    }

    if (updateVehicleDto.serialNumberLastFour) {
      const formattedSerial = updateVehicleDto.serialNumberLastFour
        .toUpperCase()
        .trim();
      vehicle.serialNumberLastFour = formattedSerial;
    }

    if (updateVehicleDto.brand) vehicle.brand = updateVehicleDto.brand;
    if (updateVehicleDto.model) (vehicle as any).model = updateVehicleDto.model;
    if (updateVehicleDto.year !== undefined)
      vehicle.year = updateVehicleDto.year;
    if (updateVehicleDto.color !== undefined)
      vehicle.color = updateVehicleDto.color;

    return (await vehicle.save()).populate('customer');
  }

  async remove(id: string, branchId: string): Promise<void> {
    const res = await this.vehicleModel.findOneAndDelete({
      _id: id,
      branch: branchId,
    });
    if (!res) {
      const i18n = I18nContext.current();
      throw new NotFoundException(
        i18n
          ? i18n.t('common.errors.vehicleNotFound')
          : 'Vehículo no encontrado',
      );
    }
  }
}
