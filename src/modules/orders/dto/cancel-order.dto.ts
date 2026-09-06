import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CancelOrderDto {
  @ApiProperty({
    example: 'Proveedor descontinuó el modelo solicitado',
    description: 'Motivo de cancelación del pedido',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  reason: string;
}
