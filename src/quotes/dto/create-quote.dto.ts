import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
  IsArray,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class QuoteItemDto {
  @ApiProperty({ example: '60d5ec49c6d48227b409748e', description: 'ID del producto' })
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  productId: string;

  @ApiProperty({ example: 2, description: 'Cantidad cotizada' })
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

export class CreateQuoteDto {
  @ApiProperty({ example: '60d5ec49c6d48227b409748b', description: 'ID del cliente' })
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  customerId: string;

  @ApiProperty({ type: [QuoteItemDto], description: 'Artículos cotizados' })
  @IsArray({ message: i18nValidationMessage('validation.isArray') })
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  items: QuoteItemDto[];

  @ApiPropertyOptional({ example: 50.0, description: 'Descuento global aplicado' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  @IsOptional()
  globalDiscount?: number;

  @ApiPropertyOptional({ example: '2026-07-20T23:59:59Z', description: 'Vigencia de la cotización' })
  @IsDateString({}, { message: i18nValidationMessage('validation.isDateString') })
  @IsOptional()
  validUntil?: string;
}
