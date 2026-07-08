import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateProviderDto {
  @ApiProperty({ example: 'Autopartes del Norte S.A.', description: 'Nombre comercial del proveedor' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  name: string;

  @ApiPropertyOptional({ example: '8112345678', description: 'Teléfono de contacto' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'contacto@autopartesnorte.com', description: 'Correo de contacto' })
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsEmail({}, { message: i18nValidationMessage('validation.isEmail') })
  @IsOptional()
  email?: string;
}
