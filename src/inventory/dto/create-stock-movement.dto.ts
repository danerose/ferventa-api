import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsMongoId, IsNumber, IsString, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateStockMovementDto {
  @ApiProperty({ example: '60d5ec49c6d48227b409748e', description: 'ID del producto' })
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  productId: string;

  @ApiProperty({ example: 'in', enum: ['in', 'out', 'adjustment'], description: 'Tipo de movimiento' })
  @IsEnum(['in', 'out', 'adjustment'], { message: i18nValidationMessage('validation.isEnum') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  type: string;

  @ApiProperty({ example: 10, description: 'Cantidad de unidades' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(1, { message: i18nValidationMessage('validation.min') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  quantity: number;

  @ApiProperty({ example: 'Compra de inventario al proveedor', description: 'Motivo del movimiento' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  reason: string;
}
