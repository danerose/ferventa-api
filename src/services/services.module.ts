import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { PredefinedService, PredefinedServiceSchema } from './schemas/service.schema';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PredefinedService.name, schema: PredefinedServiceSchema }]),
    forwardRef(() => InventoryModule),
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
