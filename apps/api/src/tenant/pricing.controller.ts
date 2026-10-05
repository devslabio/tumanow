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
import { DeliveryService } from "@prisma/client";
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";

import { TenantAuthGuard } from "../auth/tenant-auth.guard";
import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { OperatorContextGuard } from "../auth/operator-context.guard";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { PricingService } from "./pricing.service";

class CreatePricingRuleDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ enum: DeliveryService })
  @IsOptional()
  @IsEnum(DeliveryService)
  deliveryService?: DeliveryService;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  packageTypeId?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  baseFee!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  perKmFee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  perKgFee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  fragileSurcharge?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  expressSurcharge?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minFee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxWeightKg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdatePricingRuleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: DeliveryService })
  @IsOptional()
  @IsEnum(DeliveryService)
  deliveryService?: DeliveryService;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  packageTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseFee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  perKmFee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  perKgFee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  fragileSurcharge?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  expressSurcharge?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minFee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxWeightKg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@ApiTags("tenant-pricing")
@ApiBearerAuth("access-token")
@UseGuards(TenantAuthGuard, OperatorContextGuard, PermissionGuard)
@Controller("tenant/pricing")
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Get()
  @RequirePermissions("pricing.view")
  list(@Req() req: { user: TumaNowJwtPayload }) {
    return this.pricing.list(req.user);
  }

  @Post()
  @RequirePermissions("pricing.manage")
  create(
    @Req() req: { user: TumaNowJwtPayload },
    @Body() dto: CreatePricingRuleDto,
  ) {
    return this.pricing.create(req.user, dto);
  }

  @Patch(":id")
  @RequirePermissions("pricing.manage")
  update(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("id") id: string,
    @Body() dto: UpdatePricingRuleDto,
  ) {
    return this.pricing.update(req.user, id, dto);
  }
}
