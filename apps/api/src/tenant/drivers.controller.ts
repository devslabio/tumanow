import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { DriverStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";

import { TenantAuthGuard } from "../auth/tenant-auth.guard";
import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { OperatorContextGuard } from "../auth/operator-context.guard";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { DriversService } from "./drivers.service";

class CreateDriverDto {
  @ApiProperty()
  @IsString()
  fullName!: string;

  @ApiProperty()
  @IsString()
  phone!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional({ enum: DriverStatus })
  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;
}

class UpdateDriverDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: "Pass null to unassign" })
  @IsOptional()
  @IsUUID()
  vehicleId?: string | null;

  @ApiPropertyOptional({ enum: DriverStatus })
  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;
}

class SetDriverStatusDto {
  @ApiProperty({ enum: DriverStatus })
  @IsEnum(DriverStatus)
  status!: DriverStatus;
}

class AssignVehicleDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  vehicleId?: string | null;
}

@ApiTags("tenant-drivers")
@ApiBearerAuth("access-token")
@UseGuards(TenantAuthGuard, OperatorContextGuard, PermissionGuard)
@Controller("tenant/drivers")
export class DriversController {
  constructor(private readonly drivers: DriversService) {}

  @Get()
  @RequirePermissions("drivers.view")
  list(@Req() req: { user: TumaNowJwtPayload }) {
    return this.drivers.list(req.user);
  }

  @Post()
  @RequirePermissions("drivers.manage")
  create(
    @Req() req: { user: TumaNowJwtPayload },
    @Body() dto: CreateDriverDto,
  ) {
    return this.drivers.create(req.user, dto);
  }

  @Patch(":id")
  @RequirePermissions("drivers.manage")
  update(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("id") id: string,
    @Body() dto: UpdateDriverDto,
  ) {
    return this.drivers.update(req.user, id, dto);
  }

  @Post(":id/status")
  @RequirePermissions("drivers.manage")
  setStatus(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("id") id: string,
    @Body() dto: SetDriverStatusDto,
  ) {
    return this.drivers.setStatus(req.user, id, dto.status);
  }

  @Post(":id/vehicle")
  @RequirePermissions("drivers.manage")
  assignVehicle(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("id") id: string,
    @Body() dto: AssignVehicleDto,
  ) {
    return this.drivers.assignVehicle(req.user, id, dto.vehicleId ?? null);
  }
}
