import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateHolidayDto {
  @ApiProperty({ example: '2026-12-25', description: 'Fecha festiva o día no laboral (YYYY-MM-DD)' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: i18nValidationMessage('validation.matches') || 'Formato de fecha inválido (YYYY-MM-DD)',
  })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  date: string;

  @ApiProperty({ example: 'Navidad', description: 'Motivo o descripción del cierre' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  description: string;
}
