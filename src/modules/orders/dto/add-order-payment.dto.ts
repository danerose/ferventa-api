import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class AddOrderPaymentDto {
  @ApiProperty({ example: 400, description: 'Monto del abono o liquidación' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0.01, { message: i18nValidationMessage('validation.min') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  amount: number;

  @ApiPropertyOptional({
    example: 'cash',
    enum: ['cash', 'card', 'transfer'],
    description: 'Método de pago',
  })
  @IsEnum(['cash', 'card', 'transfer'], {
    message: i18nValidationMessage('validation.isEnum'),
  })
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({
    example: 'REF-789012',
    description: 'Referencia de la transacción',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  paymentReference?: string;

  @ApiPropertyOptional({
    example: 'Liquidación al recoger la pieza',
    description: 'Notas del abono',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  notes?: string;
}
