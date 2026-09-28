import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { CommissionType } from "@prisma/client";
import { IsEnum, IsNumber, IsOptional, Max, Min } from "class-validator";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { OperatorsService } from "./operators.service";

class UpdateCommissionDto {
  @ApiProperty({ enum: CommissionType })
  @IsEnum(CommissionType)
  commissionType!: CommissionType;

  @ApiPropertyOptional({ description: "Required for PERCENTAGE/HYBRID", example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPercent?: number;

  @ApiPropertyOptional({ description: "Required for FIXED/HYBRID", example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionFixedFee?: number;
}

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

  @Post(":id/reject")
  @RequirePermissions("platform.operator.approve")
  reject(@Req() req: { user: TumaNowJwtPayload }, @Param("id") id: string) {
    return this.operators.reject(req.user.sub, id);
  }

  @Post(":id/suspend")
  @RequirePermissions("platform.operator.suspend")
  suspend(@Req() req: { user: TumaNowJwtPayload }, @Param("id") id: string) {
    return this.operators.suspend(req.user.sub, id);
  }

  @Post(":id/reactivate")
  @RequirePermissions("platform.operator.suspend")
  reactivate(@Req() req: { user: TumaNowJwtPayload }, @Param("id") id: string) {
    return this.operators.reactivate(req.user.sub, id);
  }

  @Patch(":id/commission")
  @RequirePermissions("platform.operator.update")
  updateCommission(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("id") id: string,
    @Body() dto: UpdateCommissionDto,
  ) {
    return this.operators.updateCommission(req.user.sub, id, dto);
  }
}
