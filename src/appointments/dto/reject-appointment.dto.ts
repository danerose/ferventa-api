import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectAppointmentDto {
  @ApiProperty({
    example: 'Hola, lamentablemente hemos tenido que cancelar tu cita debido a falta de disponibilidad. Por favor, selecciona otro horario.',
    description: 'Mensaje de WhatsApp a enviar al cliente al rechazar la cita',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
