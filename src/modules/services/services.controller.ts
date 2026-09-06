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
import {
  ApiQuery,
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { BranchGuard } from '../../common/guards/branch.guard';
import { BranchId } from '../../common/decorators/branch-id.decorator';
import { I18nContext } from 'nestjs-i18n';

@ApiTags('Servicios Predefinidos')
@ApiBearerAuth()
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
    const service = await this.servicesService.create(
      createServiceDto,
      branchId,
    );
    const i18n = I18nContext.current();
    return {
      success: true,
      data: service,
      message: i18n
        ? i18n.t('common.success')
        : 'Servicio creado exitosamente.',
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos los servicios predefinidos paginados',
  })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Búsqueda por nombre de servicio',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    type: String,
    description: 'Alias para término de búsqueda',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async findAll(
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('q') q?: string,
    @Query() query?: PaginationQueryDto,
  ) {
    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    const searchTerm = search || q;
    if (searchTerm) filters.search = searchTerm;
    filters.page = query?.page;
    filters.limit = query?.limit;

    const result = await this.servicesService.findAll(filters);
    const i18n = I18nContext.current();
    return {
      success: true,
      data: result,
      message: i18n ? i18n.t('common.success') : 'Success',
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar servicios por nombre' })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Término de búsqueda por nombre',
  })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async searchByName(
    @Query('q') q: string,
    @Query('isActive') isActive?: string,
    @Query() query?: PaginationQueryDto,
  ) {
    const activeFilter =
      isActive !== undefined ? isActive === 'true' : undefined;
    const result = await this.servicesService.searchByName(
      q || '',
      activeFilter,
      query?.page,
      query?.limit,
    );
    const i18n = I18nContext.current();
    return {
      success: true,
      data: result,
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
    const service = await this.servicesService.update(
      id,
      updateServiceDto,
      branchId,
    );
    const i18n = I18nContext.current();
    return {
      success: true,
      data: service,
      message: i18n
        ? i18n.t('common.success')
        : 'Servicio actualizado correctamente.',
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
