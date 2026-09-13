import { Module } from "@nestjs/common";

import { AuditListService } from "../common/audit-list.service";
import { AuditService } from "../common/audit.service";
import { TenantAuditController } from "../common/audit.controller";
import { NotificationsModule } from "../notifications/notifications.module";
import { BranchesController } from "./branches.controller";
import { BranchesService } from "./branches.service";
import { CoverageController } from "./coverage.controller";
import { CoverageService } from "./coverage.service";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { DriversController } from "./drivers.controller";
import { DriversService } from "./drivers.service";
import { PackageTypesController } from "./package-types.controller";
import { PackageTypesService } from "./package-types.service";
import { PricingController } from "./pricing.controller";
import { PricingService } from "./pricing.service";
import { ShipmentsTenantController } from "./shipments.controller";
import { ShipmentsTenantService } from "./shipments.service";
import { TenantAccessService } from "./tenant-access.service";
import { VehiclesController } from "./vehicles.controller";
import { VehiclesService } from "./vehicles.service";

@Module({
  imports: [NotificationsModule],
  controllers: [
    BranchesController,
    DashboardController,
    ShipmentsTenantController,
    PackageTypesController,
    CoverageController,
    PricingController,
    DriversController,
    VehiclesController,
    TenantAuditController,
  ],
  providers: [
    TenantAccessService,
    AuditService,
    AuditListService,
    BranchesService,
    DashboardService,
    ShipmentsTenantService,
    PackageTypesService,
    CoverageService,
    PricingService,
    DriversService,
    VehiclesService,
  ],
  exports: [TenantAccessService],
})
export class TenantModule {}
