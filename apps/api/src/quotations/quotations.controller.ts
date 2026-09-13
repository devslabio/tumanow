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
import {
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
import { QuotationsService } from "./quotations.service";

class CreateQuotationDto {
  @ApiProperty()
  @IsUUID()
  operatorId!: string;

  @ApiProperty()
  @IsString()
  pickupAddress!: string;

  @ApiProperty()
  @IsString()
  deliveryAddress!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pickupCity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryCity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  details?: string;
}

class QuoteDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  etaHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  terms?: string;
}

@ApiTags("customer-quotations")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("customer/quotations")
export class CustomerQuotationsController {
  constructor(private readonly quotations: QuotationsService) {}

  @Post()
  @RequirePermissions("customer.shipments.create")
  create(
    @Req() req: { user: TumaNowJwtPayload },
    @Body() dto: CreateQuotationDto,
  ) {
    return this.quotations.createForCustomer(req.user, dto);
  }

  @Get()
  @RequirePermissions("customer.shipments.view")
  list(@Req() req: { user: TumaNowJwtPayload }) {
    return this.quotations.listForCustomer(req.user);
  }

  @Post(":id/accept")
  @RequirePermissions("customer.shipments.create")
  accept(@Req() req: { user: TumaNowJwtPayload }, @Param("id") id: string) {
    return this.quotations.acceptForCustomer(req.user, id);
  }
}

@ApiTags("tenant-quotations")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, OperatorContextGuard, PermissionGuard)
@Controller("tenant/quotations")
export class TenantQuotationsController {
  constructor(private readonly quotations: QuotationsService) {}

  @Get()
  @RequirePermissions("orders.view")
  list(@Req() req: { user: TumaNowJwtPayload }) {
    return this.quotations.listForOperator(req.user);
  }

  @Post(":id/quote")
  @RequirePermissions("orders.approve")
  quote(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("id") id: string,
    @Body() dto: QuoteDto,
  ) {
    return this.quotations.quote(req.user, id, dto);
  }
}
