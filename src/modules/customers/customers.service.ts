import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { I18nContext } from 'nestjs-i18n';
import { buildFuzzyRegex } from '../../common/utils/search.util';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {}

  async create(
    createCustomerDto: CreateCustomerDto,
    branchId: string,
  ): Promise<CustomerDocument> {
    const existing = await this.customerModel.findOne({
      phone: createCustomerDto.phone.trim(),
      branch: branchId,
    });
    if (existing) {
      const i18n = I18nContext.current();
      throw new BadRequestException(
        i18n
          ? i18n.t('common.errors.customerPhoneRegistered')
          : 'Un cliente con este teléfono ya existe',
      );
    }
    const created = new this.customerModel({
      ...createCustomerDto,
      branch: branchId,
      email: createCustomerDto.email
        ? createCustomerDto.email.toLowerCase().trim()
        : undefined,
      phone: createCustomerDto.phone.trim(),
    });
    return created.save();
  }

  async findAll(
    branchId: string,
    search?: string,
  ): Promise<CustomerDocument[]> {
    const query: any = {};
    if (branchId) {
      query.branch = branchId;
    }
    if (search) {
      const trimmed = search.trim();
      const cleanDigits = trimmed.replace(/\D/g, '');
      const regex = buildFuzzyRegex(trimmed);
      const orConditions: any[] = [
        { name: regex },
        { phone: { $regex: trimmed, $options: 'i' } },
        { email: { $regex: trimmed, $options: 'i' } },
      ];
      if (cleanDigits.length >= 7) {
        const regexPattern = cleanDigits.slice(-10).split('').join('\\D*');
        orConditions.push({ phone: { $regex: regexPattern, $options: 'i' } });
      }
      query.$or = orConditions;
    }
    let results = await this.customerModel.find(query).sort({ name: 1 }).exec();
    if (results.length === 0 && search && branchId) {
      const fallbackQuery: any = { ...query };
      delete fallbackQuery.branch;
      results = await this.customerModel
        .find(fallbackQuery)
        .sort({ name: 1 })
        .exec();
    }
    return results;
  }

  async findById(id: string, branchId?: string): Promise<CustomerDocument> {
    const query: any = { _id: id };
    if (branchId) query.branch = branchId;
    let customer = await this.customerModel.findOne(query).exec();
    if (!customer && branchId) {
      customer = await this.customerModel.findOne({ _id: id }).exec();
    }
    if (!customer) {
      const i18n = I18nContext.current();
      throw new NotFoundException(
        i18n
          ? i18n.t('common.errors.customerNotFound')
          : 'Cliente no encontrado',
      );
    }
    return customer;
  }

  async findByPhone(
    phone: string,
    branchId?: string,
  ): Promise<CustomerDocument> {
    const raw = (phone || '').trim();
    const cleanDigits = raw.replace(/\D/g, '');
    const last10 = cleanDigits.slice(-10);

    const buildPhoneQuery = (bId?: string) => {
      const q: any = {};
      if (bId) q.branch = bId;

      const conditions: any[] = [{ phone: raw }];
      if (cleanDigits && cleanDigits !== raw) {
        conditions.push({ phone: cleanDigits });
      }
      if (last10.length >= 7) {
        const regexPattern = last10.split('').join('\\D*');
        conditions.push({ phone: { $regex: regexPattern, $options: 'i' } });
      }
      q.$or = conditions;
      return q;
    };

    let customer: CustomerDocument | null = null;
    if (branchId) {
      customer = await this.customerModel
        .findOne(buildPhoneQuery(branchId))
        .exec();
    }
    if (!customer) {
      customer = await this.customerModel.findOne(buildPhoneQuery()).exec();
    }

    if (!customer) {
      const i18n = I18nContext.current();
      throw new NotFoundException(
        i18n
          ? i18n.t('common.errors.customerPhoneNotFound')
          : 'Cliente con ese teléfono no encontrado',
      );
    }
    return customer;
  }

  async update(
    id: string,
    branchId: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerDocument> {
    const customer = await this.findById(id, branchId);

    if (
      updateCustomerDto.phone &&
      updateCustomerDto.phone.trim() !== customer.phone
    ) {
      const existing = await this.customerModel.findOne({
        phone: updateCustomerDto.phone.trim(),
        branch: branchId,
      });
      if (existing) {
        const i18n = I18nContext.current();
        throw new BadRequestException(
          i18n
            ? i18n.t('common.errors.phoneRegistered')
            : 'Ya existe otro cliente registrado con ese teléfono',
        );
      }
      customer.phone = updateCustomerDto.phone.trim();
    }

    if (
      updateCustomerDto.email &&
      updateCustomerDto.email.toLowerCase().trim() !== customer.email
    ) {
      const existing = await this.customerModel.findOne({
        email: updateCustomerDto.email.toLowerCase().trim(),
        branch: branchId,
      });
      if (existing) {
        const i18n = I18nContext.current();
        throw new BadRequestException(
          i18n
            ? i18n.t('common.errors.customerEmailRegistered')
            : 'Ya existe otro cliente registrado con ese correo electrónico',
        );
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

  async remove(id: string, branchId: string): Promise<void> {
    const res = await this.customerModel.findOneAndDelete({
      _id: id,
      branch: branchId,
    });
    if (!res) {
      const i18n = I18nContext.current();
      throw new NotFoundException(
        i18n
          ? i18n.t('common.errors.customerNotFound')
          : 'Cliente no encontrado',
      );
    }
  }
}
