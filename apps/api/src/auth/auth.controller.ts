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
import { ConfirmEmailDto, ConfirmPhoneDto } from "./dto/verify.dto";
import { ForgotPasswordDto, ResetPasswordDto } from "./dto/password-reset.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import type { TumaNowJwtPayload } from "./jwt-payload";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  @HttpCode(201)
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post("login")
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post("logout")
  @HttpCode(200)
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  logout(@Req() req: { user: TumaNowJwtPayload }) {
    return this.auth.logout(req.user);
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

  @Post("deactivate")
  @HttpCode(200)
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  deactivate(@Req() req: { user: TumaNowJwtPayload }) {
    return this.auth.deactivate(req.user);
  }

  @Post("password/forgot")
  @HttpCode(200)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Post("password/reset")
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Post("verify/email/request")
  @HttpCode(200)
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  requestEmailVerification(@Req() req: { user: TumaNowJwtPayload }) {
    return this.auth.requestEmailVerification(req.user);
  }

  @Post("verify/email/confirm")
  @HttpCode(200)
  confirmEmailVerification(@Body() dto: ConfirmEmailDto) {
    return this.auth.confirmEmailVerification(dto);
  }

  @Post("verify/phone/request")
  @HttpCode(200)
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  requestPhoneVerification(@Req() req: { user: TumaNowJwtPayload }) {
    return this.auth.requestPhoneVerification(req.user);
  }

  @Post("verify/phone/confirm")
  @HttpCode(200)
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  confirmPhoneVerification(
    @Req() req: { user: TumaNowJwtPayload },
    @Body() dto: ConfirmPhoneDto,
  ) {
    return this.auth.confirmPhoneVerification(req.user, dto);
  }
}
