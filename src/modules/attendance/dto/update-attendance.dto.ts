import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateAttendanceDto {
  @ApiPropertyOptional({
    description: 'Fecha y hora de entrada (ISOString)',
    example: '2026-07-29T09:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  clockIn?: string;

  @ApiPropertyOptional({
    description: 'Fecha y hora de salida (ISOString)',
    example: '2026-07-29T18:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  clockOut?: string;

  @ApiPropertyOptional({
    description: 'Observación del admin',
    example: 'Ajuste manual de horas por olvido',
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
