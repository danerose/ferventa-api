import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateVehicleDto {
  @ApiProperty({ example: '60d5ec49c6d48227b409748b', description: 'ID del cliente propietario' })
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  customerId: string;

  @ApiProperty({ example: 'Nissan', description: 'Marca del vehículo' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  brand: string;

  @ApiProperty({ example: 'Versa', description: 'Modelo/Submarca del vehículo' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  model: string;

  @ApiProperty({ example: 2018, description: 'Año del vehículo' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(1900, { message: i18nValidationMessage('validation.min') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  year: number;

  @ApiProperty({ example: '1234', description: 'Últimos 4 dígitos del número de serie del vehículo (únicos)' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  serialNumberLastFour: string;

  @ApiPropertyOptional({ example: 'Gris Plata', description: 'Color del vehículo' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  color?: string;
}
