import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<CustomerDocument> {
    const phoneExisting = await this.customerModel.findOne({ phone: createCustomerDto.phone.trim() });
    if (phoneExisting) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.phoneRegistered') : 'Ya existe un cliente registrado con ese teléfono');
    }

    if (createCustomerDto.email) {
      const emailExisting = await this.customerModel.findOne({ email: createCustomerDto.email.toLowerCase().trim() });
      if (emailExisting) {
        const i18n = I18nContext.current();
        throw new BadRequestException(i18n ? i18n.t('common.errors.customerEmailRegistered') : 'Ya existe un cliente registrado con ese correo electrónico');
      }
    }

    const created = new this.customerModel({
      ...createCustomerDto,
      email: createCustomerDto.email ? createCustomerDto.email.toLowerCase().trim() : undefined,
      phone: createCustomerDto.phone.trim(),
    });
    return created.save();
  }

  async findAll(search?: string): Promise<CustomerDocument[]> {
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    return this.customerModel.find(query).sort({ name: 1 }).exec();
  }

  async findById(id: string): Promise<CustomerDocument> {
    const customer = await this.customerModel.findById(id).exec();
    if (!customer) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.customerNotFound') : 'Cliente no encontrado');
    }
    return customer;
  }

  async findByPhone(phone: string): Promise<CustomerDocument> {
    const customer = await this.customerModel.findOne({ phone: phone.trim() }).exec();
    if (!customer) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.customerPhoneNotFound') : 'Cliente con ese teléfono no encontrado');
    }
    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<CustomerDocument> {
    const customer = await this.findById(id);

    if (updateCustomerDto.phone && updateCustomerDto.phone.trim() !== customer.phone) {
      const existing = await this.customerModel.findOne({ phone: updateCustomerDto.phone.trim() });
      if (existing) {
        const i18n = I18nContext.current();
        throw new BadRequestException(i18n ? i18n.t('common.errors.phoneRegistered') : 'Ya existe otro cliente registrado con ese teléfono');
      }
      customer.phone = updateCustomerDto.phone.trim();
    }

    if (updateCustomerDto.email && updateCustomerDto.email.toLowerCase().trim() !== customer.email) {
      const existing = await this.customerModel.findOne({ email: updateCustomerDto.email.toLowerCase().trim() });
      if (existing) {
        const i18n = I18nContext.current();
        throw new BadRequestException(i18n ? i18n.t('common.errors.customerEmailRegistered') : 'Ya existe otro cliente registrado con ese correo electrónico');
      }
      customer.email = updateCustomerDto.email.toLowerCase().trim();
    }

    if (updateCustomerDto.name) {
      customer.name = updateCustomerDto.name;
    }
    if (updateCustomerDto.whatsappId !== undefined) {
      customer.whatsappId = updateCustomerDto.whatsappId;
    }

    return customer.save();
  }

  async remove(id: string): Promise<void> {
    const res = await this.customerModel.findByIdAndDelete(id);
    if (!res) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.customerNotFound') : 'Cliente no encontrado');
    }
  }
}
