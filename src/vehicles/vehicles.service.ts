import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vehicle, VehicleDocument } from './schemas/vehicle.schema';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { CustomersService } from '../customers/customers.service';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectModel(Vehicle.name) private vehicleModel: Model<VehicleDocument>,
    private readonly customersService: CustomersService,
  ) {}

  async create(createVehicleDto: CreateVehicleDto): Promise<VehicleDocument> {
    // Verify customer exists
    await this.customersService.findById(createVehicleDto.customerId);

    // Verify serial number unique
    const formattedSerial = createVehicleDto.serialNumberLastFour.toUpperCase().trim();
    const existing = await this.vehicleModel.findOne({ serialNumberLastFour: formattedSerial });
    if (existing) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.vehicleSerialNumberRegistered') : 'Ya existe un vehículo registrado con este número de serie (últimos 4 dígitos)');
    }

    const created = new this.vehicleModel({
      ...createVehicleDto,
      customer: createVehicleDto.customerId as any,
      serialNumberLastFour: formattedSerial,
    });

    return (await created.save()).populate('customer');
  }

  async findAll(filters: { customerId?: string; search?: string }): Promise<VehicleDocument[]> {
    const query: any = {};
    if (filters.customerId) {
      query.customer = filters.customerId;
    }
    if (filters.search) {
      query.$or = [
        { brand: { $regex: filters.search, $options: 'i' } },
        { model: { $regex: filters.search, $options: 'i' } },
        { serialNumberLastFour: { $regex: filters.search, $options: 'i' } },
      ];
    }
    return this.vehicleModel.find(query).populate('customer').exec();
  }

  async findById(id: string): Promise<VehicleDocument> {
    const vehicle = await this.vehicleModel.findById(id).populate('customer').exec();
    if (!vehicle) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.vehicleNotFound') : 'Vehículo no encontrado');
    }
    return vehicle;
  }

  async findBySerialNumberLastFour(serialNumberLastFour: string): Promise<VehicleDocument> {
    const vehicle = await this.vehicleModel
      .findOne({ serialNumberLastFour: serialNumberLastFour.toUpperCase().trim() })
      .populate('customer')
      .exec();
    if (!vehicle) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.vehicleSerialNumberNotFound') : 'Vehículo con ese número de serie (últimos 4 dígitos) no encontrado');
    }
    return vehicle;
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto): Promise<VehicleDocument> {
    const vehicle = await this.findById(id);

    if (updateVehicleDto.customerId) {
      await this.customersService.findById(updateVehicleDto.customerId);
      vehicle.customer = updateVehicleDto.customerId as any;
    }

    if (updateVehicleDto.serialNumberLastFour) {
      const formattedSerial = updateVehicleDto.serialNumberLastFour.toUpperCase().trim();
      if (formattedSerial !== vehicle.serialNumberLastFour) {
        const existing = await this.vehicleModel.findOne({ serialNumberLastFour: formattedSerial });
        if (existing) {
          const i18n = I18nContext.current();
          throw new BadRequestException(i18n ? i18n.t('common.errors.vehicleSerialNumberRegistered') : 'Ya existe otro vehículo registrado con este número de serie (últimos 4 dígitos)');
        }
        vehicle.serialNumberLastFour = formattedSerial;
      }
    }

    if (updateVehicleDto.brand) vehicle.brand = updateVehicleDto.brand;
    if (updateVehicleDto.model) (vehicle as any).model = updateVehicleDto.model;
    if (updateVehicleDto.year !== undefined) vehicle.year = updateVehicleDto.year;
    if (updateVehicleDto.color !== undefined) vehicle.color = updateVehicleDto.color;

    return (await vehicle.save()).populate('customer');
  }

  async remove(id: string): Promise<void> {
    const res = await this.vehicleModel.findByIdAndDelete(id);
    if (!res) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.vehicleNotFound') : 'Vehículo no encontrado');
    }
  }
}
