import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateBranchDto {
  @ApiProperty({ example: 'Sucursal Norte' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  name: string;

  @ApiProperty({ example: 'Av. Principal #123', required: false })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  address?: string;

  @ApiProperty({ example: '8110001122', required: false })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateBranchDto extends PartialType(CreateBranchDto) {}
