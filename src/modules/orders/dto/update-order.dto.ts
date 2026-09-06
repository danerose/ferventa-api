import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateOrderDto {
  @ApiPropertyOptional({
    example: 'Tablero digital FT 150 Italika modificado',
    description: 'Descripción de la pieza',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  itemDescription?: string;

  @ApiPropertyOptional({
    example: 520,
    description: 'Precio de compra / costo actualizado',
  })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  @IsOptional()
  costPrice?: number;

  @ApiPropertyOptional({
    example: 850,
    description: 'Precio de venta actualizado',
  })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0.01, { message: i18nValidationMessage('validation.min') })
  @IsOptional()
  sellingPrice?: number;

  @ApiPropertyOptional({
    example: 'Notas internas del pedido',
    description: 'Notas adicionales',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    example: '2026-09-18T00:00:00.000Z',
    description: 'Nueva fecha estimada de entrega',
  })
  @IsDateString(
    {},
    { message: i18nValidationMessage('validation.isDateString') },
  )
  @IsOptional()
  estimatedArrivalDate?: string;
}
