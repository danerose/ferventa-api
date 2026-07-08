import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsDateString,
  ValidateNested,
  IsEnum,
  IsMongoId,
  IsNumber,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { AppointmentVehicleDto } from './create-appointment.dto';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ example: 'Carlos Sánchez', description: 'Nombre completo' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  customerName?: string;

  @ApiPropertyOptional({ example: '8119876543', description: 'Teléfono' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  customerPhone?: string;

  @ApiPropertyOptional({ example: 'carlos@example.com', description: 'Correo' })
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsEmail({}, { message: i18nValidationMessage('validation.isEmail') })
  @IsOptional()
  customerEmail?: string;

  @ApiPropertyOptional({ example: 'whatsapp_carlos', description: 'WhatsApp ID' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  whatsappId?: string;

  @ApiPropertyOptional({ example: '60d5ec49c6d48227b409748b', description: 'Cliente ID' })
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ type: AppointmentVehicleDto, description: 'Vehículo' })
  @ValidateNested()
  @Type(() => AppointmentVehicleDto)
  @IsOptional()
  vehicle?: AppointmentVehicleDto;

  @ApiPropertyOptional({ example: 'Alineación y balanceo', description: 'Servicio' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  serviceRequested?: string;

  @ApiPropertyOptional({ example: '2026-07-10T10:00:00Z', description: 'Fecha programada' })
  @IsDateString({}, { message: i18nValidationMessage('validation.isDateString') })
  @IsOptional()
  scheduledAt?: string;

  @ApiPropertyOptional({
    example: 'approved',
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed', 'rescheduled'],
    description: 'Estado de la cita',
  })
  @IsEnum(['pending', 'approved', 'rejected', 'cancelled', 'completed', 'rescheduled'], {
    message: i18nValidationMessage('validation.isEnum'),
  })
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 'Cita reprogramada por solicitud del cliente', description: 'Notas' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 60, description: 'Duración estimada en minutos' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(1, { message: i18nValidationMessage('validation.min') })
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({ example: 'Roberto Sánchez', description: 'Mecánico asignado' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  assignedMechanic?: string;
}
