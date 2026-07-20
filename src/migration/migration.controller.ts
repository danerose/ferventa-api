import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { MigrationService } from './migration.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Sistema y Utilidades')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('system/migration')
export class MigrationController {
  constructor(private readonly migrationService: MigrationService) { }

  @Post('branches')
  @Roles('admin')
  @ApiOperation({ summary: 'Migra todos los registros antiguos para asignarles la sucursal por defecto. Asigna esta sucursal a los usuarios administradores. Es idempotente.' })
  @ApiResponse({ status: 200, description: 'Migración ejecutada exitosamente.' })
  async migrateBranches() {
    return this.migrationService.migrateToBranches();
  }
}
