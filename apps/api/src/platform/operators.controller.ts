import { Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { OperatorsService } from "./operators.service";

@ApiTags("platform-operators")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("platform/operators")
export class OperatorsController {
  constructor(private readonly operators: OperatorsService) {}

  @Get()
  @RequirePermissions("platform.operator.view")
  list() {
    return this.operators.list();
  }

  @Get(":id")
  @RequirePermissions("platform.operator.view")
  get(@Param("id") id: string) {
    return this.operators.get(id);
  }

  @Post(":id/approve")
  @RequirePermissions("platform.operator.approve")
  approve(@Req() req: { user: TumaNowJwtPayload }, @Param("id") id: string) {
    return this.operators.approve(req.user.sub, id);
  }
}
