import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { KioskClockDto } from './dto/kiosk-clock.dto';

@ApiTags('Asistencia Kiosco (Tableta de Sucursal)')
@Controller('attendance/kiosk')
export class AttendanceKioskController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('employees')
  @ApiOperation({
    summary:
      'Obtener empleados activos de la sucursal y su estado actual para la interfaz del Kiosco',
  })
  @ApiQuery({
    name: 'branchId',
    required: false,
    description: 'ID de la sucursal (o mediante header x-branch-id)',
  })
  @ApiHeader({
    name: 'x-branch-id',
    required: false,
    description: 'ID de la sucursal activa en la tableta',
  })
  @ApiResponse({
    status: 200,
    description:
      'Lista de empleados con nombre, rol, estado de turno y si tienen turno activo.',
  })
  async getKioskEmployees(
    @Query('branchId') queryBranchId?: string,
    @Headers('x-branch-id') headerBranchId?: string,
  ) {
    const branchId = queryBranchId || headerBranchId;
    if (!branchId) {
      throw new BadRequestException(
        'Se requiere el ID de la sucursal (branchId o header x-branch-id)',
      );
    }
    const data = await this.attendanceService.getKioskEmployees(branchId);
    return { data };
  }

  @Post('clock')
  @ApiOperation({
    summary:
      'Registrar entrada, salida o descanso en el Kiosco validando PIN de 4 dígitos',
  })
  @ApiResponse({
    status: 200,
    description: 'Registro de asistencia exitoso.',
  })
  @ApiResponse({
    status: 401,
    description: 'PIN de acceso inválido.',
  })
  async kioskClock(@Body() dto: KioskClockDto) {
    return this.attendanceService.kioskClock(dto);
  }
}
