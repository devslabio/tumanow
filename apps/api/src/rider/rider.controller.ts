import {
  Body,
  Controller,
  Get,
  Param,
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
import { ShipmentStatus } from "@prisma/client";
import { IsEnum, IsIn, IsOptional, IsString } from "class-validator";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { RiderService } from "./rider.service";

class UpdateStatusDto {
  @ApiProperty({ enum: ShipmentStatus })
  @IsEnum(ShipmentStatus)
  status!: ShipmentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

class VerifyPodDto {
  @ApiProperty()
  @IsString()
  otp!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recipientName?: string;
}

class CollectCodDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

class AvailabilityDto {
  @ApiProperty({ enum: ["AVAILABLE", "OFFLINE", "BUSY"] })
  @IsIn(["AVAILABLE", "OFFLINE", "BUSY"])
  status!: "AVAILABLE" | "OFFLINE" | "BUSY";
}

@ApiTags("rider")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard)
@Controller("rider")
export class RiderController {
  constructor(private readonly rider: RiderService) {}

  @Get("me")
  me(@Req() req: { user: TumaNowJwtPayload }) {
    return this.rider.me(req.user);
  }

  @Get("shipments")
  listJobs(@Req() req: { user: TumaNowJwtPayload }) {
    return this.rider.listJobs(req.user);
  }

  @Get("shipments/history")
  history(@Req() req: { user: TumaNowJwtPayload }) {
    return this.rider.listHistory(req.user);
  }

  @Get("shipments/:id")
  getJob(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("id") id: string,
  ) {
    return this.rider.getJob(req.user, id);
  }

  @Post("shipments/:id/status")
  updateStatus(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("id") id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.rider.updateStatus(req.user, id, dto.status, dto.note);
  }

  @Post("shipments/:id/pod/generate")
  generatePod(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("id") id: string,
  ) {
    return this.rider.generatePod(req.user, id);
  }

  @Post("shipments/:id/pod/verify")
  verifyPod(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("id") id: string,
    @Body() dto: VerifyPodDto,
  ) {
    return this.rider.verifyPod(req.user, id, dto.otp, dto.recipientName);
  }

  @Post("shipments/:id/cod/collect")
  collectCod(
    @Req() req: { user: TumaNowJwtPayload },
    @Param("id") id: string,
    @Body() dto: CollectCodDto,
  ) {
    return this.rider.collectCod(req.user, id, dto.note);
  }

  @Post("availability")
  setAvailability(
    @Req() req: { user: TumaNowJwtPayload },
    @Body() dto: AvailabilityDto,
  ) {
    return this.rider.setAvailability(req.user, dto.status);
  }
}
