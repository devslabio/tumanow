import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiProperty, ApiQuery, ApiTags } from "@nestjs/swagger";
import { IsEmail, IsIn, IsNumber, IsUUID, Min } from "class-validator";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { OperatorContextGuard } from "../auth/operator-context.guard";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { TenantAuthGuard } from "../auth/tenant-auth.guard";
import { CorporateAccountsService } from "./corporate-accounts.service";

class UpsertCorporateAccountDto {
  @ApiProperty()
  @IsUUID()
  customerId!: string;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  @Min(0)
  creditLimit!: number;
}

class SetStatusDto {
  @ApiProperty({ enum: ["ACTIVE", "SUSPENDED"] })
  @IsIn(["ACTIVE", "SUSPENDED"])
  status!: "ACTIVE" | "SUSPENDED";
}

class SearchCustomerDto {
  @ApiProperty({ example: "billing@acme.rw" })
  @IsEmail()
  email!: string;
}

@ApiTags("tenant-corporate-accounts")
@ApiBearerAuth("access-token")
@UseGuards(TenantAuthGuard, OperatorContextGuard, PermissionGuard)
@Controller("tenant/corporate-accounts")
export class TenantCorporateAccountsController {
  constructor(private readonly accounts: CorporateAccountsService) {}

  @Get()
  @RequirePermissions("corporate.manage")
  list(@Req() req: { user: TumaNowJwtPayload }) {
    return this.accounts.listForOperator(req.user);
  }

  @Get("search")
  @RequirePermissions("corporate.manage")
  @ApiQuery({ name: "email", required: true })
  search(@Req() req: { user: TumaNowJwtPayload }, @Query() dto: SearchCustomerDto) {
    return this.accounts.searchBusinessCustomer(req.user, dto.email);
  }

  @Post()
  @RequirePermissions("corporate.manage")
  upsert(@Req() req: { user: TumaNowJwtPayload }, @Body() dto: UpsertCorporateAccountDto) {
    return this.accounts.upsert(req.user, dto.customerId, dto.creditLimit);
  }

  @Patch(":id/status")
  @RequirePermissions("corporate.manage")
  setStatus(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("id") id: string,
    @Body() dto: SetStatusDto,
  ) {
    return this.accounts.setStatus(req.user, id, dto.status);
  }
}

@ApiTags("customer-corporate-accounts")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("customer/corporate-accounts")
export class CustomerCorporateAccountsController {
  constructor(private readonly accounts: CorporateAccountsService) {}

  @Get()
  @RequirePermissions("customer.shipments.view")
  list(@Req() req: { user: TumaNowJwtPayload }) {
    return this.accounts.listForCustomer(req.user);
  }
}
