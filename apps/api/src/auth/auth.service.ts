import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import type { TumaNowJwtPayload } from "./jwt-payload";

const ALIASES: Record<string, string> = {
  admin: "admin@tumanow.rw",
  ritcoadmin: "ritcoadmin@tumanow.rw",
  volcano: "volcano@tumanow.rw",
  customer: "customer@tumanow.rw",
  rider: "rider@tumanow.rw",
};

function normalizeEmail(identifier: string): string {
  const t = identifier.trim().toLowerCase();
  return ALIASES[t] ?? t;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private async loadPlatformAuthz(userId: string) {
    const rows = await this.prisma.userPlatformRole.findMany({
      where: { userId },
      include: {
        role: {
          include: { permissions: { include: { permission: true } } },
        },
      },
    });
    const platformRoleKeys = [...new Set(rows.map((r) => r.role.key))];
    const codes = new Set<string>();
    for (const row of rows) {
      for (const rp of row.role.permissions) {
        codes.add(rp.permission.code);
      }
    }
    return {
      platformRoleKeys,
      permissionCodes: [...codes],
      roleName: rows[0]?.role.name,
    };
  }

  private async loadMembershipContext(membershipId: string) {
    const membership = await this.prisma.operatorMembership.findFirst({
      where: {
        id: membershipId,
        status: "ACTIVE",
        operator: { deletedAt: null },
      },
      include: {
        role: {
          include: { permissions: { include: { permission: true } } },
        },
        branchAccess: true,
        operator: true,
      },
    });
    if (!membership) {
      throw new UnauthorizedException("Operator membership not found");
    }
    if (
      membership.operator.status === "SUSPENDED" ||
      membership.operator.status === "DEACTIVATED" ||
      membership.operator.status === "REJECTED"
    ) {
      throw new UnauthorizedException("Operator is not active");
    }

    const permissionCodes = membership.role.permissions.map(
      (rp) => rp.permission.code,
    );
    const branchIds =
      membership.accessScope === "ALL_BRANCHES"
        ? []
        : membership.branchAccess.map((a) => a.branchId);

    return {
      operatorId: membership.operatorId,
      membershipId: membership.id,
      operatorName:
        membership.operator.tradingName ?? membership.operator.legalName,
      roleKey: membership.role.key,
      roleName: membership.role.name,
      accessScope: membership.accessScope as "ALL_BRANCHES" | "SELECTED",
      branchIds,
      permissionCodes,
    };
  }

  private async loadCustomerContext(userId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { userId, deletedAt: null, status: "ACTIVE" },
    });
    return customer;
  }

  private async buildSessionPayload(
    userId: string,
    email: string,
    membershipId?: string,
  ): Promise<TumaNowJwtPayload> {
    const platform = await this.loadPlatformAuthz(userId);
    const codes = new Set(platform.permissionCodes);

    let operatorPart: Partial<TumaNowJwtPayload> = {};
    let roleKey = platform.platformRoleKeys[0] ?? "USER";
    let roleName = platform.roleName;
    let isCustomer = platform.platformRoleKeys.includes("CUSTOMER");

    const customer = await this.loadCustomerContext(userId);
    if (customer) {
      isCustomer = true;
      operatorPart.customerId = customer.id;
    }

    if (membershipId) {
      const m = await this.loadMembershipContext(membershipId);
      for (const c of m.permissionCodes) codes.add(c);
      operatorPart = {
        ...operatorPart,
        operatorId: m.operatorId,
        membershipId: m.membershipId,
        operatorName: m.operatorName,
        accessScope: m.accessScope,
        branchIds: m.branchIds,
      };
      roleKey = m.roleKey;
      roleName = m.roleName;
      if (platform.platformRoleKeys.includes("SUPER_ADMIN")) {
        roleKey = "SUPER_ADMIN";
        roleName = "Super Admin";
      }
    }

    const driver = await this.prisma.driver.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });
    if (driver) {
      operatorPart.driverId = driver.id;
      if (roleKey === "USER" || isCustomer === false && !membershipId) {
        roleKey = "DRIVER";
        roleName = roleName ?? "Driver";
      }
    }

    return {
      sub: userId,
      email,
      platformRoleKeys: platform.platformRoleKeys,
      permissionCodes: [...codes].sort((a, b) => a.localeCompare(b)),
      roleKey,
      roleName,
      isCustomer,
      ...operatorPart,
    };
  }

  async login(dto: LoginDto) {
    const email = normalizeEmail(dto.identifier);
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null, isActive: true },
      include: {
        platformRoles: { include: { role: true } },
        memberships: {
          where: { status: "ACTIVE", operator: { deletedAt: null } },
          include: {
            operator: {
              select: {
                id: true,
                code: true,
                tradingName: true,
                legalName: true,
                status: true,
              },
            },
            role: { select: { key: true, name: true } },
          },
        },
        customer: true,
      },
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const match = await bcrypt.compare(dto.password, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const hasPlatform = user.platformRoles.some(
      (r) => r.role.key !== "CUSTOMER",
    );
    const isCustomer = user.platformRoles.some(
      (r) => r.role.key === "CUSTOMER",
    );
    const memberships = user.memberships.filter(
      (m) =>
        m.operator.status !== "SUSPENDED" &&
        m.operator.status !== "DEACTIVATED" &&
        m.operator.status !== "REJECTED",
    );

    const linkedDriver = await this.prisma.driver.findFirst({
      where: { userId: user.id, deletedAt: null },
      select: { id: true },
    });

    if (
      !hasPlatform &&
      memberships.length === 0 &&
      !isCustomer &&
      !linkedDriver
    ) {
      throw new UnauthorizedException("No access");
    }

    if (memberships.length > 1 && !dto.operatorId) {
      return {
        requiresOperatorSelection: true as const,
        operators: memberships.map((m) => ({
          id: m.operator.id,
          code: m.operator.code,
          name: m.operator.tradingName ?? m.operator.legalName,
          roleKey: m.role.key,
        })),
      };
    }

    let membershipId: string | undefined;
    if (dto.operatorId) {
      const found = memberships.find((m) => m.operatorId === dto.operatorId);
      if (!found) {
        throw new BadRequestException("Not a member of that operator");
      }
      membershipId = found.id;
    } else if (memberships.length === 1) {
      membershipId = memberships[0].id;
    }

    const payload = await this.buildSessionPayload(
      user.id,
      user.email,
      membershipId,
    );
    const accessToken = await this.jwt.signAsync(payload, { expiresIn: "12h" });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
      roleKey: payload.roleKey,
      roleName: payload.roleName,
      platformRoleKeys: payload.platformRoleKeys,
      permissionCodes: payload.permissionCodes,
      operatorId: payload.operatorId,
      operatorName: payload.operatorName,
      membershipId: payload.membershipId,
      accessScope: payload.accessScope,
      branchIds: payload.branchIds,
      customerId: payload.customerId,
      isCustomer: payload.isCustomer,
      driverId: payload.driverId,
      operators: memberships.map((m) => ({
        id: m.operator.id,
        code: m.operator.code,
        name: m.operator.tradingName ?? m.operator.legalName,
        roleKey: m.role.key,
      })),
    };
  }

  async me(payload: TumaNowJwtPayload) {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
      select: { id: true, email: true, fullName: true, phone: true },
    });
    if (!user) throw new UnauthorizedException();

    const fresh = await this.buildSessionPayload(
      payload.sub,
      user.email,
      payload.membershipId,
    );

    return {
      user,
      roleKey: fresh.roleKey,
      roleName: fresh.roleName,
      platformRoleKeys: fresh.platformRoleKeys,
      permissionCodes: fresh.permissionCodes,
      operatorId: fresh.operatorId,
      operatorName: fresh.operatorName,
      membershipId: fresh.membershipId,
      accessScope: fresh.accessScope,
      branchIds: fresh.branchIds,
      customerId: fresh.customerId,
      isCustomer: fresh.isCustomer,
      driverId: fresh.driverId,
    };
  }

  async updateProfile(payload: TumaNowJwtPayload, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
    });
    if (!user) throw new UnauthorizedException();

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        ...(dto.fullName !== undefined ? { fullName: dto.fullName.trim() } : {}),
        ...(dto.phone !== undefined
          ? { phone: dto.phone.trim() || null }
          : {}),
      },
      select: { id: true, email: true, fullName: true, phone: true },
    });

    const fresh = await this.buildSessionPayload(
      payload.sub,
      updated.email,
      payload.membershipId,
    );

    return {
      user: updated,
      roleKey: fresh.roleKey,
      roleName: fresh.roleName,
      platformRoleKeys: fresh.platformRoleKeys,
      permissionCodes: fresh.permissionCodes,
      operatorId: fresh.operatorId,
      operatorName: fresh.operatorName,
      membershipId: fresh.membershipId,
      accessScope: fresh.accessScope,
      branchIds: fresh.branchIds,
      customerId: fresh.customerId,
      isCustomer: fresh.isCustomer,
    };
  }
}
