import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID } from "class-validator";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { TenantAuthGuard } from "../auth/tenant-auth.guard";
import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { OperatorContextGuard } from "../auth/operator-context.guard";
import { PermissionGuard } from "../auth/permission.guard";
import {
  RequireAnyPermission,
  RequirePermissions,
} from "../auth/permissions.decorator";
import { ReturnsService } from "./returns.service";

class InitiateReturnDto {
  @ApiProperty()
  @IsUUID()
  shipmentId!: string;

  @ApiProperty()
  @IsString()
  reason!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

@ApiTags("customer-returns")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("customer/returns")
export class CustomerReturnsController {
  constructor(private readonly returns: ReturnsService) {}

  @Get()
  @RequireAnyPermission("customer.shipments.create", "customer.shipments.view")
  list(@Req() req: { user: TumaNowJwtPayload }) {
    return this.returns.listForCustomer(req.user);
  }

  @Post()
  @RequireAnyPermission("customer.shipments.create", "customer.shipments.view")
  initiate(
    @Req() req: { user: TumaNowJwtPayload },
    @Body() dto: InitiateReturnDto,
  ) {
    return this.returns.initiate(
      req.user,
      dto.shipmentId,
      dto.reason,
      dto.notes,
    );
  }
}

@ApiTags("tenant-returns")
@ApiBearerAuth("access-token")
@UseGuards(TenantAuthGuard, OperatorContextGuard, PermissionGuard)
@Controller("tenant/returns")
export class TenantReturnsController {
  constructor(private readonly returns: ReturnsService) {}

  @Get()
  @RequirePermissions("orders.view")
  list(@Req() req: { user: TumaNowJwtPayload }) {
    return this.returns.listForOperator(req.user);
  }

  @Post()
  @RequirePermissions("orders.update_status")
  initiate(
    @Req() req: { user: TumaNowJwtPayload },
    @Body() dto: InitiateReturnDto,
  ) {
    return this.returns.initiate(
      req.user,
      dto.shipmentId,
      dto.reason,
      dto.notes,
    );
  }

  @Post(":id/approve")
  @RequirePermissions("orders.update_status")
  approve(@Req() req: { user: TumaNowJwtPayload }, @Param("id") id: string) {
    return this.returns.approve(req.user, id);
  }
}
