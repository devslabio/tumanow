import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { TenantAuthGuard } from "../auth/tenant-auth.guard";
import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { OperatorContextGuard } from "../auth/operator-context.guard";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { DashboardService } from "./dashboard.service";

@ApiTags("tenant-dashboard")
@ApiBearerAuth("access-token")
@UseGuards(TenantAuthGuard, OperatorContextGuard, PermissionGuard)
@Controller("tenant/dashboard")
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get("summary")
  @RequirePermissions("reports.view")
  summary(@Req() req: { user: TumaNowJwtPayload }) {
    return this.dashboard.summary(req.user);
  }

  @Get("analytics")
  @RequirePermissions("reports.view")
  analytics(
    @Req() req: { user: TumaNowJwtPayload },
    @Query("days") days?: string,
  ) {
    return this.dashboard.analytics(req.user, days);
  }
}
