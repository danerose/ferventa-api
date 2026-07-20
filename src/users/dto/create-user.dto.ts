import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsMongoId, IsOptional, IsArray } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateUserDto {
  @ApiProperty({ example: 'Alexis Rojas', description: 'Nombre completo del usuario' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  name: string;

  @ApiProperty({ example: 'alexis@example.com', description: 'Correo electrónico único', required: false })
  @IsEmail({}, { message: i18nValidationMessage('validation.isEmail') })
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'Password123!', description: 'Contraseña de acceso (mínimo 6 caracteres)', required: false })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MinLength(6, { message: i18nValidationMessage('validation.minLength') })
  @IsOptional()
  password?: string;

  @ApiProperty({ example: '8118765432', description: 'Número de teléfono del usuario' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  phone: string;

  @ApiProperty({ example: '60d5ec49c6d48227b409748b', description: 'ID del Rol asignado' })
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  roleId: string;

  @ApiProperty({ example: ['60d5ec49c6d48227b409748b'], description: 'IDs de las sucursales a las que tiene acceso el usuario', type: [String] })
  @IsArray()
  @IsMongoId({ each: true, message: i18nValidationMessage('validation.isMongoId') })
  branches: string[];
}
