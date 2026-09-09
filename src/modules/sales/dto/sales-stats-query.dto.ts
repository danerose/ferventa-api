import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class SalesStatsQueryDto {
  @ApiPropertyOptional({
    description: 'Fecha de inicio (YYYY-MM-DD) en la zona horaria del cliente',
    example: '2026-09-03',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin (YYYY-MM-DD) en la zona horaria del cliente',
    example: '2026-09-09',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description:
      'Offset UTC en minutos (ej: 300 para UTC-5 / América). Equivale a new Date().getTimezoneOffset()',
    example: 300,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  utcOffsetMinutes?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por estatus de cancelación (true, false o only_active)',
    example: 'false',
  })
  @IsOptional()
  @IsString()
  isCancelled?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por método de pago específico',
    enum: ['cash', 'card', 'transfer'],
    example: 'cash',
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por cliente específico',
    example: '60d5ec49c6d48227b409748e',
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'ID de la sucursal (por defecto se toma del header x-branch-id)',
  })
  @IsOptional()
  @IsString()
  branchId?: string;
}
