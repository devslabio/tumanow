import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { OrdersModule } from './modules/orders/orders.module';
import { OperatorsModule } from './modules/operators/operators.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { OrderAssignmentsModule } from './modules/order-assignments/order-assignments.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { TrackingEventsModule } from './modules/tracking-events/tracking-events.module';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    DashboardModule,
    OrdersModule,
    OperatorsModule,
    VehiclesModule,
    DriversModule,
    OrderAssignmentsModule,
    PaymentsModule,
    TrackingEventsModule,
    // TODO: Add more modules as we build them
    // UsersModule,
    // VehiclesModule,
    // DriversModule,
    // PaymentsModule,
    // NotificationsModule,
    // ReportsModule,
  ],
})
export class AppModule {}

