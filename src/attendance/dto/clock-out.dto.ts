import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ClockOutDto {
  @ApiPropertyOptional({ description: 'Observación u nota opcional al registrar la salida', example: 'Fin de turno' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'ID opcional del usuario para el que se registra la salida' })
  @IsOptional()
  @IsString()
  userId?: string;
}
