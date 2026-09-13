import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PaymentMethod, PaymentStatus } from "@prisma/client";

import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { AuditService } from "../common/audit.service";
import { MessagingService } from "../messaging/messaging.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { TenantAccessService } from "../tenant/tenant-access.service";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TenantAccessService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly messaging: MessagingService,
  ) {}

  /** When true (default), sandbox auto-confirms after initiate. */
  private get autoConfirm() {
    return (process.env.PAYMENTS_AUTO_CONFIRM ?? "true").toLowerCase() !== "false";
  }

  async initiatePayment(
    user: TumaNowJwtPayload,
    shipmentId: string,
    method: PaymentMethod,
    payerPhone?: string,
  ) {
    if (!user.customerId) {
      throw new NotFoundException("Customer profile not found");
    }

    const shipment = await this.prisma.shipment.findFirst({
      where: {
        id: shipmentId,
        customerId: user.customerId,
        deletedAt: null,
      },
      include: {
        customer: { select: { phone: true, email: true, fullName: true } },
      },
    });
    if (!shipment) throw new NotFoundException("Shipment not found");

    if (shipment.isCod) {
      throw new BadRequestException(
        "This shipment is cash on delivery — no upfront payment required",
      );
    }

    if (!["AWAITING_PAYMENT", "APPROVED"].includes(shipment.status)) {
      throw new BadRequestException(
        `Cannot pay shipment in status ${shipment.status}`,
      );
    }

    const existingPending = await this.prisma.payment.findFirst({
      where: {
        shipmentId,
        status: { in: ["PENDING", "PROCESSING"] },
      },
      orderBy: { createdAt: "desc" },
    });
    if (existingPending) {
      if (this.autoConfirm) {
        return this.confirmPayment(user, existingPending.id, true);
      }
      return {
        payment: existingPending,
        shipment,
        sandbox: true,
        message: "Payment already in progress",
      };
    }

    const amount = Number(shipment.finalPrice ?? shipment.quotedPrice ?? 0);
    if (amount <= 0) {
      throw new BadRequestException("Shipment has no payable amount");
    }

    const phone =
      payerPhone?.trim() ||
      shipment.customer?.phone ||
      undefined;
    if ((method === "MTN_MOMO" || method === "AIRTEL_MONEY") && !phone) {
      throw new BadRequestException(
        "Mobile money payments require a payer phone number",
      );
    }

    const reference = `TN-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const payment = await this.prisma.payment.create({
      data: {
        shipmentId,
        method,
        status: "PROCESSING",
        amount,
        currency: shipment.currency,
        reference,
      },
    });

    await this.audit.log({
      operatorId: shipment.operatorId ?? undefined,
      userId: user.sub,
      action: "payment.initiate",
      entityType: "Payment",
      entityId: payment.id,
      after: { shipmentId, method, amount, status: "PROCESSING", phone },
    });

    // Prompt user via SMS in sandbox (provider stub)
    if (phone && (method === "MTN_MOMO" || method === "AIRTEL_MONEY")) {
      await this.messaging.sendSms(
        phone,
        `TumaNow: Approve ${amount.toLocaleString()} ${shipment.currency} for ${shipment.trackingNumber}. Ref ${reference}`,
        { paymentId: payment.id, method },
      );
    }

    await this.notifications.notifyCustomer(user.customerId, {
      type: "payment.initiated",
      title: "Payment started",
      body: `Approve ${amount.toLocaleString()} ${shipment.currency} for ${shipment.trackingNumber} (${method.replace(/_/g, " ")}).`,
      entityType: "Shipment",
      entityId: shipmentId,
      operatorId: shipment.operatorId ?? undefined,
    });

    if (this.autoConfirm) {
      return this.confirmPayment(user, payment.id, true);
    }

    return {
      payment,
      shipment,
      sandbox: true,
      message:
        "Payment initiated. In production, wait for provider callback; in sandbox call confirm.",
    };
  }

  /** Confirm a PROCESSING payment (webhook / sandbox). */
  async confirmPayment(
    user: TumaNowJwtPayload | null,
    paymentId: string,
    sandbox = false,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        shipment: true,
      },
    });
    if (!payment) throw new NotFoundException("Payment not found");

    if (payment.status === "COMPLETED") {
      return { payment, shipment: payment.shipment, alreadyCompleted: true };
    }
    if (payment.status !== "PROCESSING" && payment.status !== "PENDING") {
      throw new BadRequestException(
        `Cannot confirm payment in status ${payment.status}`,
      );
    }

    if (
      user &&
      user.customerId &&
      payment.shipment.customerId !== user.customerId &&
      !user.platformRoleKeys?.includes("SUPER_ADMIN")
    ) {
      throw new BadRequestException("Not allowed to confirm this payment");
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: "COMPLETED" as PaymentStatus, paidAt: new Date() },
    });

    const shipment = await this.prisma.shipment.update({
      where: { id: payment.shipmentId },
      data: { status: "PAID" },
    });

    await this.prisma.shipmentEvent.create({
      data: {
        shipmentId: payment.shipmentId,
        status: "PAID",
        note: `Payment completed via ${payment.method}${sandbox ? " (sandbox)" : ""}`,
        actorUserId: user?.sub,
        metadata: {
          paymentId: payment.id,
          reference: payment.reference,
          sandbox,
        },
      },
    });

    await this.audit.log({
      operatorId: payment.shipment.operatorId ?? undefined,
      userId: user?.sub,
      action: "payment.complete",
      entityType: "Payment",
      entityId: payment.id,
      after: {
        shipmentId: payment.shipmentId,
        method: payment.method,
        amount: payment.amount,
        status: "COMPLETED",
      },
    });

    await this.notifications.notifyCustomer(payment.shipment.customerId, {
      type: "payment.completed",
      title: "Payment successful",
      body: `Payment for ${payment.shipment.trackingNumber} is complete.`,
      entityType: "Shipment",
      entityId: payment.shipmentId,
      operatorId: payment.shipment.operatorId ?? undefined,
    });

    if (payment.shipment.operatorId) {
      await this.notifications.notifyOperatorUsers(payment.shipment.operatorId, {
        type: "payment.received",
        title: "Payment received",
        body: `Payment for ${payment.shipment.trackingNumber} via ${payment.method}`,
        entityType: "Shipment",
        entityId: payment.shipmentId,
      });
    }

    return { payment: updatedPayment, shipment, sandbox };
  }

  async failPayment(paymentId: string, reason?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { shipment: true },
    });
    if (!payment) throw new NotFoundException("Payment not found");
    if (payment.status === "COMPLETED") {
      throw new BadRequestException("Payment already completed");
    }

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: "FAILED" },
    });

    await this.notifications.notifyCustomer(payment.shipment.customerId, {
      type: "payment.failed",
      title: "Payment failed",
      body:
        reason ??
        `Payment for ${payment.shipment.trackingNumber} failed. Please try again.`,
      entityType: "Shipment",
      entityId: payment.shipmentId,
      operatorId: payment.shipment.operatorId ?? undefined,
    });

    return updated;
  }

  /** Back-compat alias used by controller. */
  async payShipment(
    user: TumaNowJwtPayload,
    shipmentId: string,
    method: PaymentMethod,
    payerPhone?: string,
  ) {
    return this.initiatePayment(user, shipmentId, method, payerPhone);
  }

  async listForCustomer(user: TumaNowJwtPayload, shipmentId?: string) {
    if (!user.customerId) {
      throw new NotFoundException("Customer profile not found");
    }
    return this.prisma.payment.findMany({
      where: {
        shipment: {
          customerId: user.customerId,
          deletedAt: null,
          ...(shipmentId ? { id: shipmentId } : {}),
        },
      },
      include: {
        shipment: {
          select: { id: true, trackingNumber: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async listForOperator(user: TumaNowJwtPayload) {
    this.access.assertOperator(user);
    return this.prisma.payment.findMany({
      where: {
        shipment: {
          operatorId: user.operatorId!,
          deletedAt: null,
        },
      },
      include: {
        shipment: {
          select: {
            id: true,
            trackingNumber: true,
            status: true,
            customer: { select: { fullName: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
}
