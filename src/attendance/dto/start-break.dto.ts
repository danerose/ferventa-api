import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class StartBreakDto {
  @ApiPropertyOptional({ description: 'Motivo o nota opcional del receso', example: 'Hora de comida' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'ID opcional del usuario para el que se registra el descanso' })
  @IsOptional()
  @IsString()
  userId?: string;
}
