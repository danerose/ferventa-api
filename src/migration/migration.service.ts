import { Injectable, Logger } from '@nestjs/common';
import { AppointmentsService } from '../appointments/appointments.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Branch, BranchDocument } from '../branches/schemas/branch.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Customer, CustomerDocument } from '../customers/schemas/customer.schema';
import { Vehicle, VehicleDocument } from '../vehicles/schemas/vehicle.schema';
import { Appointment, AppointmentDocument } from '../appointments/schemas/appointment.schema';
import { WorkshopHoliday, WorkshopHolidayDocument } from '../appointments/schemas/workshop-holiday.schema';
import { WorkshopSchedule, WorkshopScheduleDocument } from '../appointments/schemas/workshop-schedule.schema';
import { Brand, BrandDocument } from '../inventory/schemas/brand.schema';
import { Category, CategoryDocument } from '../inventory/schemas/category.schema';
import { Provider, ProviderDocument } from '../inventory/schemas/provider.schema';
import { Product, ProductDocument } from '../inventory/schemas/product.schema';
import { StockMovement, StockMovementDocument } from '../inventory/schemas/stock-movement.schema';
import { Maintenance, MaintenanceDocument } from '../maintenance/schemas/maintenance.schema';
import { Quote, QuoteDocument } from '../quotes/schemas/quote.schema';
import { Sale, SaleDocument } from '../sales/schemas/sale.schema';
import { Role, RoleDocument } from '../users/schemas/role.schema';
import { UsersService } from '../users/users.service';
import { Inject, forwardRef } from '@nestjs/common';

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Vehicle.name) private vehicleModel: Model<VehicleDocument>,
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(WorkshopHoliday.name) private workshopHolidayModel: Model<WorkshopHolidayDocument>,
    @InjectModel(WorkshopSchedule.name) private workshopScheduleModel: Model<WorkshopScheduleDocument>,
    @InjectModel(Brand.name) private brandModel: Model<BrandDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Provider.name) private providerModel: Model<ProviderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(StockMovement.name) private stockMovementModel: Model<StockMovementDocument>,
    @InjectModel(Maintenance.name) private maintenanceModel: Model<MaintenanceDocument>,
    @InjectModel(Quote.name) private quoteModel: Model<QuoteDocument>,
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
    private readonly appointmentsService: AppointmentsService,
    @Inject(forwardRef(() => UsersService)) private readonly usersService: UsersService,
  ) {}

  async migrateToBranches() {
    this.logger.log('Starting migration to branches...');

    // 1. Create or find default branch
    let defaultBranch = await this.branchModel.findOne({ name: 'Nova FV Sucursal Uman' });
    if (!defaultBranch) {
      this.logger.log('Creating default branch: Nova FV Sucursal Uman');
      defaultBranch = new this.branchModel({
        name: 'Nova FV Sucursal Uman',
        address: 'Dirección por defecto',
        phone: '0000000000',
        isActive: true,
      });
      await defaultBranch.save();
    } else {
      this.logger.log('Default branch already exists.');
    }

    const branchId = defaultBranch._id;

    // 1.5. Clean up old unique indexes that cause Multi-Branch issues
    try {
      await this.workshopScheduleModel.collection.dropIndex('dayOfWeek_1');
      this.logger.log('Dropped old global unique index for dayOfWeek');
    } catch (e) {
      // Ignore if index doesn't exist
    }
    try {
      await this.workshopHolidayModel.collection.dropIndex('date_1');
      this.logger.log('Dropped old global unique index for date');
    } catch (e) {
      // Ignore if index doesn't exist
    }

    // 2. Assign this branch to the initial admin (and all admins without a branch)
    const adminRole = await this.roleModel.findOne({ name: 'admin' });
    if (adminRole) {
      const admins = await this.userModel.find({ role: adminRole._id as any });
      for (const admin of admins) {
        const branches = admin.branches || [];
        // Only assign if it doesn't already have it (idempotency)
        if (!branches.some((id) => id.toString() === branchId.toString())) {
          branches.push(branchId.toString() as any);
          await this.userModel.updateOne(
            { _id: admin._id },
            { $set: { branches } }
          );
          this.logger.log(`Assigned default branch to admin user: ${admin.email}`);
        }
      }
    }

    // 3. Migrate collections
    const collections = [
      { name: 'Customers', model: this.customerModel },
      { name: 'Vehicles', model: this.vehicleModel },
      { name: 'Appointments', model: this.appointmentModel },
      { name: 'WorkshopHolidays', model: this.workshopHolidayModel },
      { name: 'WorkshopSchedules', model: this.workshopScheduleModel },
      { name: 'Brands', model: this.brandModel },
      { name: 'Categories', model: this.categoryModel },
      { name: 'Providers', model: this.providerModel },
      { name: 'Products', model: this.productModel },
      { name: 'StockMovements', model: this.stockMovementModel },
      { name: 'Maintenances', model: this.maintenanceModel },
      { name: 'Quotes', model: this.quoteModel },
      { name: 'Sales', model: this.saleModel },
    ];

    const results = {};

    for (const collection of collections) {
      const model = collection.model as Model<any>;
      const result = await model.updateMany(
        { branch: { $exists: false } },
        { $set: { branch: branchId } }
      );
      results[collection.name] = result.modifiedCount;
      this.logger.log(`Migrated ${result.modifiedCount} records in ${collection.name}`);
    }

    // 4. Create default schedules if they don't exist
    await this.appointmentsService.createDefaultScheduleForBranch(branchId.toString());

    this.logger.log('Migration completed successfully.');

    return {
      success: true,
      message: 'Migración ejecutada exitosamente',
      data: {
        defaultBranchId: branchId,
        migratedRecords: results,
      },
    };
  }

  async migrateUsernames() {
    return this.usersService.migrateUsernames();
  }
}
