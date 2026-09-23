import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { AuditService } from "../common/audit.service";
import { IntegrationsModule } from "../integrations/integrations.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { TenantAccessService } from "../tenant/tenant-access.service";
import {
  CustomerPaymentsController,
  TenantPaymentsController,
} from "./payments.controller";
import { PaymentsService } from "./payments.service";

@Module({
  imports: [AuthModule, NotificationsModule, IntegrationsModule],
  controllers: [CustomerPaymentsController, TenantPaymentsController],
  providers: [PaymentsService, AuditService, TenantAccessService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
