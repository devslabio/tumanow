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
import {
  ApiBearerAuth,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from "@nestjs/swagger";
import { VehicleStatus, VehicleType } from "@prisma/client";
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { OperatorContextGuard } from "../auth/operator-context.guard";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { VehiclesService } from "./vehicles.service";

class CreateVehicleDto {
  @ApiProperty()
  @IsString()
  registrationNo!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  type?: VehicleType;

  @ApiPropertyOptional({ enum: VehicleStatus })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxWeightKg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxVolumeM3?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateVehicleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  registrationNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  type?: VehicleType;

  @ApiPropertyOptional({ enum: VehicleStatus })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxWeightKg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxVolumeM3?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class SetVehicleStatusDto {
  @ApiProperty({ enum: VehicleStatus })
  @IsEnum(VehicleStatus)
  status!: VehicleStatus;
}

@ApiTags("tenant-vehicles")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, OperatorContextGuard, PermissionGuard)
@Controller("tenant/vehicles")
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  @Get()
  @RequirePermissions("fleet.view")
  list(@Req() req: { user: TumaNowJwtPayload }) {
    return this.vehicles.list(req.user);
  }

  @Post()
  @RequirePermissions("fleet.manage")
  create(
    @Req() req: { user: TumaNowJwtPayload },
    @Body() dto: CreateVehicleDto,
  ) {
    return this.vehicles.create(req.user, dto);
  }

  @Patch(":id")
  @RequirePermissions("fleet.manage")
  update(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("id") id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehicles.update(req.user, id, dto);
  }

  @Post(":id/status")
  @RequirePermissions("fleet.manage")
  setStatus(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("id") id: string,
    @Body() dto: SetVehicleStatusDto,
  ) {
    return this.vehicles.setStatus(req.user, id, dto.status);
  }
}
