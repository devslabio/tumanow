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
import {
  ApiBearerAuth,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from "@nestjs/swagger";
import { BranchStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { OperatorContextGuard } from "../auth/operator-context.guard";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { BranchesService } from "./branches.service";

class CreateBranchDto {
  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ enum: BranchStatus })
  @IsOptional()
  @IsEnum(BranchStatus)
  status?: BranchStatus;
}

class UpdateBranchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ enum: BranchStatus })
  @IsOptional()
  @IsEnum(BranchStatus)
  status?: BranchStatus;
}

@ApiTags("tenant-branches")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, OperatorContextGuard, PermissionGuard)
@Controller("tenant/branches")
export class BranchesController {
  constructor(private readonly branches: BranchesService) {}

  @Get()
  @RequirePermissions("branch.view")
  list(@Req() req: { user: TumaNowJwtPayload }) {
    return this.branches.list(req.user);
  }

  @Get(":id")
  @RequirePermissions("branch.view")
  get(@Req() req: { user: TumaNowJwtPayload }, @Param("id") id: string) {
    return this.branches.get(req.user, id);
  }

  @Post()
  @RequirePermissions("branch.create")
  create(
    @Req() req: { user: TumaNowJwtPayload },
    @Body() dto: CreateBranchDto,
  ) {
    return this.branches.create(req.user, dto);
  }

  @Patch(":id")
  @RequirePermissions("branch.update")
  update(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("id") id: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branches.update(req.user, id, dto);
  }
}
