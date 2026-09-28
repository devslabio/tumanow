import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";

import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { AuditService } from "../common/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { TenantAccessService } from "../tenant/tenant-access.service";

@Injectable()
export class CorporateAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TenantAccessService,
    private readonly audit: AuditService,
  ) {}

  async listForOperator(user: TumaNowJwtPayload) {
    this.access.assertOperator(user);
    return this.prisma.corporateAccount.findMany({
      where: { operatorId: user.operatorId! },
      include: {
        customer: {
          select: { id: true, companyName: true, fullName: true, email: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Looks up a business customer by their exact email so an operator can set
   * up postpaid terms for them. Deliberately not a browsable directory —
   * customers aren't "owned" by an operator, so this only resolves an exact
   * match the operator already knows, the same convention as adding a
   * company teammate by email.
   */
  async searchBusinessCustomer(user: TumaNowJwtPayload, email: string) {
    this.access.assertOperator(user);
    const customer = await this.prisma.customer.findFirst({
      where: { email: email.trim().toLowerCase(), type: "BUSINESS", deletedAt: null },
      select: { id: true, companyName: true, fullName: true, email: true },
    });
    if (!customer) {
      throw new NotFoundException("No business customer found with that email");
    }
    return customer;
  }

  /** Create (or update the terms of) a postpaid account for a business customer. */
  async upsert(
    user: TumaNowJwtPayload,
    customerId: string,
    creditLimit: number,
  ) {
    this.access.assertOperator(user);

    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, deletedAt: null },
    });
    if (!customer) throw new NotFoundException("Customer not found");
    if (customer.type !== "BUSINESS") {
      throw new BadRequestException(
        "Postpaid corporate accounts are only available to BUSINESS customers",
      );
    }

    const account = await this.prisma.corporateAccount.upsert({
      where: { operatorId_customerId: { operatorId: user.operatorId!, customerId } },
      create: {
        operatorId: user.operatorId!,
        customerId,
        status: "ACTIVE",
        creditLimit,
      },
      update: { creditLimit },
      include: { customer: { select: { companyName: true, fullName: true } } },
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "corporate_account.upsert",
      entityType: "CorporateAccount",
      entityId: account.id,
      after: { customerId, creditLimit },
    });

    return account;
  }

  async setStatus(
    user: TumaNowJwtPayload,
    id: string,
    status: "ACTIVE" | "SUSPENDED",
  ) {
    this.access.assertOperator(user);
    const existing = await this.prisma.corporateAccount.findFirst({
      where: { id, operatorId: user.operatorId! },
    });
    if (!existing) throw new NotFoundException("Corporate account not found");

    const updated = await this.prisma.corporateAccount.update({
      where: { id },
      data: { status },
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "corporate_account.status",
      entityType: "CorporateAccount",
      entityId: id,
      before: { status: existing.status },
      after: { status },
    });

    return updated;
  }

  async listForCustomer(user: TumaNowJwtPayload) {
    if (!user.customerId) throw new NotFoundException("Customer profile not found");
    return this.prisma.corporateAccount.findMany({
      where: { customerId: user.customerId },
      include: {
        operator: { select: { id: true, tradingName: true, legalName: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /** Internal helper used by shipment creation/approval — not exposed directly. */
  async getActiveForBilling(operatorId: string, customerId: string) {
    return this.prisma.corporateAccount.findFirst({
      where: { operatorId, customerId, status: "ACTIVE" },
    });
  }
}
