import { ForbiddenException, Injectable } from "@nestjs/common";

import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TenantAccessService {
  constructor(private readonly prisma: PrismaService) {}

  assertOperator(user: TumaNowJwtPayload, operatorId?: string) {
    if (user.platformRoleKeys?.includes("SUPER_ADMIN")) return;
    const target = operatorId ?? user.operatorId;
    if (!target || user.operatorId !== target) {
      throw new ForbiddenException("Operator access denied");
    }
  }

  branchFilter(user: TumaNowJwtPayload) {
    if (user.platformRoleKeys?.includes("SUPER_ADMIN")) return {};
    if (user.accessScope === "ALL_BRANCHES" || !user.branchIds?.length) {
      return {};
    }
    return { id: { in: user.branchIds } };
  }
}
