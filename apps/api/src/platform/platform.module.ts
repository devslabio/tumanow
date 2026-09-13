import { Module } from "@nestjs/common";

import { AuditListService } from "../common/audit-list.service";
import { AuditService } from "../common/audit.service";
import { PlatformAuditController } from "../common/audit.controller";
import { TenantAccessService } from "../tenant/tenant-access.service";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { OperatorsController } from "./operators.controller";
import { OperatorsService } from "./operators.service";

@Module({
  controllers: [OperatorsController, DashboardController, PlatformAuditController],
  providers: [
    OperatorsService,
    DashboardService,
    AuditService,
    AuditListService,
    TenantAccessService,
  ],
})
export class PlatformModule {}
