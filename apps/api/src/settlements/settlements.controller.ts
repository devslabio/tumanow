import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiProperty, ApiTags } from "@nestjs/swagger";
import { IsISO8601, IsUUID } from "class-validator";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { OperatorContextGuard } from "../auth/operator-context.guard";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { TenantAuthGuard } from "../auth/tenant-auth.guard";
import { SettlementsService } from "./settlements.service";

class GenerateSettlementDto {
  @ApiProperty()
  @IsUUID()
  operatorId!: string;

  @ApiProperty({ description: "ISO 8601 date" })
  @IsISO8601()
  periodStart!: string;

  @ApiProperty({ description: "ISO 8601 date" })
  @IsISO8601()
  periodEnd!: string;
}

@ApiTags("platform-settlements")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("platform/settlements")
export class PlatformSettlementsController {
  constructor(private readonly settlements: SettlementsService) {}

  @Get()
  @RequirePermissions("platform.settlements.manage")
  list() {
    return this.settlements.listForPlatform();
  }

  @Get(":id")
  @RequirePermissions("platform.settlements.manage")
  get(@Param("id") id: string) {
    return this.settlements.getForPlatform(id);
  }

  @Post()
  @RequirePermissions("platform.settlements.manage")
  generate(@Req() req: { user: TumaNowJwtPayload }, @Body() dto: GenerateSettlementDto) {
    return this.settlements.generate(
      req.user.sub,
      dto.operatorId,
      new Date(dto.periodStart),
      new Date(dto.periodEnd),
    );
  }

  @Post(":id/pay")
  @RequirePermissions("platform.settlements.manage")
  markPaid(@Req() req: { user: TumaNowJwtPayload }, @Param("id") id: string) {
    return this.settlements.markPaid(req.user.sub, id);
  }

  @Post(":id/void")
  @RequirePermissions("platform.settlements.manage")
  voidSettlement(@Req() req: { user: TumaNowJwtPayload }, @Param("id") id: string) {
    return this.settlements.voidSettlement(req.user.sub, id);
  }
}

@ApiTags("tenant-settlements")
@ApiBearerAuth("access-token")
@UseGuards(TenantAuthGuard, OperatorContextGuard, PermissionGuard)
@Controller("tenant/settlements")
export class TenantSettlementsController {
  constructor(private readonly settlements: SettlementsService) {}

  @Get()
  @RequirePermissions("settlements.view")
  list(@Req() req: { user: TumaNowJwtPayload }) {
    return this.settlements.listForOperator(req.user);
  }

  @Get(":id")
  @RequirePermissions("settlements.view")
  get(@Req() req: { user: TumaNowJwtPayload }, @Param("id") id: string) {
    return this.settlements.getForOperator(req.user, id);
  }
}
