import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { I18nContext } from 'nestjs-i18n';

@ApiTags('Reportes & Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @Roles('admin')
  @ApiOperation({ summary: 'Obtener resumen financiero de ventas por rango de fechas (Solo Admin)' })
  @ApiQuery({ name: 'startDate', required: true, example: '2026-07-01', description: 'Fecha inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, example: '2026-07-31', description: 'Fecha fin (YYYY-MM-DD)' })
  getSalesSummary(
    @Query('startDate') start: string,
    @Query('endDate') end: string,
  ) {
    if (!start || !end) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.dateRangeRequired') : 'Se requieren las fechas de inicio y fin');
    }
    return this.reportsService.getSalesSummary(start, end);
  }

  @Get('top-products')
  @Roles('admin')
  @ApiOperation({ summary: 'Listar productos más vendidos por cantidad (Solo Admin)' })
  @ApiQuery({ name: 'startDate', required: true, example: '2026-07-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2026-07-31' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
  getTopProducts(
    @Query('startDate') start: string,
    @Query('endDate') end: string,
    @Query('limit') limit?: string,
  ) {
    if (!start || !end) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.dateRangeRequired') : 'Se requieren las fechas de inicio y fin');
    }
    const limitNum = limit ? parseInt(limit, 10) : 5;
    return this.reportsService.getTopProducts(start, end, limitNum);
  }

  @Get('maintenance')
  @Roles('admin', 'seller')
  @ApiOperation({ summary: 'Obtener resumen de órdenes de servicio por estatus' })
  getMaintenanceSummary() {
    return this.reportsService.getMaintenanceSummary();
  }

  @Get('appointments')
  @Roles('admin', 'seller')
  @ApiOperation({ summary: 'Obtener resumen de citas agendadas por estatus' })
  @ApiQuery({ name: 'startDate', required: true, example: '2026-07-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2026-07-31' })
  getAppointmentsSummary(
    @Query('startDate') start: string,
    @Query('endDate') end: string,
  ) {
    if (!start || !end) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.dateRangeRequired') : 'Se requieren las fechas de inicio y fin');
    }
    return this.reportsService.getAppointmentsSummary(start, end);
  }
}
