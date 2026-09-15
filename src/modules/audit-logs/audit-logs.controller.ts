import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BranchGuard } from '../../common/guards/branch.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { BranchId } from '../../common/decorators/branch-id.decorator';

@ApiTags('Auditoría & Bitácora de Acciones (Audit Logs)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({
    summary:
      'Consultar historial y bitácora de acciones por usuario (Solo Administrador)',
  })
  @ApiQuery({
    name: 'module',
    required: false,
    description: 'Filtrar por módulo (appointments, sales, maintenance, inventory, etc.)',
  })
  @ApiQuery({
    name: 'action',
    required: false,
    description: 'Filtrar por acción (cancelled, rejected, approved, etc.)',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Filtrar por usuario que ejecutó la acción',
  })
  @ApiQuery({
    name: 'entityId',
    required: false,
    description: 'Filtrar por ID de la entidad (cita, venta, orden, etc.)',
  })
  @ApiQuery({
    name: 'entityType',
    required: false,
    description: 'Filtrar por tipo de entidad (Appointment, Sale, Maintenance, etc.)',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'Fecha inicial (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: 'Fecha final (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Búsqueda por texto o folio',
  })
  findAll(
    @BranchId() branchId: string,
    @Query('module') module?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('entityId') entityId?: string,
    @Query('entityType') entityType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('search') search?: string,
  ) {
    return this.auditLogsService.findAll(branchId, {
      module,
      action,
      userId,
      entityId,
      entityType,
      from,
      to,
      search,
    });
  }

  @Get('entity/:entityId')
  @Roles('admin')
  @ApiOperation({
    summary:
      'Obtener todo el historial de auditoría de un elemento específico (cita, venta, orden, etc.) por su ID',
  })
  findByEntity(
    @BranchId() branchId: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditLogsService.findAll(branchId, { entityId });
  }
}
