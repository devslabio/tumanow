import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
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

