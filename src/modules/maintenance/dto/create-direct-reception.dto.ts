import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsNumber,
  Min,
  IsMongoId,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class DirectReceptionVehicleDto {
  @ApiProperty({ example: 'Ford', description: 'Marca del vehículo' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  brand: string;

  @ApiProperty({ example: 'Fiesta', description: 'Modelo del vehículo' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  model: string;

  @ApiProperty({ example: 2018, description: 'Año del vehículo' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  year: number;

  @ApiProperty({
    example: '1234',
    description: 'Últimos 4 dígitos del número de serie o identificador',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  serialNumberLastFour: string;

  @ApiPropertyOptional({ example: 'Rojo', description: 'Color del vehículo' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({
    example: '60d5ec49c6d48227b409748b',
    description: 'ID del vehículo existente si aplica',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsOptional()
  id?: string;
}

export class CreateDirectReceptionDto {
  @ApiProperty({ example: 'Carlos Sánchez', description: 'Nombre del cliente' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  customerName: string;

  @ApiProperty({ example: '8119876543', description: 'Teléfono de contacto' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  customerPhone: string;

  @ApiPropertyOptional({
    example: 'carlos@example.com',
    description: 'Correo electrónico',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEmail({}, { message: i18nValidationMessage('validation.isEmail') })
  @IsOptional()
  customerEmail?: string;

  @ApiPropertyOptional({
    example: 'whatsapp_carlos',
    description: 'WhatsApp ID si aplica',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  whatsappId?: string;

  @ApiPropertyOptional({
    example: '60d5ec49c6d48227b409748b',
    description: 'ID del cliente si ya existe en sistema',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({
    example: '60d5ec49c6d48227b409748c',
    description: 'ID del vehículo si ya existe en sistema (seleccionado por el usuario)',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsOptional()
  vehicleId?: string;

  @ApiProperty({
    type: DirectReceptionVehicleDto,
    description: 'Datos del vehículo recibido',
  })
  @ValidateNested()
  @Type(() => DirectReceptionVehicleDto)
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  vehicle: DirectReceptionVehicleDto;

  @ApiProperty({
    example: 'Revisión de frenos y cambio de balatas',
    description: 'Motivo de ingreso o servicio solicitado',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  serviceRequested: string;

  @ApiPropertyOptional({
    example: 'El cliente reporta rechinido al frenar',
    description: 'Notas u observaciones de recepción',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    example: 450.0,
    description: 'Costo estimado inicial de mano de obra',
  })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  @IsOptional()
  laborCost?: number;

  @ApiPropertyOptional({
    example: 'Roberto Sánchez',
    description: 'Mecánico asignado (opcional)',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  assignedMechanic?: string;
}
