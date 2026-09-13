import { Injectable } from "@nestjs/common";

import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { PrismaService } from "../prisma/prisma.service";
import { TenantAccessService } from "../tenant/tenant-access.service";

@Injectable()
export class AuditListService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TenantAccessService,
  ) {}

  listPlatform(take = 100) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take,
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        operator: { select: { id: true, code: true, tradingName: true } },
      },
    });
  }

  listTenant(user: TumaNowJwtPayload, take = 100) {
    this.access.assertOperator(user);
    return this.prisma.auditLog.findMany({
      where: { operatorId: user.operatorId! },
      orderBy: { createdAt: "desc" },
      take,
      include: {
        user: { select: { id: true, email: true, fullName: true } },
      },
    });
  }
}
