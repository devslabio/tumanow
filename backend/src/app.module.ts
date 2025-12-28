import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
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
    // TODO: Add more modules as we build them
    // OperatorsModule,
    // UsersModule,
    // OrdersModule,
    // VehiclesModule,
    // DriversModule,
    // PaymentsModule,
    // NotificationsModule,
    // ReportsModule,
  ],
})
export class AppModule {}

