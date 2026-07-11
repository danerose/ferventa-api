import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { Appointment, AppointmentSchema } from './schemas/appointment.schema';
import { WorkshopSchedule, WorkshopScheduleSchema } from './schemas/workshop-schedule.schema';
import { WorkshopHoliday, WorkshopHolidaySchema } from './schemas/workshop-holiday.schema';
import { CustomersModule } from '../customers/customers.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { WhatsAppService } from './whatsapp.service';
import { MaintenanceModule } from '../maintenance/maintenance.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: WorkshopSchedule.name, schema: WorkshopScheduleSchema },
      { name: WorkshopHoliday.name, schema: WorkshopHolidaySchema },
    ]),
    CustomersModule,
    VehiclesModule,
    forwardRef(() => MaintenanceModule),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, WhatsAppService],
  exports: [AppointmentsService, WhatsAppService, MongooseModule],
})
export class AppointmentsModule {}
