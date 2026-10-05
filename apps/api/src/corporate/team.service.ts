import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { AuditService } from "../common/audit.service";
import { MessagingService } from "../messaging/messaging.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly messaging: MessagingService,
  ) {}

  private assertOwner(user: TumaNowJwtPayload) {
    if (!user.customerId) throw new NotFoundException("Customer profile not found");
    if (user.customerRole !== "OWNER") {
      throw new ForbiddenException("Only the account owner can manage the team");
    }
  }

  async list(user: TumaNowJwtPayload) {
    if (!user.customerId) throw new NotFoundException("Customer profile not found");

    const customer = await this.prisma.customer.findFirst({
      where: { id: user.customerId },
      include: { user: { select: { id: true, email: true, fullName: true } } },
    });
    if (!customer) throw new NotFoundException("Customer not found");

    const memberships = await this.prisma.customerMembership.findMany({
      where: { customerId: user.customerId, status: "ACTIVE" },
      include: { user: { select: { id: true, email: true, fullName: true } } },
      orderBy: { createdAt: "asc" },
    });

    const rows = memberships
      // The owner's own User row can also end up here if they were ever
      // added as a membership row explicitly — don't list them twice.
      .filter((m) => m.userId !== customer.user?.id)
      .map((m) => ({
        membershipId: m.id,
        userId: m.user.id,
        email: m.user.email,
        fullName: m.user.fullName,
        role: m.role,
      }));

    if (customer.user) {
      rows.unshift({
        membershipId: null as unknown as string,
        userId: customer.user.id,
        email: customer.user.email,
        fullName: customer.user.fullName,
        role: "OWNER" as const,
      });
    }

    return rows;
  }

  async addMember(user: TumaNowJwtPayload, email: string, role: "MEMBER" | "OWNER") {
    this.assertOwner(user);

    const customer = await this.prisma.customer.findFirst({
      where: { id: user.customerId! },
    });
    if (!customer) throw new NotFoundException("Customer not found");
    if (customer.type !== "BUSINESS") {
      throw new BadRequestException("Only business accounts can have a team");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const target = await this.prisma.user.findFirst({
      where: { email: normalizedEmail, deletedAt: null },
    });
    if (!target) {
      throw new BadRequestException(
        "No TumaNow account found for that email — ask them to register first",
      );
    }

    const existing = await this.prisma.customerMembership.findUnique({
      where: { customerId_userId: { customerId: customer.id, userId: target.id } },
    });
    if (existing) {
      if (existing.status === "ACTIVE") {
        throw new ConflictException("That person is already on the team");
      }
      const reactivated = await this.prisma.customerMembership.update({
        where: { id: existing.id },
        data: { status: "ACTIVE", role },
      });
      return reactivated;
    }

    const created = await this.prisma.customerMembership.create({
      data: { customerId: customer.id, userId: target.id, role },
    });

    await this.audit.log({
      userId: user.sub,
      action: "customer_team.add",
      entityType: "CustomerMembership",
      entityId: created.id,
      after: { customerId: customer.id, userId: target.id, role },
    });

    await this.messaging.sendEmail(
      target.email,
      "You've been added to a TumaNow company account",
      `${customer.companyName ?? "A company"} added you (${role.toLowerCase()}) to their TumaNow account. Log in to start creating and tracking shipments under it.`,
    );

    return created;
  }

  async removeMember(user: TumaNowJwtPayload, membershipId: string) {
    this.assertOwner(user);

    const membership = await this.prisma.customerMembership.findFirst({
      where: { id: membershipId, customerId: user.customerId! },
    });
    if (!membership) throw new NotFoundException("Team member not found");

    await this.prisma.customerMembership.update({
      where: { id: membershipId },
      data: { status: "REMOVED" },
    });

    await this.audit.log({
      userId: user.sub,
      action: "customer_team.remove",
      entityType: "CustomerMembership",
      entityId: membershipId,
    });

    return { ok: true };
  }
}
