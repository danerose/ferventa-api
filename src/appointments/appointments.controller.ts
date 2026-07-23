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
  BadRequestException,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { ApproveAppointmentDto } from './dto/approve-appointment.dto';
import { RejectAppointmentDto } from './dto/reject-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { I18nContext } from 'nestjs-i18n';
import { Roles } from '../common/decorators/roles.decorator';
import { BranchGuard } from '../common/guards/branch.guard';
import { BranchId } from '../common/decorators/branch-id.decorator';

@ApiTags('Citas (Appointments)')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // --- PUBLIC ENDPOINTS (No Authentication) ---
  @Post('public')
  @ApiOperation({ summary: 'Agendar una cita desde el portal público (Cliente)' })
  @ApiResponse({ status: 201, description: 'Cita agendada correctamente.' })
  publicCreate(@Headers('x-branch-id') branchId: string, @Body() createAppointmentDto: CreateAppointmentDto) {
    if (!branchId) throw new BadRequestException('Falta x-branch-id');
    return this.appointmentsService.create(createAppointmentDto, branchId);
  }

  @Get('public/status')
  @ApiOperation({ summary: 'Consultar el estado de una cita por Folio (ID), teléfono o placas' })
  @ApiQuery({ name: 'q', required: true, description: 'ID de cita, teléfono de cliente o placas del vehículo' })
  publicQueryStatus(@Headers('x-branch-id') branchId: string, @Query('q') queryStr: string) {
    if (!branchId) throw new BadRequestException('Falta x-branch-id');
    return this.appointmentsService.queryStatus(queryStr, branchId);
  }

  // --- SCHEDULE CONFIGURATION ENDPOINTS ---
  @Get('schedule')
  @ApiOperation({ summary: 'Obtener la configuración del horario semanal laboral' })
  getSchedule(@Headers('x-branch-id') branchId: string) {
    if (!branchId) throw new BadRequestException('Falta x-branch-id');
    return this.appointmentsService.getSchedule(branchId);
  }

  @Patch('schedule')
  @UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
  @Roles('admin', 'seller')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar la configuración del horario laboral (Solo Staff)' })
  updateSchedule(@BranchId() branchId: string, @Body() updateScheduleDto: UpdateScheduleDto) {
    return this.appointmentsService.updateSchedule(updateScheduleDto.schedules, branchId);
  }

  // --- HOLIDAYS CONFIGURATION ENDPOINTS ---
  @Get('holidays')
  @ApiOperation({ summary: 'Obtener el listado de días festivos / cierres especiales' })
  getHolidays(@Headers('x-branch-id') branchId: string) {
    if (!branchId) throw new BadRequestException('Falta x-branch-id');
    return this.appointmentsService.getHolidays(branchId);
  }

  @Post('holidays')
  @UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
  @Roles('admin', 'seller')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar un día no laboral / festivo (Solo Staff)' })
  addHoliday(@BranchId() branchId: string, @Body() createHolidayDto: CreateHolidayDto) {
    return this.appointmentsService.addHoliday(createHolidayDto.date, createHolidayDto.description, branchId);
  }

  @Delete('holidays/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
  @Roles('admin', 'seller')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover un día no laboral / festivo (Solo Staff)' })
  removeHoliday(@BranchId() branchId: string, @Param('id') id: string) {
    return this.appointmentsService.removeHoliday(id, branchId);
  }

  // --- OCCUPIED SLOTS & HOLIDAYS (Public) ---
  @Get('occupied-slots')
  @ApiOperation({ summary: 'Obtener fechas festivas, días inactivos y horas ocupadas' })
  @ApiQuery({ name: 'startDate', required: true, example: '2026-07-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2026-07-31' })
  getOccupiedSlots(
    @Headers('x-branch-id') branchId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!branchId) throw new BadRequestException('Falta x-branch-id');
    if (!startDate || !endDate) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.dateRangeRequired') : 'Se requieren las fechas startDate y endDate');
    }
    return this.appointmentsService.getOccupiedSlots(startDate, endDate, branchId);
  }

  // --- TIMELINE ENDPOINT (Staff) ---
  @Get('timeline')
  @UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
  @Roles('admin', 'seller', 'mechanic')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener citas detalladas para vista de timeline/cronograma' })
  @ApiQuery({ name: 'startDate', required: true, example: '2026-07-09' })
  @ApiQuery({ name: 'endDate', required: true, example: '2026-07-15' })
  getWeeklyTimeline(
    @BranchId() branchId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!startDate || !endDate) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.dateRangeRequired') : 'Se requieren las fechas startDate y endDate');
    }
    return this.appointmentsService.getWeeklyTimeline(startDate, endDate, branchId);
  }

  // --- STAFF ENDPOINTS (Require Authentication) ---
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
  @Roles('admin', 'seller')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar una cita desde panel administrativo (Admin / Seller)' })
  create(@BranchId() branchId: string, @Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto, branchId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
  @Roles('admin', 'seller', 'mechanic')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todas las citas con filtros opcionales' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por cliente, teléfono o placas' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Filtrar desde fecha (YYYY-MM-DD)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Filtrar hasta fecha (YYYY-MM-DD)' })
  findAll(
    @BranchId() branchId: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.appointmentsService.findAll(branchId, { search, status, fromDate, toDate });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
  @Roles('admin', 'seller', 'mechanic')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener detalle de una cita por ID (Staff)' })
  findOne(@BranchId() branchId: string, @Param('id') id: string) {
    return this.appointmentsService.findById(id, branchId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
  @Roles('admin', 'seller')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar/aprobar/reprogramar una cita' })
  update(@BranchId() branchId: string, @Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, branchId, updateAppointmentDto);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
  @Roles('admin', 'seller')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aprobar una cita enviando confirmación por WhatsApp' })
  approve(@BranchId() branchId: string, @Param('id') id: string, @Body() approveAppointmentDto: ApproveAppointmentDto) {
    return this.appointmentsService.approve(id, branchId, approveAppointmentDto.message);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
  @Roles('admin', 'seller')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rechazar una cita enviando notificación por WhatsApp' })
  reject(@BranchId() branchId: string, @Param('id') id: string, @Body() rejectAppointmentDto: RejectAppointmentDto) {
    return this.appointmentsService.reject(id, branchId, rejectAppointmentDto.message);
  }

  @Patch(':id/reschedule')
  @UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
  @Roles('admin', 'seller')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reagendar una cita (manteniendo status pendiente) y enviando confirmación por WhatsApp' })
  reschedule(@BranchId() branchId: string, @Param('id') id: string, @Body() rescheduleAppointmentDto: RescheduleAppointmentDto) {
    const duration = rescheduleAppointmentDto.duration || 15;
    return this.appointmentsService.reschedule(
      id,
      branchId,
      rescheduleAppointmentDto.scheduledAt,
      duration,
      rescheduleAppointmentDto.message,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, BranchGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una cita (Solo Admin)' })
  remove(@BranchId() branchId: string, @Param('id') id: string) {
    return this.appointmentsService.remove(id, branchId);
  }
}
