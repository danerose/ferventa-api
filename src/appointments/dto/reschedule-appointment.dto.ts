import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RescheduleAppointmentDto {
  @ApiProperty({
    example: '2026-07-24T10:00:00.000Z',
    description: 'Nueva fecha y hora para la cita (formato ISO 8601)',
  })
  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @ApiPropertyOptional({
    example: 60,
    description: 'Nueva duración de la cita en minutos',
  })
  @IsNumber()
  @IsOptional()
  duration?: number;

  @ApiProperty({
    example: 'Hola, hemos reagendado tu cita para el día 24 de Julio a las 10:00 AM UTC. Confírmanos si estás de acuerdo.',
    description: 'Mensaje de WhatsApp a enviar al cliente',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
