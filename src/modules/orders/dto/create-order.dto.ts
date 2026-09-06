import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateOrderDto {
  @ApiPropertyOptional({
    example: '60d5ec49c6d48227b409748b',
    description: 'ID del cliente si ya existe',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsOptional()
  customerId?: string;

  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre completo del cliente',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  customerName: string;

  @ApiProperty({
    example: '8119876543',
    description: 'Teléfono de contacto del cliente',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  customerPhone: string;

  @ApiPropertyOptional({
    example: 'juan@example.com',
    description: 'Correo electrónico del cliente',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEmail({}, { message: i18nValidationMessage('validation.isEmail') })
  @IsOptional()
  customerEmail?: string;

  @ApiProperty({
    example: 'Tablero digital FT 150 Italika',
    description: 'Descripción detallada de la pieza o artículo pedido',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  itemDescription: string;

  @ApiProperty({
    example: 500,
    description: 'Precio de lista / costo de compra al proveedor',
  })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  costPrice: number;

  @ApiProperty({ example: 800, description: 'Precio de venta al cliente' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0.01, { message: i18nValidationMessage('validation.min') })
  sellingPrice: number;

  @ApiProperty({
    example: 400,
    description:
      'Monto de anticipo/apartado inicial dejado por el cliente (mínimo 50% del precio de venta)',
  })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  advancePayment: number;

  @ApiPropertyOptional({
    example: 'cash',
    enum: ['cash', 'card', 'transfer'],
    description: 'Método de pago del anticipo',
  })
  @IsEnum(['cash', 'card', 'transfer'], {
    message: i18nValidationMessage('validation.isEnum'),
  })
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({
    example: 'AUTH-123456',
    description: 'Referencia bancaria o de terminal',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  paymentReference?: string;

  @ApiPropertyOptional({
    example: 'Solicitado en color negro mate',
    description: 'Notas adicionales del pedido',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    example: '2026-09-15T00:00:00.000Z',
    description: 'Fecha estimada de llegada a sucursal',
  })
  @IsDateString(
    {},
    { message: i18nValidationMessage('validation.isDateString') },
  )
  @IsOptional()
  estimatedArrivalDate?: string;
}
