import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class AddDiagnosticNoteDto {
  @ApiProperty({
    example:
      'Se detectó fuga de aceite en retén de cigüeñal durante inspección',
    description: 'Nota de diagnóstico o registro de falla encontrada',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  note: string;
}
