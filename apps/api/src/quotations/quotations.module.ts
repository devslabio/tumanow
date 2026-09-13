import { Module } from "@nestjs/common";

import { AuditService } from "../common/audit.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { TenantAccessService } from "../tenant/tenant-access.service";
import {
  CustomerQuotationsController,
  TenantQuotationsController,
} from "./quotations.controller";
import { QuotationsService } from "./quotations.service";

@Module({
  imports: [NotificationsModule],
  controllers: [CustomerQuotationsController, TenantQuotationsController],
  providers: [QuotationsService, AuditService, TenantAccessService],
  exports: [QuotationsService],
})
export class QuotationsModule {}
