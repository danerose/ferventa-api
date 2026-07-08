import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UploadEvidenceDto {
  @ApiProperty({ example: 'disassembly', description: 'Etapa del mantenimiento (ej. reception, disassembly, completed)' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  stage: string;
}
