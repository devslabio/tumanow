import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { randomBytes, randomInt } from "node:crypto";

import { MessagingService } from "../messaging/messaging.service";
import { PrismaService } from "../prisma/prisma.service";
import { ConfirmEmailDto, ConfirmPhoneDto } from "./dto/verify.dto";
import { ForgotPasswordDto, ResetPasswordDto } from "./dto/password-reset.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
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
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly messaging: MessagingService,
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

    const account = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tokenVersion: true },
    });

    return {
      sub: userId,
      email,
      platformRoleKeys: platform.platformRoleKeys,
      permissionCodes: [...codes].sort((a, b) => a.localeCompare(b)),
      roleKey,
      roleName,
      isCustomer,
      tokenVersion: account?.tokenVersion ?? 0,
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

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findFirst({ where: { email } });
    if (existing) {
      throw new BadRequestException("An account with this email already exists");
    }

    const customerRole = await this.prisma.role.findFirst({
      where: { key: "CUSTOMER", operatorId: null, isPlatformRole: true },
    });
    if (!customerRole) {
      throw new BadRequestException("Customer registration is not configured");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const fullName = dto.fullName.trim();
    const phone = dto.phone?.trim() || null;

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone,
        platformRoles: { create: { roleId: customerRole.id } },
        customer: {
          create: {
            type: "INDIVIDUAL",
            status: "ACTIVE",
            fullName,
            email,
            phone,
          },
        },
      },
    });

    await this.issueEmailVerification(user.id, user.email).catch((err) =>
      this.logger.warn(`Failed to send verification email: ${err}`),
    );
    if (phone) {
      await this.issuePhoneVerification(user.id, phone).catch((err) =>
        this.logger.warn(`Failed to send verification SMS: ${err}`),
      );
    }

    const payload = await this.buildSessionPayload(user.id, user.email);
    const accessToken = await this.jwt.signAsync(payload, { expiresIn: "12h" });

    return {
      accessToken,
      user: { id: user.id, email: user.email, fullName: user.fullName },
      roleKey: payload.roleKey,
      roleName: payload.roleName,
      platformRoleKeys: payload.platformRoleKeys,
      permissionCodes: payload.permissionCodes,
      customerId: payload.customerId,
      isCustomer: payload.isCustomer,
      operators: [],
    };
  }

  async logout(payload: TumaNowJwtPayload) {
    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { tokenVersion: { increment: 1 } },
    });
    return { ok: true };
  }

  async deactivate(payload: TumaNowJwtPayload) {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
    });
    if (!user) throw new UnauthorizedException();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { isActive: false, tokenVersion: { increment: 1 } },
      }),
      this.prisma.customer.updateMany({
        where: { userId: user.id },
        data: { status: "DEACTIVATED" },
      }),
    ]);
    return { ok: true };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = normalizeEmail(dto.identifier);
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null, isActive: true },
    });
    // Always report success so this endpoint can't be used to enumerate accounts.
    if (!user) return { ok: true };

    const token = randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpiresAt: expiresAt },
    });
    await this.messaging.sendEmail(
      user.email,
      "Reset your TumaNow password",
      `Use this code to reset your password: ${token}. It expires in 30 minutes.`,
    );
    return { ok: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { passwordResetToken: dto.token, deletedAt: null },
    });
    if (
      !user ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        // Revoke any tokens issued before the reset.
        tokenVersion: { increment: 1 },
      },
    });
    return { ok: true };
  }

  async requestEmailVerification(payload: TumaNowJwtPayload) {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
    });
    if (!user) throw new UnauthorizedException();
    if (user.emailVerifiedAt) return { ok: true, alreadyVerified: true };

    await this.issueEmailVerification(user.id, user.email);
    return { ok: true };
  }

  async confirmEmailVerification(dto: ConfirmEmailDto) {
    const user = await this.prisma.user.findFirst({
      where: { emailVerifyToken: dto.token, deletedAt: null },
    });
    if (
      !user ||
      !user.emailVerifyExpiresAt ||
      user.emailVerifyExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException("Invalid or expired verification token");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerifyToken: null,
        emailVerifyExpiresAt: null,
      },
    });
    return { ok: true };
  }

  async requestPhoneVerification(payload: TumaNowJwtPayload) {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
    });
    if (!user) throw new UnauthorizedException();
    if (!user.phone) {
      throw new BadRequestException("No phone number on file");
    }
    if (user.phoneVerifiedAt) return { ok: true, alreadyVerified: true };

    await this.issuePhoneVerification(user.id, user.phone);
    return { ok: true };
  }

  async confirmPhoneVerification(
    payload: TumaNowJwtPayload,
    dto: ConfirmPhoneDto,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
    });
    if (!user) throw new UnauthorizedException();
    if (!user.phoneOtp || !user.phoneOtpExpiresAt) {
      throw new BadRequestException("No verification code requested");
    }
    if (user.phoneOtpExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException("Verification code expired");
    }
    if (user.phoneOtp !== dto.otp) {
      throw new BadRequestException("Invalid verification code");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        phoneVerifiedAt: new Date(),
        phoneOtp: null,
        phoneOtpExpiresAt: null,
      },
    });
    return { ok: true };
  }

  private async issueEmailVerification(userId: string, email: string) {
    const token = randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifyToken: token, emailVerifyExpiresAt: expiresAt },
    });
    await this.messaging.sendEmail(
      email,
      "Verify your TumaNow email",
      `Your verification code is ${token}. It expires in 24 hours.`,
    );
    return token;
  }

  private async issuePhoneVerification(userId: string, phone: string) {
    const otp = String(randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.prisma.user.update({
      where: { id: userId },
      data: { phoneOtp: otp, phoneOtpExpiresAt: expiresAt },
    });
    await this.messaging.sendSms(
      phone,
      `Your TumaNow verification code is ${otp}. It expires in 10 minutes.`,
    );
    return otp;
  }
}
