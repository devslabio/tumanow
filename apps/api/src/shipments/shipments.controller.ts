import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
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
  create(
    @Req() req: { user: TumaNowJwtPayload },
    @Body() dto: CreateShipmentDto,
  ) {
    return this.shipments.create(req.user, dto);
  }
}
