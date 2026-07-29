import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class AttendanceQueryDto {
  @ApiPropertyOptional({ description: 'ID de la sucursal a filtrar' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ description: 'ID del usuario a filtrar' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Fecha inicio (YYYY-MM-DD)', example: '2026-07-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fecha fin (YYYY-MM-DD)', example: '2026-07-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Estatus del registro', enum: ['working', 'on_break', 'completed'] })
  @IsOptional()
  @IsIn(['working', 'on_break', 'completed'])
  status?: string;
}
