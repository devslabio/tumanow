import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import type { TumaNowJwtPayload } from "./jwt-payload";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get("me")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  me(@Req() req: { user: TumaNowJwtPayload }) {
    return this.auth.me(req.user);
  }

  @Patch("me")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  updateMe(
    @Req() req: { user: TumaNowJwtPayload },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.auth.updateProfile(req.user, dto);
  }
}
