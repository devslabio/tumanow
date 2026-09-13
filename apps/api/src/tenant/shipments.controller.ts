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
import { ShipmentStatus } from "@prisma/client";
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { OperatorContextGuard } from "../auth/operator-context.guard";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { ShipmentsTenantService } from "./shipments.service";

class RejectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

class AssignDto {
  @ApiProperty()
  @IsUUID()
  driverId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vehicleId?: string;
}

class UpdateStatusDto {
  @ApiProperty({ enum: ShipmentStatus })
  @IsEnum(ShipmentStatus)
  status!: ShipmentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  failureReason?: string;
}

class VerifyPodDto {
  @ApiProperty()
  @IsString()
  otp!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recipientName?: string;
}

class CollectCodDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

class SettleCodDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

@ApiTags("tenant-shipments")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, OperatorContextGuard, PermissionGuard)
@Controller("tenant/shipments")
export class ShipmentsTenantController {
  constructor(private readonly shipments: ShipmentsTenantService) {}

  @Get()
  @RequirePermissions("orders.view")
  list(@Req() req: { user: TumaNowJwtPayload }) {
    return this.shipments.list(req.user);
  }

  @Get(":id")
  @RequirePermissions("orders.view")
  get(@Req() req: { user: TumaNowJwtPayload }, @Param("id") id: string) {
    return this.shipments.get(req.user, id);
  }

  @Post(":id/approve")
  @RequirePermissions("orders.approve")
  approve(@Req() req: { user: TumaNowJwtPayload }, @Param("id") id: string) {
    return this.shipments.approve(req.user, id);
  }

  @Post(":id/reject")
  @RequirePermissions("orders.reject")
  reject(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("id") id: string,
    @Body() dto: RejectDto,
  ) {
    return this.shipments.reject(req.user, id, dto.note);
  }

  @Post(":id/assign")
  @RequirePermissions("orders.assign")
  assign(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("id") id: string,
    @Body() dto: AssignDto,
  ) {
    return this.shipments.assign(req.user, id, dto.driverId, dto.vehicleId);
  }

  @Post(":id/status")
  @RequirePermissions("orders.update_status")
  updateStatus(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("id") id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.shipments.updateStatus(
      req.user,
      id,
      dto.status,
      dto.note,
      dto.failureReason,
    );
  }

  @Post(":id/pod/generate")
  @RequirePermissions("orders.update_status")
  generatePod(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("id") id: string,
  ) {
    return this.shipments.generatePod(req.user, id);
  }

  @Post(":id/pod/verify")
  @RequirePermissions("orders.update_status")
  verifyPod(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("id") id: string,
    @Body() dto: VerifyPodDto,
  ) {
    return this.shipments.verifyPod(req.user, id, dto.otp, dto.recipientName);
  }

  @Post(":id/cod/collect")
  @RequirePermissions("orders.update_status")
  collectCod(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("id") id: string,
    @Body() dto: CollectCodDto,
  ) {
    return this.shipments.collectCod(req.user, id, dto.amount, dto.note);
  }

  @Post(":id/cod/settle")
  @RequirePermissions("payments.manage")
  settleCod(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("id") id: string,
    @Body() dto: SettleCodDto,
  ) {
    return this.shipments.settleCod(req.user, id, dto.note);
  }
}
