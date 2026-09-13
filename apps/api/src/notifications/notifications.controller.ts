import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { PermissionGuard } from "../auth/permission.guard";
import { RequireAnyPermission } from "../auth/permissions.decorator";
import { NotificationsService } from "./notifications.service";

@ApiTags("notifications")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get("me")
  @RequireAnyPermission(
    "notifications.view",
    "customer.shipments.view",
    "orders.view",
  )
  list(@Req() req: { user: TumaNowJwtPayload }) {
    return this.notifications.listForUser(req.user.sub, {
      customerId: req.user.customerId,
      operatorId: req.user.operatorId,
    });
  }

  @Post(":id/read")
  @RequireAnyPermission(
    "notifications.view",
    "customer.shipments.view",
    "orders.view",
  )
  async markRead(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("id") id: string,
  ) {
    const updated = await this.notifications.markRead(
      req.user.sub,
      id,
      req.user.customerId,
      req.user.operatorId,
    );
    if (!updated) throw new NotFoundException("Notification not found");
    return updated;
  }
}
