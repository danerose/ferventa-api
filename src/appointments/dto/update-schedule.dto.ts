import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsString, ValidateNested, Min, Max, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class DayScheduleDto {
  @ApiProperty({ example: 1, description: 'Día de la semana (0 = Domingo, 1 = Lunes, etc.)' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  @Max(6, { message: i18nValidationMessage('validation.max') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  dayOfWeek: number;

  @ApiProperty({ example: true, description: '¿Se trabaja este día?' })
  @IsBoolean({ message: i18nValidationMessage('validation.isBoolean') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  isWorking: boolean;

  @ApiProperty({ example: '08:00', description: 'Hora de inicio' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @Matches(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: i18nValidationMessage('validation.matches') || 'Formato de hora inválido (HH:MM)',
  })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  startTime: string;

  @ApiProperty({ example: '18:00', description: 'Hora de fin' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @Matches(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: i18nValidationMessage('validation.matches') || 'Formato de hora inválido (HH:MM)',
  })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  endTime: string;
}

export class UpdateScheduleDto {
  @ApiProperty({ type: [DayScheduleDto], description: 'Listado de horarios por día' })
  @ValidateNested({ each: true })
  @Type(() => DayScheduleDto)
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  schedules: DayScheduleDto[];
}
