import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { SalesModule } from '../sales/sales.module';
import { InventoryModule } from '../inventory/inventory.module';
import { MaintenanceModule } from '../maintenance/maintenance.module';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [
    SalesModule,
    InventoryModule,
    MaintenanceModule,
    AppointmentsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
