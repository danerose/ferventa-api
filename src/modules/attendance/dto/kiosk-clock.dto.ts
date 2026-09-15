import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsIn, Length, IsOptional } from 'class-validator';

export class KioskClockDto {
  @ApiProperty({
    description: 'ID de la sucursal donde se ubica la tableta/kiosco',
    example: '60d5ec49c6d48227b409748b',
  })
  @IsNotEmpty()
  @IsString()
  branchId: string;

  @ApiProperty({
    description: 'ID del empleado que está registrando asistencia',
    example: '60d5ec49c6d48227b409748c',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'PIN numérico de 4 dígitos asignado al empleado',
    example: '1234',
  })
  @IsNotEmpty()
  @IsString()
  @Length(4, 4, { message: 'El PIN debe ser exactamente de 4 dígitos' })
  pin: string;

  @ApiProperty({
    description: 'Acción de asistencia a registrar',
    enum: ['clock-in', 'clock-out', 'break-start', 'break-end'],
    example: 'clock-in',
  })
  @IsNotEmpty()
  @IsIn(['clock-in', 'clock-out', 'break-start', 'break-end'], {
    message: 'La acción debe ser clock-in, clock-out, break-start o break-end',
  })
  action: 'clock-in' | 'clock-out' | 'break-start' | 'break-end';

  @ApiPropertyOptional({
    description: 'Observaciones o notas opcionales del registro en kiosco',
    example: 'Entrada puntual por kiosco',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
