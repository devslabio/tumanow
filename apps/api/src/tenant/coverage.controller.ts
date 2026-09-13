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
import { IsBoolean, IsObject, IsOptional, IsString } from "class-validator";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { OperatorContextGuard } from "../auth/operator-context.guard";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { CoverageService } from "./coverage.service";

class CreateCoverageDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ description: "country | province | district | sector | city | zone | radius" })
  @IsString()
  level!: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateCoverageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@ApiTags("tenant-coverage")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, OperatorContextGuard, PermissionGuard)
@Controller("tenant/coverage")
export class CoverageController {
  constructor(private readonly coverage: CoverageService) {}

  @Get()
  @RequirePermissions("coverage.view")
  list(@Req() req: { user: TumaNowJwtPayload }) {
    return this.coverage.list(req.user);
  }

  @Post()
  @RequirePermissions("coverage.manage")
  create(
    @Req() req: { user: TumaNowJwtPayload },
    @Body() dto: CreateCoverageDto,
  ) {
    return this.coverage.create(req.user, dto);
  }

  @Patch(":id")
  @RequirePermissions("coverage.manage")
  update(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("id") id: string,
    @Body() dto: UpdateCoverageDto,
  ) {
    return this.coverage.update(req.user, id, dto);
  }
}
