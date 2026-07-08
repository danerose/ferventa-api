import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { Sale, SaleSchema } from './schemas/sale.schema';
import { CustomersModule } from '../customers/customers.module';
import { InventoryModule } from '../inventory/inventory.module';
import { QuotesModule } from '../quotes/quotes.module';
import { MercadoPagoService } from './mercado-pago.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Sale.name, schema: SaleSchema }]),
    CustomersModule,
    InventoryModule,
    QuotesModule,
  ],
  controllers: [SalesController],
  providers: [SalesService, MercadoPagoService],
  exports: [SalesService, MongooseModule],
})
export class SalesModule {}
