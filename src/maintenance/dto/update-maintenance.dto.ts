import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateMaintenanceDto {
  @ApiPropertyOptional({
    example: 'in_progress',
    enum: ['awaiting_appointment', 'not_started', 'in_progress', 'completed', 'delivered'],
    description: 'Estado de la orden. awaiting_appointment = esperando que se complete la cita (solo admin puede revertir manualmente)',
  })
  @IsEnum(['awaiting_appointment', 'not_started', 'in_progress', 'completed', 'delivered'], {
    message: i18nValidationMessage('validation.isEnum'),
  })
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 1200.0, description: 'Costo de mano de obra' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  @IsOptional()
  laborCost?: number;

  @ApiPropertyOptional({ example: 'Se cambiaron balatas delanteras y rectificaron discos', description: 'Notas y comentarios' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  notes?: string;
}
