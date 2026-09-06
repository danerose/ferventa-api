import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ServiceSupplyDto {
  @ApiProperty({
    example: '60d5ec49c6d48227b409748e',
    description: 'ID del producto (insumo)',
  })
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  productId: string;

  @ApiProperty({ example: 4, description: 'Cantidad consumida del producto' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0.01, { message: i18nValidationMessage('validation.min') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  quantity: number;
}

export class CreateServiceDto {
  @ApiProperty({
    example: '1er Mantenimiento',
    description: 'Nombre del servicio',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  name: string;

  @ApiPropertyOptional({
    example: 'Mantenimiento preventivo básico.',
    description: 'Descripción breve',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 450.0, description: 'Precio base de mano de obra' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  basePrice: number;

  @ApiPropertyOptional({ example: true, description: 'Estado activo' })
  @IsBoolean({ message: i18nValidationMessage('validation.isBoolean') })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    type: [ServiceSupplyDto],
    description: 'Insumos requeridos',
  })
  @IsArray({ message: i18nValidationMessage('validation.isArray') })
  @ValidateNested({ each: true })
  @Type(() => ServiceSupplyDto)
  @IsOptional()
  supplies?: ServiceSupplyDto[];
}
