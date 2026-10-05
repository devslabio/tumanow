import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { TenantAuthGuard } from "../auth/tenant-auth.guard";
import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { OperatorContextGuard } from "../auth/operator-context.guard";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { AuditListService } from "../common/audit-list.service";

class AuditQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  take?: number;
}

@ApiTags("platform-audit")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("platform/audit")
export class PlatformAuditController {
  constructor(private readonly auditList: AuditListService) {}

  @Get()
  @RequirePermissions("platform.audit.view")
  list(@Query() query: AuditQueryDto) {
    return this.auditList.listPlatform(query.take ?? 100);
  }
}

@ApiTags("tenant-audit")
@ApiBearerAuth("access-token")
@UseGuards(TenantAuthGuard, OperatorContextGuard, PermissionGuard)
@Controller("tenant/audit")
export class TenantAuditController {
  constructor(private readonly auditList: AuditListService) {}

  @Get()
  @RequirePermissions("audit.view")
  list(
    @Req() req: { user: TumaNowJwtPayload },
    @Query() query: AuditQueryDto,
  ) {
    return this.auditList.listTenant(req.user, query.take ?? 100);
  }
}
