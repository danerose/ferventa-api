import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class LoginDto {
  @ApiPropertyOptional({ example: 'admin', description: 'Nombre de usuario o correo electrónico' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ example: 'admin@ferventa.com', description: 'Correo electrónico (opcional si se especifica username)' })
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'AdminPassword123!', description: 'Contraseña' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MinLength(6, { message: i18nValidationMessage('validation.minLength') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  password: string;
}
