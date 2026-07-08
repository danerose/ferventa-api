import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CancelSaleDto {
  @ApiProperty({ example: 'Cliente solicitó devolución de la pieza', description: 'Motivo de la cancelación' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  reason: string;
}
