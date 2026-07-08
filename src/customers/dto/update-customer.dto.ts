import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateCustomerDto {
  @ApiPropertyOptional({ example: 'Juan Pérez', description: 'Nombre completo' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'juan.perez@example.com', description: 'Correo electrónico' })
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsEmail({}, { message: i18nValidationMessage('validation.isEmail') })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '8118765432', description: 'Teléfono celular' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'whatsapp_id_123', description: 'WhatsApp ID' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  whatsappId?: string;
}
