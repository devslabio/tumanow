import { Module } from "@nestjs/common";

import { AuditService } from "../common/audit.service";
import { CorporateModule } from "../corporate/corporate.module";
import { IntegrationsModule } from "../integrations/integrations.module";
import { MatchingModule } from "../matching/matching.module";
import { CustomerDashboardController } from "./customer-dashboard.controller";
import { ShipmentsController } from "./shipments.controller";
import { ShipmentsService } from "./shipments.service";

@Module({
  imports: [MatchingModule, IntegrationsModule, CorporateModule],
  controllers: [ShipmentsController, CustomerDashboardController],
  providers: [ShipmentsService, AuditService],
})
export class ShipmentsModule {}
