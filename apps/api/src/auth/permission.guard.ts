import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { TumaNowJwtPayload } from "./jwt-payload";
import {
  ANY_PERMISSIONS_KEY,
  PERMISSIONS_KEY,
} from "./permissions.decorator";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    const anyRequired = this.reflector.getAllAndOverride<string[]>(
      ANY_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required?.length && !anyRequired?.length) return true;

    const req = context.switchToHttp().getRequest<{ user?: TumaNowJwtPayload }>();
    const user = req.user;
    if (!user) throw new ForbiddenException("Not authenticated");

    if (user.platformRoleKeys?.includes("SUPER_ADMIN")) return true;

    const codes = new Set(user.permissionCodes ?? []);

    if (required?.length) {
      const missing = required.filter((c) => !codes.has(c));
      if (missing.length) {
        throw new ForbiddenException(`Missing permissions: ${missing.join(", ")}`);
      }
    }

    if (anyRequired?.length) {
      const hasAny = anyRequired.some((c) => codes.has(c));
      if (!hasAny) {
        throw new ForbiddenException(
          `Requires one of: ${anyRequired.join(", ")}`,
        );
      }
    }

    return true;
  }
}
