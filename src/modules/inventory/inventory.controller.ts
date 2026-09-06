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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProviderDto } from './dto/create-provider.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { BranchGuard } from '../../common/guards/branch.guard';
import { BranchId } from '../../common/decorators/branch-id.decorator';

@ApiTags('Inventario')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // --- BRAND ENDPOINTS ---
  @Post('brands')
  @Roles('admin', 'warehouse')
  @ApiOperation({
    summary: 'Registrar una marca de autopartes (Admin / Warehouse)',
  })
  createBrand(
    @BranchId() branchId: string,
    @Body() createBrandDto: CreateBrandDto,
  ) {
    return this.inventoryService.createBrand(createBrandDto, branchId);
  }

  @Get('brands')
  @ApiOperation({
    summary:
      'Listar todas las marcas paginadas con filtro opcional de búsqueda',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Búsqueda por nombre',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Alias para término de búsqueda',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  findAllBrands(
    @BranchId() branchId: string,
    @Query('search') search?: string,
    @Query('q') q?: string,
    @Query() query?: PaginationQueryDto,
  ) {
    const searchTerm = search || q;
    return this.inventoryService.findAllBrands(
      branchId,
      searchTerm,
      query?.page,
      query?.limit,
    );
  }

  @Get('brands/search')
  @ApiOperation({ summary: 'Buscar marcas por nombre' })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Término de búsqueda por nombre',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  searchBrandsByName(
    @BranchId() branchId: string,
    @Query('q') q: string,
    @Query('search') search?: string,
    @Query() query?: PaginationQueryDto,
  ) {
    const searchTerm = q || search || '';
    return this.inventoryService.searchBrandsByName(
      branchId,
      searchTerm,
      query?.page,
      query?.limit,
    );
  }

  @Delete('brands/:id')
  @Roles('admin', 'warehouse')
  @ApiOperation({ summary: 'Eliminar una marca (Admin / Warehouse)' })
  deleteBrand(@BranchId() branchId: string, @Param('id') id: string) {
    return this.inventoryService.deleteBrand(id, branchId);
  }

  // --- CATEGORY ENDPOINTS ---
  @Post('categories')
  @Roles('admin', 'warehouse')
  @ApiOperation({ summary: 'Registrar una categoría (Admin / Warehouse)' })
  createCategory(
    @BranchId() branchId: string,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.inventoryService.createCategory(createCategoryDto, branchId);
  }

  @Get('categories')
  @ApiOperation({
    summary:
      'Listar todas las categorías paginadas con filtro opcional de búsqueda',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Búsqueda por nombre',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Alias para término de búsqueda',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  findAllCategories(
    @BranchId() branchId: string,
    @Query('search') search?: string,
    @Query('q') q?: string,
    @Query() query?: PaginationQueryDto,
  ) {
    const searchTerm = search || q;
    return this.inventoryService.findAllCategories(
      branchId,
      searchTerm,
      query?.page,
      query?.limit,
    );
  }

  @Get('categories/search')
  @ApiOperation({ summary: 'Buscar categorías por nombre' })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Término de búsqueda por nombre',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  searchCategoriesByName(
    @BranchId() branchId: string,
    @Query('q') q: string,
    @Query('search') search?: string,
    @Query() query?: PaginationQueryDto,
  ) {
    const searchTerm = q || search || '';
    return this.inventoryService.searchCategoriesByName(
      branchId,
      searchTerm,
      query?.page,
      query?.limit,
    );
  }

  @Delete('categories/:id')
  @Roles('admin', 'warehouse')
  @ApiOperation({ summary: 'Eliminar una categoría (Admin / Warehouse)' })
  deleteCategory(@BranchId() branchId: string, @Param('id') id: string) {
    return this.inventoryService.deleteCategory(id, branchId);
  }

  // --- PROVIDER ENDPOINTS ---
  @Post('providers')
  @Roles('admin', 'warehouse')
  @ApiOperation({ summary: 'Registrar un proveedor (Admin / Warehouse)' })
  createProvider(
    @BranchId() branchId: string,
    @Body() createProviderDto: CreateProviderDto,
  ) {
    return this.inventoryService.createProvider(createProviderDto, branchId);
  }

  @Get('providers')
  @ApiOperation({
    summary:
      'Listar todos los proveedores paginados con filtro opcional de búsqueda',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Búsqueda por nombre o código',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Alias para término de búsqueda',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  findAllProviders(
    @BranchId() branchId: string,
    @Query('search') search?: string,
    @Query('q') q?: string,
    @Query() query?: PaginationQueryDto,
  ) {
    const searchTerm = search || q;
    return this.inventoryService.findAllProviders(
      branchId,
      searchTerm,
      query?.page,
      query?.limit,
    );
  }

  @Get('providers/search')
  @ApiOperation({ summary: 'Buscar proveedores por nombre o código' })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Término de búsqueda por nombre o código',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  searchProviders(
    @BranchId() branchId: string,
    @Query('q') q: string,
    @Query('search') search?: string,
    @Query() query?: PaginationQueryDto,
  ) {
    const searchTerm = q || search || '';
    return this.inventoryService.searchProviders(
      branchId,
      searchTerm,
      query?.page,
      query?.limit,
    );
  }

  @Patch('providers/:id')
  @Roles('admin', 'warehouse')
  @ApiOperation({
    summary: 'Actualizar datos de un proveedor (Admin / Warehouse)',
  })
  updateProvider(
    @BranchId() branchId: string,
    @Param('id') id: string,
    @Body() createProviderDto: CreateProviderDto,
  ) {
    return this.inventoryService.updateProvider(
      id,
      branchId,
      createProviderDto,
    );
  }

  @Delete('providers/:id')
  @Roles('admin', 'warehouse')
  @ApiOperation({ summary: 'Eliminar un proveedor (Admin / Warehouse)' })
  deleteProvider(@BranchId() branchId: string, @Param('id') id: string) {
    return this.inventoryService.deleteProvider(id, branchId);
  }

  // --- PRODUCT ENDPOINTS ---
  @Post('products')
  @Roles('admin', 'warehouse')
  @ApiOperation({
    summary: 'Registrar una autoparte/producto (Admin / Warehouse)',
  })
  createProduct(
    @BranchId() branchId: string,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.inventoryService.createProduct(createProductDto, branchId);
  }

  @Get('products')
  @ApiOperation({
    summary: 'Listar autopartes con filtros opcionales y paginación',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Buscar por nombre, SKU o compatibilidad',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Alias para término de búsqueda',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filtrar por categoría ID',
  })
  @ApiQuery({
    name: 'brandId',
    required: false,
    description: 'Filtrar por marca ID',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  findAllProducts(
    @BranchId() branchId: string,
    @Query('search') search?: string,
    @Query('q') q?: string,
    @Query('categoryId') categoryId?: string,
    @Query('brandId') brandId?: string,
    @Query() query?: PaginationQueryDto,
  ) {
    const searchTerm = search || q;
    return this.inventoryService.findAllProducts(branchId, {
      search: searchTerm,
      categoryId,
      brandId,
      page: query?.page,
      limit: query?.limit,
    });
  }

  @Get('products/search')
  @ApiOperation({
    summary: 'Buscar productos por SKU, nombre o compatibilidad',
  })
  @ApiQuery({ name: 'q', required: true, description: 'Término de búsqueda' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  searchProducts(
    @BranchId() branchId: string,
    @Query('q') q: string,
    @Query('search') search?: string,
    @Query() query?: PaginationQueryDto,
  ) {
    const searchTerm = q || search || '';
    return this.inventoryService.searchProducts(
      branchId,
      searchTerm,
      query?.page,
      query?.limit,
    );
  }

  @Get('products/sku/:sku')
  @ApiOperation({ summary: 'Obtener detalle de un producto por SKU exacto' })
  findProductBySku(@BranchId() branchId: string, @Param('sku') sku: string) {
    return this.inventoryService.findProductBySku(sku, branchId);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Obtener detalle de un producto por ID' })
  findProductById(@BranchId() branchId: string, @Param('id') id: string) {
    return this.inventoryService.findProductById(id, branchId);
  }

  @Patch('products/:id')
  @Roles('admin', 'warehouse')
  @ApiOperation({ summary: 'Actualizar un producto (Admin / Warehouse)' })
  updateProduct(
    @BranchId() branchId: string,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser('_id') userId: string,
  ) {
    return this.inventoryService.updateProduct(
      id,
      branchId,
      updateProductDto,
      userId,
    );
  }

  @Delete('products/:id')
  @Roles('admin', 'warehouse')
  @ApiOperation({ summary: 'Dar de baja un producto (Admin / Warehouse)' })
  deleteProduct(@BranchId() branchId: string, @Param('id') id: string) {
    return this.inventoryService.deleteProduct(id, branchId);
  }

  // --- STOCK MOVEMENT ENDPOINTS ---
  @Post('movements')
  @Roles('admin', 'warehouse')
  @ApiOperation({
    summary: 'Registrar movimiento de stock manual (Admin / Warehouse)',
  })
  registerMovement(
    @BranchId() branchId: string,
    @Body() createStockMovementDto: CreateStockMovementDto,
    @CurrentUser('_id') userId: string,
  ) {
    return this.inventoryService.registerMovement(
      createStockMovementDto,
      userId,
      branchId,
    );
  }

  @Get('movements')
  @Roles('admin', 'warehouse')
  @ApiOperation({ summary: 'Ver todos los movimientos de stock del sistema' })
  findAllMovements(@BranchId() branchId: string) {
    return this.inventoryService.findAllMovements(branchId);
  }

  @Get('products/:id/movements')
  @Roles('admin', 'warehouse')
  @ApiOperation({
    summary: 'Ver movimientos de stock de un producto específico',
  })
  findMovementsByProduct(
    @BranchId() branchId: string,
    @Param('id') productId: string,
  ) {
    return this.inventoryService.findMovementsByProduct(productId, branchId);
  }

  @Delete('movements/:id')
  @Roles('admin', 'warehouse')
  @ApiOperation({
    summary: 'Eliminar o revertir un movimiento de stock (Admin / Warehouse)',
  })
  deleteMovement(@BranchId() branchId: string, @Param('id') id: string) {
    return this.inventoryService.deleteMovement(id, branchId);
  }
}
