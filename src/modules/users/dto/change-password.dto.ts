import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'Password123!',
    description: 'Contraseña actual del usuario',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  currentPassword: string;

  @ApiProperty({
    example: 'NewSecurePassword123!',
    description: 'Nueva contraseña elegida por el usuario (mínimo 6 caracteres)',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MinLength(6, { message: i18nValidationMessage('validation.minLength') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  newPassword: string;
}
