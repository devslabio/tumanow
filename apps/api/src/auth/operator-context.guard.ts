import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

import type { TumaNowJwtPayload } from "./jwt-payload";

@Injectable()
export class OperatorContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: TumaNowJwtPayload }>();
    const user = req.user;

    if (!user) throw new ForbiddenException("Not authenticated");
    if (user.platformRoleKeys?.includes("SUPER_ADMIN")) return true;
    if (!user.operatorId || !user.membershipId) {
      throw new ForbiddenException("Operator context required");
    }
    return true;
  }
}
