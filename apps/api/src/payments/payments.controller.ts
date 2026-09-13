import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { PaymentMethod } from "@prisma/client";
import { IsIn, IsOptional, IsString, MinLength } from "class-validator";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { OperatorContextGuard } from "../auth/operator-context.guard";
import { PermissionGuard } from "../auth/permission.guard";
import {
  RequireAnyPermission,
  RequirePermissions,
} from "../auth/permissions.decorator";
import { PaymentsService } from "./payments.service";

const PAY_METHODS = ["MTN_MOMO", "AIRTEL_MONEY", "CARD"] as const;

class PayShipmentDto {
  @ApiProperty({ enum: PAY_METHODS })
  @IsIn(PAY_METHODS)
  method!: (typeof PAY_METHODS)[number];

  @ApiPropertyOptional({ example: "+250780000004" })
  @IsOptional()
  @IsString()
  @MinLength(9)
  payerPhone?: string;
}

@ApiTags("customer-payments")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("customer")
export class CustomerPaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post("shipments/:id/pay")
  @RequireAnyPermission("customer.payments.pay", "customer.shipments.create")
  pay(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("id") id: string,
    @Body() dto: PayShipmentDto,
  ) {
    return this.payments.payShipment(
      req.user,
      id,
      dto.method as PaymentMethod,
      dto.payerPhone,
    );
  }

  @Post("payments/:id/confirm")
  @RequireAnyPermission("customer.payments.pay", "customer.shipments.create")
  confirm(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("id") id: string,
  ) {
    return this.payments.confirmPayment(req.user, id, true);
  }

  @Get("payments")
  @RequireAnyPermission("customer.payments.view", "customer.shipments.view")
  list(
    @Req() req: { user: TumaNowJwtPayload },
    @Query("shipmentId") shipmentId?: string,
  ) {
    return this.payments.listForCustomer(req.user, shipmentId);
  }
}

@ApiTags("tenant-payments")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, OperatorContextGuard, PermissionGuard)
@Controller("tenant/payments")
export class TenantPaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  @RequirePermissions("payments.view")
  list(@Req() req: { user: TumaNowJwtPayload }) {
    return this.payments.listForOperator(req.user);
  }
}
