import { Module } from "@nestjs/common";

import { AuditService } from "../common/audit.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { TenantAccessService } from "../tenant/tenant-access.service";
import {
  CustomerPaymentsController,
  TenantPaymentsController,
} from "./payments.controller";
import { PaymentsService } from "./payments.service";

@Module({
  imports: [NotificationsModule],
  controllers: [CustomerPaymentsController, TenantPaymentsController],
  providers: [PaymentsService, AuditService, TenantAccessService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
