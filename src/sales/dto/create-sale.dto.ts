import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
  IsArray,
  IsEnum,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class SaleItemDto {
  @ApiProperty({ example: '60d5ec49c6d48227b409748e', description: 'ID del producto' })
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  productId: string;

  @ApiProperty({ example: 2, description: 'Cantidad vendida' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(1, { message: i18nValidationMessage('validation.min') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  quantity: number;

  @ApiPropertyOptional({ example: 10.0, description: 'Descuento unitario' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  @IsOptional()
  discount?: number;
}

export class CreateSaleDto {
  @ApiPropertyOptional({ example: '60d5ec49c6d48227b409748f', description: 'ID de la cotización origen si aplica' })
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsOptional()
  quoteId?: string;

  @ApiPropertyOptional({ example: '60d5ec49c6d48227b409748b', description: 'ID del cliente (Requerido si no hay cotización)' })
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ type: [SaleItemDto], description: 'Artículos vendidos (Requerido si no hay cotización)' })
  @IsArray({ message: i18nValidationMessage('validation.isArray') })
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  @IsOptional()
  items?: SaleItemDto[];

  @ApiPropertyOptional({ example: 50.0, description: 'Descuento global' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  @IsOptional()
  globalDiscount?: number;

  @ApiProperty({ example: 'cash', enum: ['cash', 'card'], description: 'Método de pago' })
  @IsEnum(['cash', 'card'], { message: i18nValidationMessage('validation.isEnum') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  paymentMethod: string;

  @ApiPropertyOptional({ example: 'MP-POINT-123456', description: 'Referencia de cobro / terminal' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  paymentReference?: string;
}
