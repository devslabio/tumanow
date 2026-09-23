import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { AuditService } from "../common/audit.service";
import { IntegrationsModule } from "../integrations/integrations.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { TenantAccessService } from "../tenant/tenant-access.service";
import {
  CustomerQuotationsController,
  TenantQuotationsController,
} from "./quotations.controller";
import { QuotationsService } from "./quotations.service";

@Module({
  imports: [AuthModule, NotificationsModule, IntegrationsModule],
  controllers: [CustomerQuotationsController, TenantQuotationsController],
  providers: [QuotationsService, AuditService, TenantAccessService],
  exports: [QuotationsService],
})
export class QuotationsModule {}
