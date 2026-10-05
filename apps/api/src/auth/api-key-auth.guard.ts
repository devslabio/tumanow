import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { createHash } from "node:crypto";

import { PrismaService } from "../prisma/prisma.service";
import type { TumaNowJwtPayload } from "./jwt-payload";

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

/**
 * Authenticates operator-integration requests via the `X-Api-Key` header,
 * as an alternative to a human JWT. Builds a synthetic session payload so
 * the existing OperatorContextGuard / PermissionGuard / TenantAccessService
 * work unchanged — an API key is just another way to arrive at a
 * TumaNowJwtPayload, not a parallel authorization system.
 */
@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: TumaNowJwtPayload;
    }>();
    const header = req.headers["x-api-key"];
    const rawKey = Array.isArray(header) ? header[0] : header;
    if (!rawKey) {
      throw new UnauthorizedException("Missing X-Api-Key header");
    }

    const hashedKey = hashApiKey(rawKey);
    const key = await this.prisma.apiKey.findUnique({ where: { hashedKey } });
    if (!key || key.status !== "ACTIVE") {
      throw new UnauthorizedException("Invalid or revoked API key");
    }

    // Fire-and-forget — a slow write here shouldn't hold up the request.
    void this.prisma.apiKey
      .update({ where: { id: key.id }, data: { lastUsedAt: new Date() } })
      .catch(() => undefined);

    req.user = {
      // A real UUID (ApiKey.id), not a User id — `audit.userId` and
      // `ShipmentEvent.actorUserId` are opaque actor-id columns with no FK
      // to User, precisely so an API key can be recorded as the actor here.
      sub: key.id,
      email: `${key.name.toLowerCase().replace(/\s+/g, "-")}@api-key.internal`,
      platformRoleKeys: [],
      permissionCodes: Array.isArray(key.scopes) ? (key.scopes as string[]) : [],
      roleKey: "API_KEY",
      roleName: `API key: ${key.name}`,
      operatorId: key.operatorId,
      // Satisfies OperatorContextGuard's truthy check; there's no real
      // OperatorMembership row behind an API key.
      membershipId: key.id,
      accessScope: "ALL_BRANCHES",
      branchIds: [],
    };
    return true;
  }
}
