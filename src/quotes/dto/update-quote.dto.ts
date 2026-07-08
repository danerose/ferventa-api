import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsMongoId,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
  IsArray,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuoteItemDto } from './create-quote.dto';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateQuoteDto {
  @ApiPropertyOptional({ example: '60d5ec49c6d48227b409748b', description: 'ID del cliente' })
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ type: [QuoteItemDto], description: 'Artículos cotizados' })
  @IsArray({ message: i18nValidationMessage('validation.isArray') })
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  @IsOptional()
  items?: QuoteItemDto[];

  @ApiPropertyOptional({ example: 50.0, description: 'Descuento global' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  @IsOptional()
  globalDiscount?: number;

  @ApiPropertyOptional({ example: '2026-07-20T23:59:59Z', description: 'Vigencia' })
  @IsDateString({}, { message: i18nValidationMessage('validation.isDateString') })
  @IsOptional()
  validUntil?: string;

  @ApiPropertyOptional({
    example: 'accepted',
    enum: ['pending', 'accepted', 'rejected'],
    description: 'Estado de la cotización',
  })
  @IsEnum(['pending', 'accepted', 'rejected'], {
    message: i18nValidationMessage('validation.isEnum'),
  })
  @IsOptional()
  status?: string;
}
