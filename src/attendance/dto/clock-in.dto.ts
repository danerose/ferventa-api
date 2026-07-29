import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ClockInDto {
  @ApiPropertyOptional({ description: 'Observación u nota opcional al registrar la entrada', example: 'Llegada a tiempo' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'ID opcional del usuario para el que se registra la entrada' })
  @IsOptional()
  @IsString()
  userId?: string;
}
