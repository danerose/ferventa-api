import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsMongoId, IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Alexis Rojas', description: 'Nombre completo' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'arojas', description: 'Nombre de usuario único' })
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ example: 'alexis@example.com', description: 'Correo electrónico' })
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsEmail({}, { message: i18nValidationMessage('validation.isEmail') })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'NewPassword123!', description: 'Nueva contraseña' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MinLength(6, { message: i18nValidationMessage('validation.minLength') })
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ example: '60d5ec49c6d48227b409748b', description: 'ID de Rol' })
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsOptional()
  roleId?: string;

  @ApiPropertyOptional({ example: true, description: 'Estado activo/inactivo del usuario' })
  @IsBoolean({ message: i18nValidationMessage('validation.isBoolean') })
  @IsOptional()
  isActive?: boolean;
}
