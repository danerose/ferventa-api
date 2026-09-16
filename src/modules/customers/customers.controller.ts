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
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { BranchGuard } from '../../common/guards/branch.guard';
import { BranchId } from '../../common/decorators/branch-id.decorator';

@ApiTags('Clientes')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
  @Roles('admin', 'seller')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar un nuevo cliente (Admin / Seller)' })
  @ApiResponse({ status: 201, description: 'Cliente creado correctamente.' })
  create(
    @BranchId() branchId: string,
    @Body() createCustomerDto: CreateCustomerDto,
  ) {
    return this.customersService.create(createCustomerDto, branchId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
  @Roles('admin', 'seller', 'mechanic')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar todos los clientes o buscar por nombre/teléfono (Staff)',
  })
  findAll(@BranchId() branchId: string, @Query('search') search?: string) {
    return this.customersService.findAll(branchId, search);
  }

  @Get('phone/:phone')
  @ApiOperation({ summary: 'Obtener detalle de un cliente por teléfono (Público / Staff)' })
  findByPhone(
    @Headers('x-branch-id') headerBranchId: string,
    @Param('phone') phone: string,
    @Query('branchId') queryBranchId?: string,
  ) {
    const branchId = headerBranchId || queryBranchId || '';
    return this.customersService.findByPhone(phone, branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un cliente por ID (Público / Staff)' })
  findOne(
    @Headers('x-branch-id') headerBranchId: string,
    @Param('id') id: string,
    @Query('branchId') queryBranchId?: string,
  ) {
    const branchId = headerBranchId || queryBranchId || '';
    return this.customersService.findById(id, branchId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
  @Roles('admin', 'seller')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un cliente (Admin / Seller)' })
  update(
    @BranchId() branchId: string,
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, branchId, updateCustomerDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un cliente (Solo Admin)' })
  remove(@BranchId() branchId: string, @Param('id') id: string) {
    return this.customersService.remove(id, branchId);
  }
}
