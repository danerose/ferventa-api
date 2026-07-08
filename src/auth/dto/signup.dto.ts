import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class SignupDto {
  @ApiProperty({ example: 'Alexis Rojas', description: 'Nombre completo' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  name: string;

  @ApiProperty({ example: 'alexis@example.com', description: 'Correo electrónico' })
  @IsEmail({}, { message: i18nValidationMessage('validation.isEmail') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'Contraseña de acceso' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MinLength(6, { message: i18nValidationMessage('validation.minLength') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  password: string;
}
