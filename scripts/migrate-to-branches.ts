import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Branch, BranchDocument } from '../src/branches/schemas/branch.schema';
import { Customer, CustomerDocument } from '../src/customers/schemas/customer.schema';
import { Vehicle, VehicleDocument } from '../src/vehicles/schemas/vehicle.schema';
import { Appointment, AppointmentDocument } from '../src/appointments/schemas/appointment.schema';
import { WorkshopHoliday, WorkshopHolidayDocument } from '../src/appointments/schemas/workshop-holiday.schema';
import { WorkshopSchedule, WorkshopScheduleDocument } from '../src/appointments/schemas/workshop-schedule.schema';
import { Brand, BrandDocument } from '../src/inventory/schemas/brand.schema';
import { Category, CategoryDocument } from '../src/inventory/schemas/category.schema';
import { Provider, ProviderDocument } from '../src/inventory/schemas/provider.schema';
import { Product, ProductDocument } from '../src/inventory/schemas/product.schema';
import { StockMovement, StockMovementDocument } from '../src/inventory/schemas/stock-movement.schema';
import { Maintenance, MaintenanceDocument } from '../src/maintenance/schemas/maintenance.schema';
import { Quote, QuoteDocument } from '../src/quotes/schemas/quote.schema';
import { Sale, SaleDocument } from '../src/sales/schemas/sale.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const branchModel = app.get<Model<BranchDocument>>('BranchModel');
  const customerModel = app.get<Model<CustomerDocument>>('CustomerModel');
  const vehicleModel = app.get<Model<VehicleDocument>>('VehicleModel');
  const appointmentModel = app.get<Model<AppointmentDocument>>('AppointmentModel');
  const workshopHolidayModel = app.get<Model<WorkshopHolidayDocument>>('WorkshopHolidayModel');
  const workshopScheduleModel = app.get<Model<WorkshopScheduleDocument>>('WorkshopScheduleModel');
  
  const brandModel = app.get<Model<BrandDocument>>('BrandModel');
  const categoryModel = app.get<Model<CategoryDocument>>('CategoryModel');
  const providerModel = app.get<Model<ProviderDocument>>('ProviderModel');
  const productModel = app.get<Model<ProductDocument>>('ProductModel');
  const stockMovementModel = app.get<Model<StockMovementDocument>>('StockMovementModel');
  
  const maintenanceModel = app.get<Model<MaintenanceDocument>>('MaintenanceModel');
  const quoteModel = app.get<Model<QuoteDocument>>('QuoteModel');
  const saleModel = app.get<Model<SaleDocument>>('SaleModel');

  console.log('Starting migration script...');

  // 1. Create or find default branch
  let defaultBranch = await branchModel.findOne({ name: 'Nova FV Sucursal Uman' });
  if (!defaultBranch) {
    console.log('Creating default branch: Nova FV Sucursal Uman');
    defaultBranch = new branchModel({
      name: 'Nova FV Sucursal Uman',
      address: 'Dirección por defecto',
      phone: '0000000000',
      isActive: true,
    });
    await defaultBranch.save();
  } else {
    console.log('Default branch already exists.');
  }

  const branchId = defaultBranch._id;

  // 2. Migrate collections
  const collections = [
    { name: 'Customers', model: customerModel },
    { name: 'Vehicles', model: vehicleModel },
    { name: 'Appointments', model: appointmentModel },
    { name: 'WorkshopHolidays', model: workshopHolidayModel },
    { name: 'WorkshopSchedules', model: workshopScheduleModel },
    { name: 'Brands', model: brandModel },
    { name: 'Categories', model: categoryModel },
    { name: 'Providers', model: providerModel },
    { name: 'Products', model: productModel },
    { name: 'StockMovements', model: stockMovementModel },
    { name: 'Maintenances', model: maintenanceModel },
    { name: 'Quotes', model: quoteModel },
    { name: 'Sales', model: saleModel },
  ];

  for (const collection of collections) {
    const model = collection.model as Model<any>;
    const result = await model.updateMany(
      { branch: { $exists: false } },
      { $set: { branch: branchId } }
    );
    console.log(`Migrated ${result.modifiedCount} records in ${collection.name}`);
  }

  console.log('Migration completed successfully.');
  await app.close();
}

bootstrap().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
