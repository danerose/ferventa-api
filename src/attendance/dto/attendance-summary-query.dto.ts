import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class AttendanceSummaryQueryDto {
  @ApiPropertyOptional({ description: 'ID de la sucursal a filtrar' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({
    description: 'Período del resumen',
    enum: ['weekly', 'biweekly', 'monthly', 'custom'],
    default: 'weekly',
  })
  @IsOptional()
  @IsIn(['weekly', 'biweekly', 'monthly', 'custom'])
  period?: 'weekly' | 'biweekly' | 'monthly' | 'custom' = 'weekly';

  @ApiPropertyOptional({ description: 'Fecha inicio en caso de period=custom (YYYY-MM-DD)', example: '2026-07-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fecha fin en caso de period=custom (YYYY-MM-DD)', example: '2026-07-31' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
