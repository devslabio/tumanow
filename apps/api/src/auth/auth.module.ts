import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { OperatorContextGuard } from "./operator-context.guard";
import { PermissionGuard } from "./permission.guard";

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? "dev-insecure-tumanow-secret",
      signOptions: { expiresIn: "12h" },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    OperatorContextGuard,
    PermissionGuard,
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    OperatorContextGuard,
    PermissionGuard,
  ],
})
export class AuthModule {}
