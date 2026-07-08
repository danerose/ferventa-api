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

@ApiTags('Vehículos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles('admin', 'seller')
  @ApiOperation({ summary: 'Registrar un vehículo (Admin / Seller)' })
  @ApiResponse({ status: 201, description: 'Vehículo registrado correctamente.' })
  create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(createVehicleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar vehículos con filtros de búsqueda y cliente propietario' })
  @ApiQuery({ name: 'customerId', required: false, description: 'Filtrar por ID del cliente' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por marca, modelo o últimos 4 dígitos del número de serie' })
  findAll(
    @Query('customerId') customerId?: string,
    @Query('search') search?: string,
  ) {
    return this.vehiclesService.findAll({ customerId, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un vehículo por ID' })
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findById(id);
  }

  @Get('serial/:serial')
  @ApiOperation({ summary: 'Obtener detalle de un vehículo por los últimos 4 dígitos de su número de serie' })
  findBySerialNumberLastFour(@Param('serial') serial: string) {
    return this.vehiclesService.findBySerialNumberLastFour(serial);
  }

  @Patch(':id')
  @Roles('admin', 'seller')
  @ApiOperation({ summary: 'Actualizar datos de un vehículo (Admin / Seller)' })
  update(@Param('id') id: string, @Body() updateVehicleDto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Eliminar un vehículo (Solo Admin)' })
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }
}
