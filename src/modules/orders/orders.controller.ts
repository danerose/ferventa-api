import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AddOrderPaymentDto } from './dto/add-order-payment.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BranchGuard } from '../../common/guards/branch.guard';
import { BranchId } from '../../common/decorators/branch-id.decorator';

@ApiTags('Pedidos Especiales (Orders)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles('admin', 'seller')
  @ApiOperation({
    summary: 'Levantar un nuevo pedido especial con anticipo mínimo del 50%',
  })
  @ApiResponse({
    status: 201,
    description: 'Pedido creado exitosamente con anticipo registrado.',
  })
  create(
    @BranchId() branchId: string,
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser('_id') userId: string,
  ) {
    return this.ordersService.create(createOrderDto, userId, branchId);
  }

  @Get('summary')
  @Roles('admin', 'seller', 'warehouse')
  @ApiOperation({
    summary:
      'Obtener métricas y resumen de pedidos por estatus y saldos pendientes',
  })
  getSummary(@BranchId() branchId: string) {
    return this.ordersService.getSummary(branchId);
  }

  @Get()
  @Roles('admin', 'seller', 'warehouse')
  @ApiOperation({ summary: 'Listar todos los pedidos con filtros' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Buscar por folio, cliente, teléfono o descripción de pieza',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtrar por estado',
  })
  @ApiQuery({
    name: 'isFullyPaid',
    required: false,
    type: Boolean,
    description: 'Filtrar si está liquidado (true/false)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Fecha inicio (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Fecha fin (YYYY-MM-DD)',
  })
  findAll(
    @BranchId() branchId: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('isFullyPaid') isFullyPaid?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const isPaidBool =
      isFullyPaid !== undefined ? isFullyPaid === 'true' : undefined;
    return this.ordersService.findAll(branchId, {
      search,
      status,
      isFullyPaid: isPaidBool,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @Roles('admin', 'seller', 'warehouse')
  @ApiOperation({ summary: 'Obtener detalle de un pedido por ID' })
  findOne(@BranchId() branchId: string, @Param('id') id: string) {
    return this.ordersService.findById(id, branchId);
  }

  @Patch(':id/status')
  @Roles('admin', 'seller', 'warehouse')
  @ApiOperation({
    summary:
      'Actualizar el estado del pedido (Pedido Levantado -> Pedido -> En tránsito -> En Sucursal -> Pendiente de entrega -> Entregado)',
  })
  updateStatus(
    @BranchId() branchId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser('_id') userId: string,
  ) {
    return this.ordersService.updateStatus(id, branchId, dto, userId);
  }

  @Post(':id/payments')
  @Roles('admin', 'seller')
  @ApiOperation({
    summary: 'Registrar un abono o liquidación al saldo del pedido',
  })
  addPayment(
    @BranchId() branchId: string,
    @Param('id') id: string,
    @Body() dto: AddOrderPaymentDto,
    @CurrentUser('_id') userId: string,
  ) {
    return this.ordersService.addPayment(id, branchId, dto, userId);
  }

  @Patch(':id/cancel')
  @Roles('admin', 'seller')
  @ApiOperation({ summary: 'Cancelar un pedido especificando el motivo' })
  cancel(
    @BranchId() branchId: string,
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser('_id') userId: string,
  ) {
    return this.ordersService.cancel(id, branchId, dto, userId);
  }

  @Patch(':id')
  @Roles('admin', 'seller')
  @ApiOperation({ summary: 'Actualizar datos generales o precios del pedido' })
  update(
    @BranchId() branchId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.ordersService.update(id, branchId, dto);
  }
}
