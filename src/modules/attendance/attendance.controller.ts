import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiQuery,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BranchGuard } from '../../common/guards/branch.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BranchId } from '../../common/decorators/branch-id.decorator';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { StartBreakDto } from './dto/start-break.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { AttendanceSummaryQueryDto } from './dto/attendance-summary-query.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { I18nContext } from 'nestjs-i18n';

@ApiTags('Asistencia & Control de Horarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  @UseGuards(BranchGuard)
  @ApiHeader({
    name: 'x-branch-id',
    required: true,
    description: 'ID de la sucursal activa',
  })
  @ApiOperation({
    summary: 'Registrar entrada (Clock In) para el turno del usuario',
  })
  @ApiResponse({ status: 201, description: 'Entrada registrada exitosamente.' })
  async clockIn(
    @CurrentUser('_id') userId: string,
    @BranchId() branchId: string,
    @Body() dto: ClockInDto,
  ) {
    const targetUserId = dto?.userId || userId;
    const data = await this.attendanceService.clockIn(
      targetUserId,
      branchId,
      dto,
    );
    const i18n = I18nContext.current();
    return {
      message: i18n
        ? i18n.t('common.success.attendance.clockIn')
        : 'Entrada registrada exitosamente',
      data,
    };
  }

  @Post('clock-out')
  @ApiOperation({
    summary: 'Registrar salida (Clock Out) del turno del usuario',
  })
  @ApiResponse({ status: 200, description: 'Salida registrada exitosamente.' })
  async clockOut(@CurrentUser('_id') userId: string, @Body() dto: ClockOutDto) {
    const targetUserId = dto?.userId || userId;
    const data = await this.attendanceService.clockOut(targetUserId, dto);
    const i18n = I18nContext.current();
    return {
      message: i18n
        ? i18n.t('common.success.attendance.clockOut')
        : 'Salida registrada exitosamente',
      data,
    };
  }

  @Post('break/start')
  @ApiOperation({
    summary: 'Iniciar descanso / hora de comida durante el turno',
  })
  @ApiResponse({ status: 200, description: 'Inicio de descanso registrado.' })
  async startBreak(
    @CurrentUser('_id') userId: string,
    @Body() dto: StartBreakDto,
  ) {
    const targetUserId = dto?.userId || userId;
    const data = await this.attendanceService.startBreak(targetUserId, dto);
    const i18n = I18nContext.current();
    return {
      message: i18n
        ? i18n.t('common.success.attendance.startBreak')
        : 'Inicio de descanso registrado exitosamente',
      data,
    };
  }

  @Post('break/end')
  @ApiOperation({ summary: 'Finalizar descanso / hora de comida actual' })
  @ApiResponse({ status: 200, description: 'Fin de descanso registrado.' })
  async endBreak(
    @CurrentUser('_id') userId: string,
    @Body('userId') bodyUserId?: string,
  ) {
    const targetUserId = bodyUserId || userId;
    const data = await this.attendanceService.endBreak(targetUserId);
    const i18n = I18nContext.current();
    return {
      message: i18n
        ? i18n.t('common.success.attendance.endBreak')
        : 'Fin de descanso registrado exitosamente',
      data,
    };
  }

  @Get('today')
  @ApiOperation({
    summary:
      'Obtener el estado de asistencia actual del usuario o sucursal para hoy',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Filtrar por usuario específico',
  })
  @ApiQuery({
    name: 'branchId',
    required: false,
    description:
      'Filtrar por sucursal para obtener el estado de todos sus empleados',
  })
  async getTodayStatus(
    @CurrentUser('_id') userId: string,
    @Query('userId') queryUserId?: string,
    @Query('branchId') queryBranchId?: string,
  ) {
    if (queryBranchId) {
      const data =
        await this.attendanceService.getBranchTodayStatus(queryBranchId);
      return { data };
    }
    const targetUserId = queryUserId || userId;
    const data = await this.attendanceService.getTodayStatus(targetUserId);
    return { data };
  }

  @Get('branch/today')
  @UseGuards(BranchGuard)
  @ApiOperation({
    summary:
      'Obtener el estado de asistencia de todos los usuarios asignados a una sucursal para hoy',
  })
  @ApiHeader({
    name: 'x-branch-id',
    required: true,
    description: 'ID de la sucursal activa',
  })
  @ApiQuery({
    name: 'branchId',
    required: false,
    description:
      'ID de la sucursal (opcional si se envía el header x-branch-id)',
  })
  async getBranchTodayStatus(
    @BranchId() headerBranchId: string,
    @Query('branchId') queryBranchId?: string,
  ) {
    const targetBranchId = queryBranchId || headerBranchId;
    const data =
      await this.attendanceService.getBranchTodayStatus(targetBranchId);
    return { data };
  }

  @Get('my-records')
  @ApiOperation({ summary: 'Obtener mi historial de registros de asistencia' })
  @ApiQuery({ name: 'startDate', required: false, example: '2026-07-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2026-07-31' })
  async getMyRecords(
    @CurrentUser('_id') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.attendanceService.getMyRecords(
      userId,
      startDate,
      endDate,
    );
    return { data };
  }

  @Get('admin/records')
  @Roles('admin')
  @ApiOperation({
    summary:
      'Listar todos los registros de asistencia con filtros (Solo Admin)',
  })
  async getAdminRecords(@Query() queryDto: AttendanceQueryDto) {
    const data = await this.attendanceService.getAdminRecords(queryDto);
    return { data };
  }

  @Get('admin/summary')
  @Roles('admin')
  @ApiOperation({
    summary:
      'Obtener resumen de horas trabajadas (semanal, quincenal, mensual) (Solo Admin)',
  })
  async getAdminSummary(@Query() queryDto: AttendanceSummaryQueryDto) {
    const data = await this.attendanceService.getAdminSummary(queryDto);
    return { data };
  }

  @Get('admin/user-breakdown/:userId')
  @Roles('admin')
  @ApiOperation({
    summary:
      'Obtener desglose detallado de asistencia y descansos para un usuario (Solo Admin)',
  })
  @ApiQuery({ name: 'startDate', required: false, example: '2026-07-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2026-07-31' })
  async getAdminUserBreakdown(
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.attendanceService.getAdminUserBreakdown(
      userId,
      startDate,
      endDate,
    );
    return { data };
  }

  @Patch('admin/:id')
  @Roles('admin')
  @ApiOperation({
    summary:
      'Modificar/Ajustar manualmente un registro de asistencia (Solo Admin)',
  })
  async updateAdminRecord(
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    const data = await this.attendanceService.updateAdminRecord(id, dto);
    const i18n = I18nContext.current();
    return {
      message: i18n
        ? i18n.t('common.success.attendance.updated')
        : 'Registro de asistencia actualizado exitosamente',
      data,
    };
  }
}
