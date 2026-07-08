import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: '60d5ec49c6d48227b409748b', description: 'ID del propietario' })
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ example: 'Nissan', description: 'Marca' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({ example: 'Versa', description: 'Modelo' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ example: 2018, description: 'Año' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({ example: '1234', description: 'Últimos 4 dígitos del número de serie del vehículo' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  serialNumberLastFour?: string;

  @ApiPropertyOptional({ example: 'Gris Plata', description: 'Color' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  color?: string;
}
