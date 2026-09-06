import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import * as path from 'path';
import { I18nModule, AcceptLanguageResolver } from 'nestjs-i18n';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { AuthModule } from './modules/auth/auth.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CustomersModule } from './modules/customers/customers.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { SalesModule } from './modules/sales/sales.module';
import { ReportsModule } from './modules/reports/reports.module';
import { BranchesModule } from './modules/branches/branches.module';
import { MigrationModule } from './scripts/migration/migration.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { ServicesModule } from './modules/services/services.module';
import { OrdersModule } from './modules/orders/orders.module';

@Module({
  imports: [
    // Global Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.ENV_FILE || '.env',
    }),

    // MongoDB connection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),

    // i18n
    I18nModule.forRoot({
      fallbackLanguage: 'es',
      loaderOptions: {
        path: path.join(__dirname, '/common/i18n/'),
        watch: true,
      },
      resolvers: [AcceptLanguageResolver],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLER_TTL', 60000),
          limit: config.get<number>('THROTTLER_LIMIT', 100),
        },
      ],
    }),

    // Feature Modules
    UsersModule,
    SessionsModule,
    AuthModule,
    InventoryModule,
    CustomersModule,
    VehiclesModule,
    AppointmentsModule,
    MaintenanceModule,
    QuotesModule,
    SalesModule,
    ReportsModule,
    BranchesModule,
    MigrationModule,
    AttendanceModule,
    ServicesModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
