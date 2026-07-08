import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  ValidateNested,
  IsNumber,
  Min,
  IsMongoId,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class AppointmentVehicleDto {
  @ApiProperty({ example: 'Ford', description: 'Marca del auto' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  brand: string;

  @ApiProperty({ example: 'Fiesta', description: 'Modelo' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  model: string;

  @ApiProperty({ example: 2015, description: 'Año' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(1900, { message: i18nValidationMessage('validation.min') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  year: number;

  @ApiProperty({ example: '1234', description: 'Últimos 4 dígitos del número de serie' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  serialNumberLastFour: string;
}

export class CreateAppointmentDto {
  @ApiProperty({ example: 'Carlos Sánchez', description: 'Nombre completo' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  customerName: string;

  @ApiProperty({ example: '8119876543', description: 'Teléfono' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  customerPhone: string;

  @ApiPropertyOptional({ example: 'carlos@example.com', description: 'Correo electrónico' })
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsEmail({}, { message: i18nValidationMessage('validation.isEmail') })
  @IsOptional()
  customerEmail?: string;

  @ApiPropertyOptional({ example: 'whatsapp_carlos', description: 'WhatsApp ID' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  whatsappId?: string;

  @ApiPropertyOptional({ example: '60d5ec49c6d48227b409748b', description: 'ID del cliente si ya existe' })
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsOptional()
  customerId?: string;

  @ApiProperty({ type: AppointmentVehicleDto, description: 'Datos del vehículo' })
  @ValidateNested()
  @Type(() => AppointmentVehicleDto)
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  vehicle: AppointmentVehicleDto;

  @ApiProperty({ example: 'Cambio de aceite y filtro', description: 'Servicio solicitado' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  serviceRequested: string;

  @ApiProperty({ example: '2026-07-10T10:00:00Z', description: 'Fecha y hora programada' })
  @IsDateString({}, { message: i18nValidationMessage('validation.isDateString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  scheduledAt: string;

  @ApiPropertyOptional({ example: 'El cliente prefiere aceite sintético', description: 'Notas opcionales' })
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
