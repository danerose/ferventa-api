import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { OrderStatus } from '../schemas/order.schema';

export class UpdateOrderStatusDto {
  @ApiProperty({
    example: OrderStatus.IN_TRANSIT,
    enum: OrderStatus,
    description:
      'Nuevo estado del pedido: order_placed, ordered, in_transit, in_branch, ready_for_pickup, delivered, cancelled',
  })
  @IsEnum(OrderStatus, { message: i18nValidationMessage('validation.isEnum') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  status: OrderStatus;

  @ApiPropertyOptional({
    example: 'Pieza recibida en sucursal central',
    description: 'Nota sobre el cambio de estado',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  notes?: string;
}
