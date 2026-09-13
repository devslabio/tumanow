import { Module } from "@nestjs/common";

import { AuthModule } from "./auth/auth.module";
import { HealthController } from "./health/health.controller";
import { MatchingModule } from "./matching/matching.module";
import { MessagingModule } from "./messaging/messaging.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PaymentsModule } from "./payments/payments.module";
import { PlatformModule } from "./platform/platform.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PublicModule } from "./public/public.module";
import { QuotationsModule } from "./quotations/quotations.module";
import { ReturnsModule } from "./returns/returns.module";
import { RiderModule } from "./rider/rider.module";
import { ShipmentsModule } from "./shipments/shipments.module";
import { TenantModule } from "./tenant/tenant.module";
import { TrackingModule } from "./tracking/tracking.module";

@Module({
  imports: [
    PrismaModule,
    MessagingModule,
    AuthModule,
    PlatformModule,
    TenantModule,
    ShipmentsModule,
    TrackingModule,
    PublicModule,
    MatchingModule,
    PaymentsModule,
    QuotationsModule,
    ReturnsModule,
    NotificationsModule,
    RiderModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
