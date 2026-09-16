import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { BranchGuard } from '../../common/guards/branch.guard';
import { BranchId } from '../../common/decorators/branch-id.decorator';

@ApiTags('Vehículos')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
  @Roles('admin', 'seller')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar un vehículo (Admin / Seller)' })
  @ApiResponse({
    status: 201,
    description: 'Vehículo registrado correctamente.',
  })
  create(
    @BranchId() branchId: string,
    @Body() createVehicleDto: CreateVehicleDto,
  ) {
    return this.vehiclesService.create(createVehicleDto, branchId);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar vehículos con filtros de búsqueda y cliente propietario (Público / Staff)',
  })
  @ApiQuery({
    name: 'customerId',
    required: false,
    description: 'Filtrar por ID del cliente',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description:
      'Buscar por marca, modelo o últimos 4 dígitos del número de serie',
  })
  @ApiQuery({
    name: 'branchId',
    required: false,
    description: 'ID de la sucursal (opcional)',
  })
  findAll(
    @Headers('x-branch-id') headerBranchId?: string,
    @Query('branchId') queryBranchId?: string,
    @Query('customerId') customerId?: string,
    @Query('search') search?: string,
  ) {
    const branchId = headerBranchId || queryBranchId || '';
    return this.vehiclesService.findAll(branchId, { customerId, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un vehículo por ID (Público / Staff)' })
  @ApiQuery({
    name: 'branchId',
    required: false,
    description: 'ID de la sucursal (opcional)',
  })
  findOne(
    @Headers('x-branch-id') headerBranchId: string,
    @Param('id') id: string,
    @Query('branchId') queryBranchId?: string,
  ) {
    const branchId = headerBranchId || queryBranchId || '';
    return this.vehiclesService.findById(id, branchId);
  }

  @Get('serial/:serial')
  @ApiOperation({
    summary:
      'Obtener detalle de un vehículo por los últimos 4 dígitos de su número de serie (Público / Staff)',
  })
  @ApiQuery({
    name: 'branchId',
    required: false,
    description: 'ID de la sucursal (opcional)',
  })
  findBySerialNumberLastFour(
    @Headers('x-branch-id') headerBranchId: string,
    @Param('serial') serial: string,
    @Query('branchId') queryBranchId?: string,
  ) {
    const branchId = headerBranchId || queryBranchId || '';
    return this.vehiclesService.findBySerialNumberLastFour(serial, branchId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
  @Roles('admin', 'seller')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar datos de un vehículo (Admin / Seller)' })
  update(
    @BranchId() branchId: string,
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(id, branchId, updateVehicleDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un vehículo (Solo Admin)' })
  remove(@BranchId() branchId: string, @Param('id') id: string) {
    return this.vehiclesService.remove(id, branchId);
  }
}
