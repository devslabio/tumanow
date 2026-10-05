import { Injectable } from "@nestjs/common";

import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { PrismaService } from "../prisma/prisma.service";
import { TenantAccessService } from "../tenant/tenant-access.service";

type ActorInfo =
  | { type: "user"; id: string; email: string; fullName: string | null }
  | { type: "api_key"; id: string; name: string };

@Injectable()
export class AuditListService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TenantAccessService,
  ) {}

  async listPlatform(take = 100) {
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take,
      include: {
        operator: { select: { id: true, code: true, tradingName: true } },
      },
    });
    return this.attachActors(logs);
  }

  async listTenant(user: TumaNowJwtPayload, take = 100) {
    this.access.assertOperator(user);
    const logs = await this.prisma.auditLog.findMany({
      where: { operatorId: user.operatorId! },
      orderBy: { createdAt: "desc" },
      take,
    });
    return this.attachActors(logs);
  }

  /**
   * `AuditLog.userId` has no DB foreign key (see schema comment: it must
   * survive the actor being deleted, and can be an API key rather than a
   * User). Resolve display info with two batched lookups instead of a join.
   */
  private async attachActors<T extends { userId: string | null }>(
    logs: T[],
  ): Promise<(T & { actor: ActorInfo | null })[]> {
    const ids = [...new Set(logs.map((l) => l.userId).filter((v): v is string => !!v))];
    if (!ids.length) {
      return logs.map((l) => ({ ...l, actor: null }));
    }

    const [users, apiKeys] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, email: true, fullName: true },
      }),
      this.prisma.apiKey.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true },
      }),
    ]);

    const actorById = new Map<string, ActorInfo>();
    for (const u of users) actorById.set(u.id, { type: "user", ...u });
    for (const k of apiKeys) actorById.set(k.id, { type: "api_key", ...k });

    return logs.map((l) => ({
      ...l,
      actor: l.userId ? (actorById.get(l.userId) ?? null) : null,
    }));
  }
}
