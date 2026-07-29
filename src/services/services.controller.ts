import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { BranchGuard } from '../common/guards/branch.guard';
import { BranchId } from '../common/decorators/branch-id.decorator';
import { I18nContext } from 'nestjs-i18n';

@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @Roles('admin', 'warehouse')
  async create(
    @Body() createServiceDto: CreateServiceDto,
    @BranchId() branchId: string,
  ) {
    const service = await this.servicesService.create(createServiceDto, branchId);
    const i18n = I18nContext.current();
    return {
      success: true,
      data: service,
      message: i18n ? i18n.t('common.success') : 'Servicio creado exitosamente.',
    };
  }

  @Get()
  async findAll(
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;

    const services = await this.servicesService.findAll(filters);
    const i18n = I18nContext.current();
    return {
      success: true,
      data: services,
      message: i18n ? i18n.t('common.success') : 'Success',
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const service = await this.servicesService.findById(id);
    const i18n = I18nContext.current();
    return {
      success: true,
      data: service,
      message: i18n ? i18n.t('common.success') : 'Success',
    };
  }

  @Patch(':id')
  @Roles('admin', 'warehouse')
  async update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @BranchId() branchId: string,
  ) {
    const service = await this.servicesService.update(id, updateServiceDto, branchId);
    const i18n = I18nContext.current();
    return {
      success: true,
      data: service,
      message: i18n ? i18n.t('common.success') : 'Servicio actualizado correctamente.',
    };
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: string) {
    await this.servicesService.remove(id);
    const i18n = I18nContext.current();
    return {
      success: true,
      data: null,
      message: i18n ? i18n.t('common.success') : 'Servicio eliminado.',
    };
  }
}
