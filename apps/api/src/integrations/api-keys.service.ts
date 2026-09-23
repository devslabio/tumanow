import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "node:crypto";

import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { hashApiKey } from "../auth/api-key-auth.guard";
import { AuditService } from "../common/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { TenantAccessService } from "../tenant/tenant-access.service";

@Injectable()
export class ApiKeysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TenantAccessService,
    private readonly audit: AuditService,
  ) {}

  async list(user: TumaNowJwtPayload) {
    this.access.assertOperator(user);
    return this.prisma.apiKey.findMany({
      where: { operatorId: user.operatorId! },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        status: true,
        lastUsedAt: true,
        createdAt: true,
        revokedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /** Returns the raw secret exactly once — it is never stored or shown again. */
  async create(user: TumaNowJwtPayload, name: string) {
    this.access.assertOperator(user);
    if (user.roleKey === "API_KEY") {
      // A key can create other keys only via a human session, to keep the
      // "never exceed the creator's own access" chain from a key back to
      // an actual person auditable.
      throw new ForbiddenException("API keys cannot create other API keys");
    }

    const rawKey = `tnk_${randomBytes(24).toString("hex")}`;
    const hashedKey = hashApiKey(rawKey);

    const created = await this.prisma.apiKey.create({
      data: {
        operatorId: user.operatorId!,
        name,
        keyPrefix: rawKey.slice(0, 12),
        hashedKey,
        // Never grant more than the creating user currently has.
        scopes: user.permissionCodes ?? [],
        createdByUserId: user.sub,
      },
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "apikey.create",
      entityType: "ApiKey",
      entityId: created.id,
      after: { name, keyPrefix: created.keyPrefix },
    });

    return {
      id: created.id,
      name: created.name,
      keyPrefix: created.keyPrefix,
      scopes: created.scopes,
      key: rawKey,
      warning: "This is the only time the full key is shown. Store it securely.",
    };
  }

  async revoke(user: TumaNowJwtPayload, id: string) {
    this.access.assertOperator(user);
    const existing = await this.prisma.apiKey.findFirst({
      where: { id, operatorId: user.operatorId! },
    });
    if (!existing) throw new NotFoundException("API key not found");

    const updated = await this.prisma.apiKey.update({
      where: { id },
      data: { status: "REVOKED", revokedAt: new Date() },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        status: true,
        revokedAt: true,
      },
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "apikey.revoke",
      entityType: "ApiKey",
      entityId: id,
    });

    return updated;
  }
}
