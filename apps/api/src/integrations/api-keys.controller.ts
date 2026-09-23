import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiProperty, ApiTags } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

import { OperatorContextGuard } from "../auth/operator-context.guard";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { TenantAuthGuard } from "../auth/tenant-auth.guard";
import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { ApiKeysService } from "./api-keys.service";

class CreateApiKeyDto {
  @ApiProperty({ example: "Warehouse system" })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;
}

@ApiTags("tenant-api-keys")
@ApiBearerAuth("access-token")
@UseGuards(TenantAuthGuard, OperatorContextGuard, PermissionGuard)
@Controller("tenant/api-keys")
export class ApiKeysController {
  constructor(private readonly apiKeys: ApiKeysService) {}

  @Get()
  @RequirePermissions("integrations.manage")
  list(@Req() req: { user: TumaNowJwtPayload }) {
    return this.apiKeys.list(req.user);
  }

  @Post()
  @RequirePermissions("integrations.manage")
  create(@Req() req: { user: TumaNowJwtPayload }, @Body() dto: CreateApiKeyDto) {
    return this.apiKeys.create(req.user, dto.name);
  }

  @Delete(":id")
  @RequirePermissions("integrations.manage")
  revoke(@Req() req: { user: TumaNowJwtPayload }, @Param("id") id: string) {
    return this.apiKeys.revoke(req.user, id);
  }
}
