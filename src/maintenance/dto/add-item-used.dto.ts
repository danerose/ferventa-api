import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class AddItemUsedDto {
  @ApiProperty({ example: '60d5ec49c6d48227b409748e', description: 'ID de la autoparte/producto usado' })
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  productId: string;

  @ApiProperty({ example: 2, description: 'Cantidad usada en el servicio' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(1, { message: i18nValidationMessage('validation.min') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  quantity: number;
}
