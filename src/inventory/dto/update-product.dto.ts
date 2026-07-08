import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsMongoId,
  IsOptional,
  IsArray,
  IsBoolean,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Balatas Delanteras de Cerámica', description: 'Nombre del producto' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Balatas de alta durabilidad para sistemas de frenado', description: 'Descripción' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '60d5ec49c6d48227b409748b', description: 'ID de la Marca' })
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({ example: '60d5ec49c6d48227b409748c', description: 'ID de la Categoría' })
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: '60d5ec49c6d48227b409748d', description: 'ID del Proveedor' })
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsOptional()
  providerId?: string;

  @ApiPropertyOptional({ example: 450.0, description: 'Precio de costo unitario' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  @IsOptional()
  costPrice?: number;

  @ApiPropertyOptional({ example: 750.0, description: 'Precio de venta unitario' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  @IsOptional()
  sellingPrice?: number;

  @ApiPropertyOptional({ example: 25, description: 'Stock actual' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({ example: 5, description: 'Stock mínimo para alertas de reabastecimiento' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  @IsOptional()
  minStock?: number;

  @ApiPropertyOptional({ example: 'piece', description: 'Unidad de medida' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ example: ['https://example.com/photo1.jpg'], description: 'URLs de fotos' })
  @IsArray({ message: i18nValidationMessage('validation.isArray') })
  @IsString({ each: true, message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  photos?: string[];

  @ApiPropertyOptional({ example: ['Nissan Versa 2015-2020'], description: 'Modelos de autos compatibles' })
  @IsArray({ message: i18nValidationMessage('validation.isArray') })
  @IsString({ each: true, message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  compatibility?: string[];

  @ApiPropertyOptional({ example: true, description: 'Estado del producto (activo/inactivo)' })
  @IsBoolean({ message: i18nValidationMessage('validation.isBoolean') })
  @IsOptional()
  isActive?: boolean;
}
