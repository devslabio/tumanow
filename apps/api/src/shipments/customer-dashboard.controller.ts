import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { ShipmentsService } from "./shipments.service";

@ApiTags("customer-dashboard")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("customer/dashboard")
export class CustomerDashboardController {
  constructor(private readonly shipments: ShipmentsService) {}

  @Get("summary")
  @RequirePermissions("customer.shipments.view")
  summary(@Req() req: { user: TumaNowJwtPayload }) {
    return this.shipments.dashboardSummary(req.user);
  }
}
