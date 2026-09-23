import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { IdempotencyInterceptor, IdempotencyScope } from "../integrations/idempotency.interceptor";
import { CreateShipmentDto } from "./dto/create-shipment.dto";
import { ShipmentsService } from "./shipments.service";

@ApiTags("customer-shipments")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("customer/shipments")
export class ShipmentsController {
  constructor(private readonly shipments: ShipmentsService) {}

  @Get()
  @RequirePermissions("customer.shipments.view")
  list(@Req() req: { user: TumaNowJwtPayload }) {
    return this.shipments.listForCustomer(req.user);
  }

  @Get(":id")
  @RequirePermissions("customer.shipments.view")
  get(@Req() req: { user: TumaNowJwtPayload }, @Param("id") id: string) {
    return this.shipments.getForCustomer(req.user, id);
  }

  @Post()
  @RequirePermissions("customer.shipments.create")
  @IdempotencyScope("customer.shipments.create")
  @UseInterceptors(IdempotencyInterceptor)
  @ApiHeader({
    name: "Idempotency-Key",
    required: false,
    description: "Safely retry this request — the same key replays the original response instead of creating a duplicate shipment.",
  })
  create(
    @Req() req: { user: TumaNowJwtPayload },
    @Body() dto: CreateShipmentDto,
  ) {
    return this.shipments.create(req.user, dto);
  }
}
