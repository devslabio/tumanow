import { Logger, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { OperatorContextGuard } from "./operator-context.guard";
import { PermissionGuard } from "./permission.guard";

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production");
  }
  new Logger("AuthModule").warn(
    "JWT_SECRET is not set — using an insecure dev-only default. Set JWT_SECRET before deploying.",
  );
  return "dev-insecure-tumanow-secret";
}

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: resolveJwtSecret(),
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
