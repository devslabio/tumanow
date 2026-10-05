import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { DashboardService } from "./dashboard.service";

@ApiTags("platform-dashboard")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("platform/dashboard")
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get("summary")
  @RequirePermissions("platform.dashboard.view")
  summary() {
    return this.dashboard.summary();
  }

  @Get("analytics")
  @RequirePermissions("platform.dashboard.view")
  analytics(@Query("days") days?: string) {
    return this.dashboard.analytics(days);
  }
}
