import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class AdminResetPasswordDto {
  @ApiPropertyOptional({
    example: 'NewAdminAssignedPassword123!',
    description:
      'Nueva contraseña para el usuario (mínimo 6 caracteres). Si se omite o deja vacía, el API la genera automáticamente.',
    required: false,
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MinLength(6, { message: i18nValidationMessage('validation.minLength') })
  @IsOptional()
  newPassword?: string;
}
