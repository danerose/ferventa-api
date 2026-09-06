import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Customer } from '../../customers/schemas/customer.schema';
import { Vehicle } from '../../vehicles/schemas/vehicle.schema';
import { Product } from '../../inventory/schemas/product.schema';
import { User } from '../../users/schemas/user.schema';
import { Appointment } from '../../appointments/schemas/appointment.schema';
import { Branch } from '../../branches/schemas/branch.schema';
import { Sale } from '../../sales/schemas/sale.schema';

export type MaintenanceDocument = Maintenance & Document;

@Schema({ _id: false })
export class ProductUsed {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  product: Product;

  @Prop({ required: true })
  sku: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: Number })
  quantity: number;

  @Prop({ required: true, type: Number })
  costPriceSnapshot: number;

  @Prop({ required: true, type: Number })
  sellingPriceSnapshot: number;
}

@Schema({ _id: false })
export class EvidencePhoto {
  @Prop({ required: true, trim: true })
  stage: string; // e.g., 'reception', 'disassembly', 'completed'

  @Prop({ type: [String], default: [] })
  photos: string[]; // URLs or paths to uploaded photos

  @Prop({ type: Date, default: Date.now })
  uploadedAt: Date;
}

@Schema({ _id: false })
export class StatusHistoryEntry {
  @Prop({ required: true, type: String })
  status: string;

  @Prop({ type: Date, default: Date.now })
  changedAt: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
  })
  changedBy?: User | null;

  @Prop({ type: String, default: '' })
  notes?: string;
}

@Schema({ _id: false })
export class MaintenanceNoteEntry {
  @Prop({ required: true, type: String })
  note: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
  })
  createdBy?: User | null;
}

@Schema({ timestamps: true })
export class Maintenance {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true,
  })
  customer: Customer;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    index: true,
  })
  vehicle: Vehicle;

  /**
   * awaiting_appointment — cita aún no completada; el mantenimiento está en "limbo".
   * not_started          — cita completada, el vehículo está en cola de taller.
   * in_progress          — el mecánico ha iniciado el trabajo.
   * completed            — trabajo terminado, listo para entrega.
   * delivered            — vehículo entregado al cliente.
   */
  @Prop({
    required: true,
    type: String,
    enum: [
      'awaiting_appointment',
      'not_started',
      'in_progress',
      'completed',
      'delivered',
    ],
    default: 'awaiting_appointment',
    index: true,
  })
  status: string;

  /** Cita agendada que originó este mantenimiento (opcional para walk-ins). */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Appointment',
    required: false,
    default: null,
    index: true,
  })
  appointment?: Appointment | null;

  @Prop({ required: true, type: Number, default: 0 })
  laborCost: number;

  @Prop({ type: [ProductUsed], default: [] })
  itemsUsed: ProductUsed[];

  @Prop({ type: [EvidencePhoto], default: [] })
  evidencePhotos: EvidencePhoto[];

  @Prop({ type: [StatusHistoryEntry], default: [] })
  statusHistory: StatusHistoryEntry[];

  /** Notas generales o descripción de la falla */
  @Prop({ type: String, default: '' })
  notes: string;

  /** Notas de recepción (ej. "Deja llaves, 1/2 tanque de gasolina, detalles en pintura") */
  @Prop({ type: String, default: '' })
  receptionNotes?: string;

  /** Bitácora/Registro de notas de fallas y diagnósticos que se van encontrando durante el mantenimiento */
  @Prop({ type: [MaintenanceNoteEntry], default: [] })
  diagnosticNotes: MaintenanceNoteEntry[];

  /** Mecánico asignado a la orden */
  @Prop({ type: String, default: null, trim: true })
  assignedMechanic?: string | null;

  /** Venta / Ticket POS vinculado a este mantenimiento */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Sale',
    required: false,
    default: null,
    index: true,
  })
  sale?: Sale | null;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
  })
  createdBy?: User | null;

  /** Fecha de ingreso/recepción en taller */
  @Prop({ type: Date, default: Date.now, index: true })
  receptionDate: Date;

  /** Fecha en que el mecánico inició trabajo (in_progress) */
  @Prop({ type: Date, default: null, index: true })
  startedAt?: Date | null;

  /** Fecha en que se completó el servicio (completed) */
  @Prop({ type: Date, default: null, index: true })
  completedAt?: Date | null;

  /** Fecha en que se le avisó al cliente que el vehículo está listo */
  @Prop({ type: Date, default: null, index: true })
  notifiedAt?: Date | null;

  /** Fecha en que el vehículo fue retirado/entregado al cliente (delivered) */
  @Prop({ type: Date, default: null, index: true })
  deliveredAt?: Date | null;

  /** Legacy / Compatibilidad: fecha de inicio */
  @Prop({ type: Date, default: Date.now })
  startDate: Date;

  /** Legacy / Compatibilidad: fecha de término/cierre */
  @Prop({ type: Date, default: null })
  endDate: Date | null;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Branch',
    required: true,
    index: true,
  })
  branch: Branch | any;
}

export const MaintenanceSchema = SchemaFactory.createForClass(Maintenance);
