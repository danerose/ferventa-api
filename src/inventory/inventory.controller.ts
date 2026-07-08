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
import { InventoryService } from './inventory.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProviderDto } from './dto/create-provider.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('Inventario')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // --- BRAND ENDPOINTS ---
  @Post('brands')
  @Roles('admin', 'warehouse')
  @ApiOperation({ summary: 'Registrar una marca de autopartes (Admin / Warehouse)' })
  createBrand(@Body() createBrandDto: CreateBrandDto) {
    return this.inventoryService.createBrand(createBrandDto);
  }

  @Get('brands')
  @ApiOperation({ summary: 'Listar todas las marcas' })
  findAllBrands() {
    return this.inventoryService.findAllBrands();
  }

  @Delete('brands/:id')
  @Roles('admin', 'warehouse')
  @ApiOperation({ summary: 'Eliminar una marca (Admin / Warehouse)' })
  deleteBrand(@Param('id') id: string) {
    return this.inventoryService.deleteBrand(id);
  }

  // --- CATEGORY ENDPOINTS ---
  @Post('categories')
  @Roles('admin', 'warehouse')
  @ApiOperation({ summary: 'Registrar una categoría (Admin / Warehouse)' })
  createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.inventoryService.createCategory(createCategoryDto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Listar todas las categorías' })
  findAllCategories() {
    return this.inventoryService.findAllCategories();
  }

  @Delete('categories/:id')
  @Roles('admin', 'warehouse')
  @ApiOperation({ summary: 'Eliminar una categoría (Admin / Warehouse)' })
  deleteCategory(@Param('id') id: string) {
    return this.inventoryService.deleteCategory(id);
  }

  // --- PROVIDER ENDPOINTS ---
  @Post('providers')
  @Roles('admin', 'warehouse')
  @ApiOperation({ summary: 'Registrar un proveedor (Admin / Warehouse)' })
  createProvider(@Body() createProviderDto: CreateProviderDto) {
    return this.inventoryService.createProvider(createProviderDto);
  }

  @Get('providers')
  @ApiOperation({ summary: 'Listar todos los proveedores' })
  findAllProviders() {
    return this.inventoryService.findAllProviders();
  }

  @Patch('providers/:id')
  @Roles('admin', 'warehouse')
  @ApiOperation({ summary: 'Actualizar datos de un proveedor (Admin / Warehouse)' })
  updateProvider(@Param('id') id: string, @Body() createProviderDto: CreateProviderDto) {
    return this.inventoryService.updateProvider(id, createProviderDto);
  }

  @Delete('providers/:id')
  @Roles('admin', 'warehouse')
  @ApiOperation({ summary: 'Eliminar un proveedor (Admin / Warehouse)' })
  deleteProvider(@Param('id') id: string) {
    return this.inventoryService.deleteProvider(id);
  }

  // --- PRODUCT ENDPOINTS ---
  @Post('products')
  @Roles('admin', 'warehouse')
  @ApiOperation({ summary: 'Registrar una autoparte/producto (Admin / Warehouse)' })
  createProduct(@Body() createProductDto: CreateProductDto) {
    return this.inventoryService.createProduct(createProductDto);
  }

  @Get('products')
  @ApiOperation({ summary: 'Listar autopartes con filtros opcionales' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre, SKU o compatibilidad' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filtrar por categoría ID' })
  @ApiQuery({ name: 'brandId', required: false, description: 'Filtrar por marca ID' })
  findAllProducts(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('brandId') brandId?: string,
  ) {
    return this.inventoryService.findAllProducts({ search, categoryId, brandId });
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Obtener detalle de un producto por ID' })
  findProductById(@Param('id') id: string) {
    return this.inventoryService.findProductById(id);
  }

  @Get('products/sku/:sku')
  @ApiOperation({ summary: 'Obtener detalle de un producto por SKU' })
  findProductBySku(@Param('sku') sku: string) {
    return this.inventoryService.findProductBySku(sku);
  }

  @Patch('products/:id')
  @Roles('admin', 'warehouse')
  @ApiOperation({ summary: 'Actualizar un producto (Admin / Warehouse)' })
  updateProduct(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.inventoryService.updateProduct(id, updateProductDto);
  }

  @Delete('products/:id')
  @Roles('admin', 'warehouse')
  @ApiOperation({ summary: 'Dar de baja un producto (Admin / Warehouse)' })
  deleteProduct(@Param('id') id: string) {
    return this.inventoryService.deleteProduct(id);
  }

  // --- STOCK MOVEMENT ENDPOINTS ---
  @Post('movements')
  @Roles('admin', 'warehouse')
  @ApiOperation({ summary: 'Registrar movimiento de stock manual (Admin / Warehouse)' })
  registerMovement(
    @Body() createStockMovementDto: CreateStockMovementDto,
    @CurrentUser('_id') userId: string,
  ) {
    return this.inventoryService.registerMovement(createStockMovementDto, userId);
  }

  @Get('movements')
  @Roles('admin', 'warehouse')
  @ApiOperation({ summary: 'Ver todos los movimientos de stock del sistema' })
  findAllMovements() {
    return this.inventoryService.findAllMovements();
  }

  @Get('products/:id/movements')
  @Roles('admin', 'warehouse')
  @ApiOperation({ summary: 'Ver movimientos de stock de un producto específico' })
  findMovementsByProduct(@Param('id') productId: string) {
    return this.inventoryService.findMovementsByProduct(productId);
  }
}
