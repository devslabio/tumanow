import { Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "node:crypto";

import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { AuditService } from "../common/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { TenantAccessService } from "../tenant/tenant-access.service";
import { WEBHOOK_EVENTS } from "./webhook-events";

const LIST_SELECT = {
  id: true,
  url: true,
  events: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class WebhooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TenantAccessService,
    private readonly audit: AuditService,
  ) {}

  async list(user: TumaNowJwtPayload) {
    this.access.assertOperator(user);
    const rows = await this.prisma.webhookEndpoint.findMany({
      where: { operatorId: user.operatorId! },
      select: LIST_SELECT,
      orderBy: { createdAt: "desc" },
    });
    return rows;
  }

  /** Returns the raw secret exactly once — subsequent reads only show a masked preview. */
  async create(user: TumaNowJwtPayload, url: string, events?: string[]) {
    this.access.assertOperator(user);
    const secret = `whsec_${randomBytes(24).toString("hex")}`;
    const created = await this.prisma.webhookEndpoint.create({
      data: {
        operatorId: user.operatorId!,
        url,
        secret,
        events: events ?? [],
      },
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "webhook.create",
      entityType: "WebhookEndpoint",
      entityId: created.id,
      after: { url, events: events ?? [] },
    });

    return {
      id: created.id,
      url: created.url,
      events: created.events,
      isActive: created.isActive,
      secret,
      warning: "This is the only time the full secret is shown. Store it securely.",
    };
  }

  async update(
    user: TumaNowJwtPayload,
    id: string,
    input: { url?: string; events?: string[]; isActive?: boolean },
  ) {
    this.access.assertOperator(user);
    const existing = await this.prisma.webhookEndpoint.findFirst({
      where: { id, operatorId: user.operatorId! },
    });
    if (!existing) throw new NotFoundException("Webhook endpoint not found");

    const updated = await this.prisma.webhookEndpoint.update({
      where: { id },
      data: {
        url: input.url,
        events: input.events,
        isActive: input.isActive,
      },
      select: LIST_SELECT,
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "webhook.update",
      entityType: "WebhookEndpoint",
      entityId: id,
      before: { url: existing.url, events: existing.events, isActive: existing.isActive },
      after: input,
    });

    return updated;
  }

  async remove(user: TumaNowJwtPayload, id: string) {
    this.access.assertOperator(user);
    const existing = await this.prisma.webhookEndpoint.findFirst({
      where: { id, operatorId: user.operatorId! },
    });
    if (!existing) throw new NotFoundException("Webhook endpoint not found");

    await this.prisma.webhookEndpoint.delete({ where: { id } });
    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "webhook.delete",
      entityType: "WebhookEndpoint",
      entityId: id,
    });
    return { ok: true };
  }

  async recentDeliveries(user: TumaNowJwtPayload, id: string) {
    this.access.assertOperator(user);
    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: { id, operatorId: user.operatorId! },
    });
    if (!endpoint) throw new NotFoundException("Webhook endpoint not found");

    return this.prisma.webhookDelivery.findMany({
      where: { webhookEndpointId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  listEventCatalogue() {
    return WEBHOOK_EVENTS;
  }
}
