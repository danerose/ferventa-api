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
import {
  CreateStockReceptionDto,
  OpenBoxDto,
} from './dto/create-stock-reception.dto';
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
  @Roles('admin', 'warehouse', 'seller')
  @ApiOperation({
    summary: 'Registrar una marca de autopartes (Admin / Warehouse / Seller)',
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
  @Roles('admin')
  @ApiOperation({ summary: 'Eliminar una marca (Solo Admin)' })
  deleteBrand(@BranchId() branchId: string, @Param('id') id: string) {
    return this.inventoryService.deleteBrand(id, branchId);
  }

  // --- CATEGORY ENDPOINTS ---
  @Post('categories')
  @Roles('admin', 'warehouse', 'seller')
  @ApiOperation({
    summary: 'Registrar una categoría (Admin / Warehouse / Seller)',
  })
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
  @Roles('admin')
  @ApiOperation({ summary: 'Eliminar una categoría (Solo Admin)' })
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
  @Roles('admin')
  @ApiOperation({
    summary: 'Registrar una autoparte/producto (Solo Admin)',
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
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar un producto (Solo Admin)' })
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
  @Roles('admin')
  @ApiOperation({ summary: 'Dar de baja un producto (Solo Admin)' })
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
  @Roles('admin')
  @ApiOperation({
    summary: 'Eliminar o revertir un movimiento de stock (Solo Admin)',
  })
  deleteMovement(@BranchId() branchId: string, @Param('id') id: string) {
    return this.inventoryService.deleteMovement(id, branchId);
  }

  // --- RECEPTION & BOX MANAGEMENT (Draft & QR Boxes) ---

  @Post('receptions')
  @Roles('admin', 'warehouse', 'seller')
  @ApiOperation({
    summary:
      'Registrar recepción física de mercancía en borrador/draft (Admin / Warehouse / Seller)',
  })
  createReception(
    @BranchId() branchId: string,
    @Body() dto: CreateStockReceptionDto,
    @CurrentUser('_id') userId: string,
  ) {
    return this.inventoryService.createReception(dto, userId, branchId);
  }

  @Get('receptions')
  @Roles('admin', 'warehouse', 'seller')
  @ApiOperation({
    summary:
      'Listar recepciones de mercancía con paginación y filtros opcionales de estado (draft, approved, rejected)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['draft', 'approved', 'rejected'],
    description: 'Filtrar por estado de la recepción',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  findAllReceptions(
    @BranchId() branchId: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.inventoryService.findAllReceptions(branchId, {
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });
  }

  @Get('receptions/:id')
  @Roles('admin', 'warehouse', 'seller')
  @ApiOperation({
    summary: 'Obtener detalle de una recepción por ID con sus cajas y códigos',
  })
  findReceptionById(
    @BranchId() branchId: string,
    @Param('id') id: string,
  ) {
    return this.inventoryService.findReceptionById(id, branchId);
  }

  @Patch('receptions/:id/approve')
  @Roles('admin')
  @ApiOperation({
    summary:
      'Aprobar recepción de mercancía y dejar cajas listas para ticket QR (Solo Admin)',
  })
  approveReception(
    @BranchId() branchId: string,
    @Param('id') id: string,
    @CurrentUser('_id') userId: string,
  ) {
    return this.inventoryService.approveReception(id, userId, branchId);
  }

  @Patch('receptions/:id/reject')
  @Roles('admin')
  @ApiOperation({
    summary: 'Rechazar una recepción de mercancía en borrador (Solo Admin)',
  })
  rejectReception(
    @BranchId() branchId: string,
    @Param('id') id: string,
    @CurrentUser('_id') userId: string,
    @Body('reason') reason?: string,
  ) {
    return this.inventoryService.rejectReception(id, userId, branchId, reason);
  }

  @Post('boxes/open')
  @Roles('admin', 'warehouse', 'seller')
  @ApiOperation({
    summary:
      'Abrir caja/lote escaneando código QR: suma piezas al stock y unifica precio de venta en mostrador',
  })
  openBox(
    @BranchId() branchId: string,
    @Body() dto: OpenBoxDto,
    @CurrentUser('_id') userId: string,
  ) {
    return this.inventoryService.openBox(dto.boxCode, userId, branchId);
  }
}
