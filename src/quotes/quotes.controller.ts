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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

import { BranchGuard } from '../common/guards/branch.guard';
import { BranchId } from '../common/decorators/branch-id.decorator';

@ApiTags('Cotizaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @Roles('admin', 'seller')
  @ApiOperation({ summary: 'Crear una nueva cotización' })
  @ApiResponse({ status: 201, description: 'Cotización creada correctamente.' })
  create(
    @BranchId() branchId: string,
    @Body() createQuoteDto: CreateQuoteDto,
    @CurrentUser('_id') userId: string,
  ) {
    return this.quotesService.create(createQuoteDto, userId, branchId);
  }

  @Get()
  @Roles('admin', 'seller')
  @ApiOperation({ summary: 'Listar cotizaciones con filtros' })
  @ApiQuery({ name: 'customerId', required: false, description: 'Filtrar por cliente ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por estado' })
  findAll(
    @BranchId() branchId: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
  ) {
    return this.quotesService.findAll(branchId, { customerId, status });
  }

  @Get(':id')
  @Roles('admin', 'seller')
  @ApiOperation({ summary: 'Obtener detalle de una cotización por ID' })
  findOne(@BranchId() branchId: string, @Param('id') id: string) {
    return this.quotesService.findById(id, branchId);
  }

  @Patch(':id')
  @Roles('admin', 'seller')
  @ApiOperation({ summary: 'Actualizar una cotización (Siempre que no esté ya vendida)' })
  update(@BranchId() branchId: string, @Param('id') id: string, @Body() updateQuoteDto: UpdateQuoteDto) {
    return this.quotesService.update(id, branchId, updateQuoteDto);
  }
}
