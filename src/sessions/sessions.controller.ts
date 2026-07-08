import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Sesiones y Auditoría')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Ver mis sesiones activas' })
  findMySessions(@CurrentUser('_id') userId: string) {
    return this.sessionsService.findActiveByUser(userId);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Ver todas las sesiones activas en el sistema (Solo Admin)' })
  findAllSessions() {
    return this.sessionsService.findActiveAll();
  }

  @Post(':id/revoke')
  @ApiOperation({ summary: 'Revocar/cerrar una sesión específica' })
  @ApiResponse({ status: 200, description: 'Sesión revocada correctamente.' })
  async revokeSession(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const isAdmin = user.role?.name === 'admin';
    await this.sessionsService.revoke(id, user._id, isAdmin);
    return { message: 'Sesión revocada exitosamente' };
  }
}
