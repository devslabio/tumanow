import { Body, Controller, Post, UseGuards } from "@nestjs/common";
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

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { MatchingService } from "./matching.service";

export class MatchQuoteDto {
  @ApiProperty()
  @IsString()
  pickupCity!: string;

  @ApiProperty()
  @IsString()
  deliveryCity!: string;

  @ApiPropertyOptional({ description: "Pickup latitude, for real distance + radius coverage" })
  @IsOptional()
  @IsNumber()
  pickupLat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  pickupLng?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  deliveryLat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  deliveryLng?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  lengthCm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  widthCm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  heightCm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  declaredValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFragile?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPerishable?: boolean;

  @ApiPropertyOptional({ enum: DeliveryService })
  @IsOptional()
  @IsEnum(DeliveryService)
  deliveryService?: DeliveryService;

  @ApiPropertyOptional({ description: "Used for pricing when pickup/delivery coordinates aren't given" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedDistanceKm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  packageTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  operatorId?: string;
}

@ApiTags("public-matching")
@Controller("public")
export class MatchingPublicController {
  constructor(private readonly matching: MatchingService) {}

  @Post("match")
  match(@Body() dto: MatchQuoteDto) {
    return this.matching.match(dto);
  }
}

@ApiTags("customer-quotes")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("customer/quotes")
export class MatchingCustomerController {
  constructor(private readonly matching: MatchingService) {}

  @Post("match")
  @RequirePermissions("customer.shipments.create")
  match(@Body() dto: MatchQuoteDto) {
    return this.matching.match(dto);
  }
}
