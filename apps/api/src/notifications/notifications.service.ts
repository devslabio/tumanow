import { Injectable } from "@nestjs/common";

import { MessagingService } from "../messaging/messaging.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messaging: MessagingService,
  ) {}

  async create(input: {
    userId?: string;
    operatorId?: string;
    customerId?: string;
    type: string;
    title: string;
    body?: string;
    entityType?: string;
    entityId?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        operatorId: input.operatorId,
        customerId: input.customerId,
        type: input.type,
        title: input.title,
        body: input.body,
        entityType: input.entityType,
        entityId: input.entityId,
      },
    });

    // Fan-out SMS/email when we can resolve contact details
    void this.fanOut(input).catch(() => {
      /* never block business flow on messaging */
    });

    return notification;
  }

  private async fanOut(input: {
    userId?: string;
    customerId?: string;
    operatorId?: string;
    title: string;
    body?: string;
    type: string;
    entityId?: string;
  }) {
    const text = input.body ? `${input.title}: ${input.body}` : input.title;

    if (input.customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: input.customerId },
        select: { phone: true, email: true, fullName: true },
      });
      if (customer?.phone) {
        await this.messaging.sendSms(customer.phone, text, {
          type: input.type,
          entityId: input.entityId,
        });
      }
      if (customer?.email) {
        await this.messaging.sendEmail(customer.email, input.title, text, {
          type: input.type,
          entityId: input.entityId,
        });
      }
      return;
    }

    if (input.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: input.userId },
        select: { phone: true, email: true },
      });
      if (user?.phone) {
        await this.messaging.sendSms(user.phone, text, { type: input.type });
      }
      if (user?.email) {
        await this.messaging.sendEmail(user.email, input.title, text, {
          type: input.type,
        });
      }
    }
  }

  async notifyCustomer(
    customerId: string,
    input: {
      type: string;
      title: string;
      body?: string;
      entityType?: string;
      entityId?: string;
      operatorId?: string;
    },
  ) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { userId: true },
    });
    return this.create({
      customerId,
      userId: customer?.userId ?? undefined,
      operatorId: input.operatorId,
      type: input.type,
      title: input.title,
      body: input.body,
      entityType: input.entityType,
      entityId: input.entityId,
    });
  }

  async notifyOperatorUsers(
    operatorId: string,
    input: {
      type: string;
      title: string;
      body?: string;
      entityType?: string;
      entityId?: string;
    },
  ) {
    // Platform-style operator inbox: store against operatorId (visible via membership users later)
    return this.create({
      operatorId,
      type: input.type,
      title: input.title,
      body: input.body,
      entityType: input.entityType,
      entityId: input.entityId,
    });
  }

  async listForUser(
    userId: string,
    opts?: { customerId?: string; operatorId?: string },
  ) {
    return this.prisma.notification.findMany({
      where: {
        OR: [
          { userId },
          ...(opts?.customerId ? [{ customerId: opts.customerId }] : []),
          ...(opts?.operatorId ? [{ operatorId: opts.operatorId }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async markRead(userId: string, id: string, customerId?: string, operatorId?: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        OR: [
          { userId },
          ...(customerId ? [{ customerId }] : []),
          ...(operatorId ? [{ operatorId }] : []),
        ],
      },
    });
    if (!notification) return null;
    if (notification.readAt) return notification;
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }
}
