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
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Headers,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { AddItemUsedDto } from './dto/add-item-used.dto';
import { UploadEvidenceDto } from './dto/upload-evidence.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { I18nContext } from 'nestjs-i18n';
import { BranchGuard } from '../common/guards/branch.guard';
import { BranchId } from '../common/decorators/branch-id.decorator';

// Ensure evidence upload directory exists
const uploadDir = './uploads/evidence';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@ApiTags('Ordenes de Servicio / Mantenimiento')
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  // --- PUBLIC TRACKING ENDPOINT (No Auth) ---
  @Get('track/public')
  @ApiOperation({ summary: 'Consultar el avance y fotos de mantenimiento por últimos 4 dígitos del número de serie o celular del cliente (Público)' })
  trackPublicly(@Headers('x-branch-id') branchId: string, @Query('q') q: string) {
    if (!branchId) throw new BadRequestException('Falta x-branch-id');
    if (!q) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.searchQueryRequired') : 'El parámetro de búsqueda "q" es requerido');
    }
    return this.maintenanceService.findClientView(q, branchId);
  }

  // --- STAFF ENDPOINTS (Required Auth) ---
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
  @Roles('admin', 'seller')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una orden de servicio/mantenimiento (Admin / Seller)' })
  create(
    @BranchId() branchId: string,
    @Body() createMaintenanceDto: CreateMaintenanceDto,
    @CurrentUser('_id') userId: string,
  ) {
    return this.maintenanceService.create(createMaintenanceDto, userId, branchId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
  @Roles('admin', 'seller', 'warehouse', 'mechanic')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar órdenes de mantenimiento con filtros' })
  findAll(
    @BranchId() branchId: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
  ) {
    return this.maintenanceService.findAll(branchId, { customerId, status });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
  @Roles('admin', 'seller', 'warehouse', 'mechanic')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener detalle de una orden de mantenimiento por ID' })
  findOne(@BranchId() branchId: string, @Param('id') id: string) {
    return this.maintenanceService.findById(id, branchId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
  @Roles('admin', 'seller', 'mechanic')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar estado o mano de obra de una orden' })
  update(@BranchId() branchId: string, @Param('id') id: string, @Body() updateMaintenanceDto: UpdateMaintenanceDto) {
    return this.maintenanceService.update(id, branchId, updateMaintenanceDto);
  }

  @Post(':id/items')
  @UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
  @Roles('admin', 'seller', 'warehouse', 'mechanic')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar refacción/insumo usado (Descuenta stock automáticamente)' })
  addItemUsed(
    @BranchId() branchId: string,
    @Param('id') id: string,
    @Body() addItemUsedDto: AddItemUsedDto,
    @CurrentUser('_id') userId: string,
  ) {
    return this.maintenanceService.addItemUsed(id, branchId, addItemUsedDto, userId);
  }

  @Post(':id/evidence')
  @UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
  @Roles('admin', 'seller', 'mechanic')
  @ApiBearerAuth()
  @UseInterceptors(
    FilesInterceptor('photos', 5, {
      storage: diskStorage({
        destination: './uploads/evidence',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          const i18n = I18nContext.current();
          return cb(new BadRequestException(i18n ? i18n.t('common.errors.onlyImagesAllowed') : 'Solo se permiten archivos JPG, JPEG o PNG'), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir evidencia fotográfica por etapa de mantenimiento (Máx. 5 fotos)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        stage: { type: 'string', example: 'reception' },
        photos: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  uploadEvidence(
    @BranchId() branchId: string,
    @Param('id') id: string,
    @Body() uploadEvidenceDto: UploadEvidenceDto,
    @UploadedFiles() files: any[],
  ) {
    if (!files || files.length === 0) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.photoEvidenceRequired') : 'Se requiere al menos una foto de evidencia');
    }
    const photoUrls = files.map((file) => `/uploads/evidence/${file.filename}`);
    return this.maintenanceService.addEvidencePhotos(id, branchId, uploadEvidenceDto.stage, photoUrls);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una orden (Solo Admin - si no ha iniciado)' })
  remove(@BranchId() branchId: string, @Param('id') id: string) {
    return this.maintenanceService.remove(id, branchId);
  }
}
