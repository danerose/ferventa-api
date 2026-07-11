import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateMaintenanceDto {
  @ApiProperty({ example: '60d5ec49c6d48227b409748b', description: 'ID del cliente propietario' })
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  customerId: string;

  @ApiProperty({ example: '60d5ec49c6d48227b409748c', description: 'ID del vehículo' })
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  vehicleId: string;

  @ApiPropertyOptional({ example: 800.0, description: 'Costo inicial de mano de obra estimado' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  @IsOptional()
  laborCost?: number;

  @ApiPropertyOptional({ example: 'Diagnóstico por ruido en balatas delanteras', description: 'Notas iniciales' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: '60d5ec49c6d48227b409748d', description: 'ID de la cita agendada que origina este mantenimiento (opcional para walk-ins)' })
  @IsMongoId({ message: i18nValidationMessage('validation.isMongoId') })
  @IsOptional()
  appointmentId?: string;
}
