import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsIn, IsOptional, IsUrl } from "class-validator";

import { OperatorContextGuard } from "../auth/operator-context.guard";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { TenantAuthGuard } from "../auth/tenant-auth.guard";
import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { WEBHOOK_EVENTS } from "./webhook-events";
import { WebhooksService } from "./webhooks.service";

class CreateWebhookDto {
  @ApiProperty({ example: "https://partner.example.com/tumanow/webhook" })
  @IsUrl({ require_tld: false })
  url!: string;

  @ApiPropertyOptional({
    enum: WEBHOOK_EVENTS,
    isArray: true,
    description: "Subscribed events; omit or leave empty for all events",
  })
  @IsOptional()
  @IsArray()
  @IsIn(WEBHOOK_EVENTS, { each: true })
  events?: string[];
}

class UpdateWebhookDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  url?: string;

  @ApiPropertyOptional({ enum: WEBHOOK_EVENTS, isArray: true })
  @IsOptional()
  @IsArray()
  @IsIn(WEBHOOK_EVENTS, { each: true })
  events?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@ApiTags("tenant-webhooks")
@ApiBearerAuth("access-token")
@UseGuards(TenantAuthGuard, OperatorContextGuard, PermissionGuard)
@Controller("tenant/webhooks")
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Get("events")
  @RequirePermissions("integrations.manage")
  events() {
    return this.webhooks.listEventCatalogue();
  }

  @Get()
  @RequirePermissions("integrations.manage")
  list(@Req() req: { user: TumaNowJwtPayload }) {
    return this.webhooks.list(req.user);
  }

  @Post()
  @RequirePermissions("integrations.manage")
  create(@Req() req: { user: TumaNowJwtPayload }, @Body() dto: CreateWebhookDto) {
    return this.webhooks.create(req.user, dto.url, dto.events);
  }

  @Patch(":id")
  @RequirePermissions("integrations.manage")
  update(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("id") id: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    return this.webhooks.update(req.user, id, dto);
  }

  @Delete(":id")
  @RequirePermissions("integrations.manage")
  remove(@Req() req: { user: TumaNowJwtPayload }, @Param("id") id: string) {
    return this.webhooks.remove(req.user, id);
  }

  @Get(":id/deliveries")
  @RequirePermissions("integrations.manage")
  deliveries(@Req() req: { user: TumaNowJwtPayload }, @Param("id") id: string) {
    return this.webhooks.recentDeliveries(req.user, id);
  }
}
