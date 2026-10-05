import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { AuditService } from "../common/audit.service";
import { TenantAccessService } from "../tenant/tenant-access.service";
import { PlatformSettlementsController, TenantSettlementsController } from "./settlements.controller";
import { SettlementsService } from "./settlements.service";

@Module({
  imports: [AuthModule],
  controllers: [PlatformSettlementsController, TenantSettlementsController],
  providers: [SettlementsService, TenantAccessService, AuditService],
})
export class SettlementsModule {}
