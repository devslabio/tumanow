import { Module } from "@nestjs/common";

import { AuditService } from "../common/audit.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { TenantAccessService } from "../tenant/tenant-access.service";
import {
  CustomerReturnsController,
  TenantReturnsController,
} from "./returns.controller";
import { ReturnsService } from "./returns.service";

@Module({
  imports: [NotificationsModule],
  controllers: [CustomerReturnsController, TenantReturnsController],
  providers: [ReturnsService, AuditService, TenantAccessService],
  exports: [ReturnsService],
})
export class ReturnsModule {}
