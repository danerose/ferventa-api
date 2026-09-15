import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsMongoId,
  IsNumber,
  IsString,
  IsOptional,
  Min,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateReceptionItemDto {
  @ApiProperty({
    example: '60d5ec49c6d48227b409748e',
    description: 'ID del producto recibido',
  })
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  productId: string;

  @ApiProperty({
    example: 12,
    description: 'Cantidad de unidades en este paquete/caja',
  })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(1, { message: i18nValidationMessage('validation.min') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  quantity: number;

  @ApiProperty({
    example: 100.0,
    description: 'Costo unitario de compra de este lote',
  })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  costPrice: number;

  @ApiPropertyOptional({
    example: 150.0,
    description:
      'Precio de venta que regirá cuando se abra esta caja (si se omite, se mantiene el sellingPrice actual del producto)',
  })
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  sellingPrice?: number;
}

export class CreateStockReceptionDto {
  @ApiPropertyOptional({
    example: '60d5ec49c6d48227b409748f',
    description: 'ID del proveedor (opcional)',
  })
  @IsOptional()
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  providerId?: string;

  @ApiProperty({
    type: [CreateReceptionItemDto],
    description: 'Lista de ítems/cajas recibidas en la remisión',
  })
  @IsArray({ message: i18nValidationMessage('validation.isArray') })
  @ValidateNested({ each: true })
  @Type(() => CreateReceptionItemDto)
  items: CreateReceptionItemDto[];

  @ApiPropertyOptional({
    example: 'FAC-98421',
    description: 'Número de factura o folio de remisión del proveedor',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  invoiceOrFolio?: string;

  @ApiPropertyOptional({
    example: 'Paquete de aceites recibido en caja sellada',
    description: 'Notas u observaciones de recepción',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  notes?: string;
}

export class OpenBoxDto {
  @ApiProperty({
    example: 'BOX-20260914-001',
    description: 'Código de caja/lote escaneado desde el ticket QR',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  boxCode: string;
}
