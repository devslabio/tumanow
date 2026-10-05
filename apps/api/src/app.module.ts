import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { AuthModule } from "./auth/auth.module";
import { CorporateModule } from "./corporate/corporate.module";
import { HealthController } from "./health/health.controller";
import { IntegrationsModule } from "./integrations/integrations.module";
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
import { SettlementsModule } from "./settlements/settlements.module";
import { ShipmentsModule } from "./shipments/shipments.module";
import { TenantModule } from "./tenant/tenant.module";
import { TrackingModule } from "./tracking/tracking.module";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      // Generous default so dashboards/polling aren't affected; tighter
      // limits (e.g. login) are set per-route with @Throttle().
      { name: "default", ttl: 60_000, limit: 120 },
    ]),
    PrismaModule,
    MessagingModule,
    AuthModule,
    IntegrationsModule,
    CorporateModule,
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
    SettlementsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
