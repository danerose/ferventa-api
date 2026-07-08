import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre del cliente' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  name: string;

  @ApiPropertyOptional({ example: 'juan.perez@example.com', description: 'Correo electrónico' })
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsEmail({}, { message: i18nValidationMessage('validation.isEmail') })
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '8118765432', description: 'Teléfono celular del cliente' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  phone: string;

  @ApiPropertyOptional({ example: 'whatsapp_id_123', description: 'Identificador para WhatsApp (opcional)' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  whatsappId?: string;
}
