import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiProperty, ApiTags } from "@nestjs/swagger";
import { IsISO8601, IsUUID } from "class-validator";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { OperatorContextGuard } from "../auth/operator-context.guard";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { TenantAuthGuard } from "../auth/tenant-auth.guard";
import { InvoicesService } from "./invoices.service";

class GenerateInvoiceDto {
  @ApiProperty()
  @IsUUID()
  customerId!: string;

  @ApiProperty({ description: "ISO 8601 date" })
  @IsISO8601()
  periodStart!: string;

  @ApiProperty({ description: "ISO 8601 date" })
  @IsISO8601()
  periodEnd!: string;
}

@ApiTags("tenant-invoices")
@ApiBearerAuth("access-token")
@UseGuards(TenantAuthGuard, OperatorContextGuard, PermissionGuard)
@Controller("tenant/invoices")
export class TenantInvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  @RequirePermissions("corporate.manage")
  list(@Req() req: { user: TumaNowJwtPayload }) {
    return this.invoices.listForOperator(req.user);
  }

  @Get(":id")
  @RequirePermissions("corporate.manage")
  get(@Req() req: { user: TumaNowJwtPayload }, @Param("id") id: string) {
    return this.invoices.getForOperator(req.user, id);
  }

  @Post()
  @RequirePermissions("corporate.manage")
  generate(@Req() req: { user: TumaNowJwtPayload }, @Body() dto: GenerateInvoiceDto) {
    return this.invoices.generate(
      req.user,
      dto.customerId,
      new Date(dto.periodStart),
      new Date(dto.periodEnd),
    );
  }

  @Post(":id/pay")
  @RequirePermissions("corporate.manage")
  markPaid(@Req() req: { user: TumaNowJwtPayload }, @Param("id") id: string) {
    return this.invoices.markPaid(req.user, id);
  }

  @Post(":id/void")
  @RequirePermissions("corporate.manage")
  voidInvoice(@Req() req: { user: TumaNowJwtPayload }, @Param("id") id: string) {
    return this.invoices.voidInvoice(req.user, id);
  }
}

@ApiTags("customer-invoices")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("customer/invoices")
export class CustomerInvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  @RequirePermissions("customer.shipments.view")
  list(@Req() req: { user: TumaNowJwtPayload }) {
    return this.invoices.listForCustomer(req.user);
  }

  @Get(":id")
  @RequirePermissions("customer.shipments.view")
  get(@Req() req: { user: TumaNowJwtPayload }, @Param("id") id: string) {
    return this.invoices.getForCustomer(req.user, id);
  }
}
