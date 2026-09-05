import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class LinkSaleDto {
  @ApiPropertyOptional({ example: '60d5ec49c6d48227b409748e', description: 'ID de la venta/ticket POS' })
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsOptional()
  saleId?: string;

  @ApiPropertyOptional({ example: 'VEN-0045', description: 'Folio de la venta/ticket POS' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  folio?: string;
}
