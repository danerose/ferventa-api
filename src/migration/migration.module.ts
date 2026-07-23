import { Module, forwardRef } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module';
import { UsersModule } from '../users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MigrationController } from './migration.controller';
import { MigrationService } from './migration.service';

// Import all schemas
import { Branch, BranchSchema } from '../branches/schemas/branch.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Role, RoleSchema } from '../users/schemas/role.schema';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import { Vehicle, VehicleSchema } from '../vehicles/schemas/vehicle.schema';
import { Appointment, AppointmentSchema } from '../appointments/schemas/appointment.schema';
import { WorkshopHoliday, WorkshopHolidaySchema } from '../appointments/schemas/workshop-holiday.schema';
import { WorkshopSchedule, WorkshopScheduleSchema } from '../appointments/schemas/workshop-schedule.schema';
import { Brand, BrandSchema } from '../inventory/schemas/brand.schema';
import { Category, CategorySchema } from '../inventory/schemas/category.schema';
import { Provider, ProviderSchema } from '../inventory/schemas/provider.schema';
import { Product, ProductSchema } from '../inventory/schemas/product.schema';
import { StockMovement, StockMovementSchema } from '../inventory/schemas/stock-movement.schema';
import { Maintenance, MaintenanceSchema } from '../maintenance/schemas/maintenance.schema';
import { Quote, QuoteSchema } from '../quotes/schemas/quote.schema';
import { Sale, SaleSchema } from '../sales/schemas/sale.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Branch.name, schema: BranchSchema },
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Vehicle.name, schema: VehicleSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: WorkshopHoliday.name, schema: WorkshopHolidaySchema },
      { name: WorkshopSchedule.name, schema: WorkshopScheduleSchema },
      { name: Brand.name, schema: BrandSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Provider.name, schema: ProviderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: StockMovement.name, schema: StockMovementSchema },
      { name: Maintenance.name, schema: MaintenanceSchema },
      { name: Quote.name, schema: QuoteSchema },
      { name: Sale.name, schema: SaleSchema },
    ]),
    forwardRef(() => AppointmentsModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [MigrationController],
  providers: [MigrationService],
})
export class MigrationModule {}
