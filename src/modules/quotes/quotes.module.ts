import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { Quote, QuoteSchema } from './schemas/quote.schema';
import { CustomersModule } from '../customers/customers.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Quote.name, schema: QuoteSchema }]),
    CustomersModule,
    InventoryModule,
  ],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService, MongooseModule],
})
export class QuotesModule {}
