import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsMongoId,
  IsOptional,
  IsArray,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateProductDto {
  @ApiProperty({ example: 'SKU-123456', description: 'Código único del producto (SKU)' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  sku: string;

  @ApiProperty({ example: 'Balatas Delanteras de Cerámica', description: 'Nombre del producto' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  name: string;

  @ApiPropertyOptional({ example: 'Balatas de alta durabilidad para sistemas de frenado', description: 'Descripción' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '60d5ec49c6d48227b409748b', description: 'ID de la Marca' })
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  brandId: string;

  @ApiProperty({ example: '60d5ec49c6d48227b409748c', description: 'ID de la Categoría' })
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  categoryId: string;

  @ApiProperty({ example: '60d5ec49c6d48227b409748d', description: 'ID del Proveedor' })
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  providerId: string;

  @ApiProperty({ example: 450.0, description: 'Precio de costo unitario' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  costPrice: number;

  @ApiProperty({ example: 750.0, description: 'Precio de venta unitario' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  sellingPrice: number;

  @ApiPropertyOptional({ example: 25, description: 'Stock inicial en inventario' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({ example: 5, description: 'Stock mínimo para alertas de reabastecimiento' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  @IsOptional()
  minStock?: number;

  @ApiPropertyOptional({ example: 'piece', description: 'Unidad de medida (ej. piece, kit, liter)' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ example: ['https://example.com/photo1.jpg'], description: 'URLs de fotos' })
  @IsArray({ message: i18nValidationMessage('validation.isArray') })
  @IsString({ each: true, message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  photos?: string[];

  @ApiPropertyOptional({ example: ['Nissan Versa 2015-2020', 'Nissan March 2012-2018'], description: 'Modelos de autos compatibles' })
  @IsArray({ message: i18nValidationMessage('validation.isArray') })
  @IsString({ each: true, message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  compatibility?: string[];
}
