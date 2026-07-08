import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApproveAppointmentDto {
  @ApiProperty({
    example: 'Hola, tu cita ha sido aprobada para el día programado. ¡Te esperamos!',
    description: 'Mensaje de WhatsApp a enviar al cliente al aprobar la cita',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
