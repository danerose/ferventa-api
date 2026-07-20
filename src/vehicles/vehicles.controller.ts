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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { BranchGuard } from '../common/guards/branch.guard';
import { BranchId } from '../common/decorators/branch-id.decorator';

@ApiTags('Vehículos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles('admin', 'seller')
  @ApiOperation({ summary: 'Registrar un vehículo (Admin / Seller)' })
  @ApiResponse({ status: 201, description: 'Vehículo registrado correctamente.' })
  create(@BranchId() branchId: string, @Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(createVehicleDto, branchId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar vehículos con filtros de búsqueda y cliente propietario' })
  @ApiQuery({ name: 'customerId', required: false, description: 'Filtrar por ID del cliente' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por marca, modelo o últimos 4 dígitos del número de serie' })
  findAll(
    @BranchId() branchId: string,
    @Query('customerId') customerId?: string,
    @Query('search') search?: string,
  ) {
    return this.vehiclesService.findAll(branchId, { customerId, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un vehículo por ID' })
  findOne(@BranchId() branchId: string, @Param('id') id: string) {
    return this.vehiclesService.findById(id, branchId);
  }

  @Get('serial/:serial')
  @ApiOperation({ summary: 'Obtener detalle de un vehículo por los últimos 4 dígitos de su número de serie' })
  findBySerialNumberLastFour(@BranchId() branchId: string, @Param('serial') serial: string) {
    return this.vehiclesService.findBySerialNumberLastFour(serial, branchId);
  }

  @Patch(':id')
  @Roles('admin', 'seller')
  @ApiOperation({ summary: 'Actualizar datos de un vehículo (Admin / Seller)' })
  update(@BranchId() branchId: string, @Param('id') id: string, @Body() updateVehicleDto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, branchId, updateVehicleDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Eliminar un vehículo (Solo Admin)' })
  remove(@BranchId() branchId: string, @Param('id') id: string) {
    return this.vehiclesService.remove(id, branchId);
  }
}
