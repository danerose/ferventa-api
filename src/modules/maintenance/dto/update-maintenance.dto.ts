import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateMaintenanceDto {
  @ApiPropertyOptional({
    example: 'in_progress',
    enum: [
      'awaiting_appointment',
      'not_started',
      'in_progress',
      'completed',
      'delivered',
    ],
    description:
      'Estado de la orden. awaiting_appointment = esperando que se complete la cita (solo admin puede revertir manualmente)',
  })
  @IsEnum(
    [
      'awaiting_appointment',
      'not_started',
      'in_progress',
      'completed',
      'delivered',
    ],
    {
      message: i18nValidationMessage('validation.isEnum'),
    },
  )
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    example: 1200.0,
    description: 'Costo de mano de obra',
  })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  @IsOptional()
  laborCost?: number;

  @ApiPropertyOptional({
    example: 'Se cambiaron balatas delanteras y rectificaron discos',
    description: 'Notas y comentarios generales',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    example: 'Deja llaves y 1/2 tanque de gasolina',
    description: 'Notas de recepción',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  receptionNotes?: string;

  @ApiPropertyOptional({
    example: 'Roberto Sánchez',
    description: 'Mecánico asignado',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  assignedMechanic?: string;

  @ApiPropertyOptional({
    example: '60d5ec49c6d48227b409748e',
    description: 'ID de la venta/ticket POS vinculado',
  })
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsOptional()
  saleId?: string | null;
}
