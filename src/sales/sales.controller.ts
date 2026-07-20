import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CancelSaleDto } from './dto/cancel-sale.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { I18nContext } from 'nestjs-i18n';
import { BranchGuard } from '../common/guards/branch.guard';
import { BranchId } from '../common/decorators/branch-id.decorator';

@ApiTags('Ventas (POS)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles('admin', 'seller')
  @ApiOperation({ summary: 'Registrar una venta (Pago en efectivo o con tarjeta Mercado Pago Point)' })
  @ApiResponse({ status: 201, description: 'Venta registrada exitosamente.' })
  create(
    @BranchId() branchId: string,
    @Body() createSaleDto: CreateSaleDto,
    @CurrentUser('_id') userId: string,
  ) {
    return this.salesService.create(createSaleDto, userId, branchId);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @ApiOperation({ summary: 'Cancelar/anular una venta y regresar stock al almacén (Solo Admin)' })
  @ApiResponse({ status: 200, description: 'Venta cancelada y stock devuelto exitosamente.' })
  cancel(
    @BranchId() branchId: string,
    @Param('id') id: string,
    @Body() cancelSaleDto: CancelSaleDto,
    @CurrentUser('_id') userId: string,
  ) {
    return this.salesService.cancel(id, branchId, cancelSaleDto, userId);
  }

  @Get()
  @Roles('admin', 'seller')
  @ApiOperation({ summary: 'Listar todas las ventas' })
  @ApiQuery({ name: 'customerId', required: false, description: 'Filtrar por ID del cliente' })
  @ApiQuery({ name: 'isCancelled', required: false, type: Boolean, description: 'Filtrar por estado de cancelación' })
  findAll(
    @BranchId() branchId: string,
    @Query('customerId') customerId?: string,
    @Query('isCancelled') isCancelled?: string,
  ) {
    const isCancelledBool = isCancelled === undefined ? undefined : isCancelled === 'true';
    return this.salesService.findAll(branchId, { customerId, isCancelled: isCancelledBool });
  }

  @Get(':id')
  @Roles('admin', 'seller')
  @ApiOperation({ summary: 'Ver detalle completo de una venta por ID' })
  findOne(@BranchId() branchId: string, @Param('id') id: string) {
    return this.salesService.findById(id, branchId);
  }

  @Get('ticket/:query')
  @Roles('admin', 'seller')
  @ApiOperation({ summary: 'Obtener la información del ticket de venta por ID o Folio' })
  async getTicket(@BranchId() branchId: string, @Param('query') query: string) {
    if (!query) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.folioOrIdRequired') : 'Se requiere el folio o ID de la venta');
    }
    // Try search by Folio or ID
    try {
      return await this.salesService.findByFolio(query, branchId);
    } catch (e) {
      return this.salesService.findById(query, branchId);
    }
  }
}
