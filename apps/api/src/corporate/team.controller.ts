import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { IsEmail, IsIn, IsOptional } from "class-validator";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { TeamService } from "./team.service";

class AddMemberDto {
  @ApiProperty({ example: "colleague@example.com" })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ enum: ["MEMBER", "OWNER"], default: "MEMBER" })
  @IsOptional()
  @IsIn(["MEMBER", "OWNER"])
  role?: "MEMBER" | "OWNER";
}

@ApiTags("customer-team")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("customer/team")
export class TeamController {
  constructor(private readonly team: TeamService) {}

  @Get()
  @RequirePermissions("customer.team.manage")
  list(@Req() req: { user: TumaNowJwtPayload }) {
    return this.team.list(req.user);
  }

  @Post()
  @RequirePermissions("customer.team.manage")
  add(@Req() req: { user: TumaNowJwtPayload }, @Body() dto: AddMemberDto) {
    return this.team.addMember(req.user, dto.email, dto.role ?? "MEMBER");
  }

  @Delete(":membershipId")
  @RequirePermissions("customer.team.manage")
  remove(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("membershipId") membershipId: string,
  ) {
    return this.team.removeMember(req.user, membershipId);
  }
}
