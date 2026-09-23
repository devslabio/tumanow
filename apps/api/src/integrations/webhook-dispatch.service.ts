import { Injectable, Logger } from "@nestjs/common";
import { createHmac } from "node:crypto";

import { PrismaService } from "../prisma/prisma.service";

const MAX_ATTEMPTS = 4;
// 5s, 30s, 2min — spread out, but everything still resolves within a
// single process lifetime without needing a job queue.
const BACKOFF_MS = [5_000, 30_000, 120_000];
const TIMEOUT_MS = 8_000;

/**
 * Fires operator webhooks for shipment/payment/quote lifecycle events (doc
 * §51–52: event catalogue, signatures, retries). Delivery is in-process —
 * there's no queue/worker infrastructure in this stack yet — so a delivery
 * attempt that outlives the request is tracked via WebhookDelivery rows
 * rather than blocking the caller; see the "known limitations" note below.
 */
@Injectable()
export class WebhookDispatchService {
  private readonly logger = new Logger(WebhookDispatchService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Fire-and-forget: callers should not await delivery, only enqueueing. */
  emit(operatorId: string, event: string, payload: Record<string, unknown>): void {
    void this.dispatch(operatorId, event, payload).catch((err) =>
      this.logger.warn(`Webhook dispatch failed to enqueue: ${err}`),
    );
  }

  private async dispatch(
    operatorId: string,
    event: string,
    payload: Record<string, unknown>,
  ) {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: { operatorId, isActive: true },
    });
    if (!endpoints.length) return;

    const body = JSON.stringify({
      event,
      createdAt: new Date().toISOString(),
      data: payload,
    });

    for (const endpoint of endpoints) {
      const events = Array.isArray(endpoint.events)
        ? (endpoint.events as string[])
        : [];
      if (events.length && !events.includes(event)) continue;

      const delivery = await this.prisma.webhookDelivery.create({
        data: {
          webhookEndpointId: endpoint.id,
          event,
          payload: payload as object,
          status: "PENDING",
        },
      });

      void this.attempt(endpoint.id, endpoint.url, endpoint.secret, body, delivery.id, 0);
    }
  }

  private async attempt(
    endpointId: string,
    url: string,
    secret: string,
    body: string,
    deliveryId: string,
    attemptIndex: number,
  ): Promise<void> {
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tumanow-signature": `sha256=${signature}`,
        },
        body,
        signal: controller.signal,
      });
      const responseBody = await res.text().catch(() => "");

      if (res.ok) {
        await this.prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: "SUCCESS",
            attempts: { increment: 1 },
            responseStatus: res.status,
            responseBody: responseBody.slice(0, 2000),
            lastAttemptAt: new Date(),
          },
        });
        return;
      }
      await this.recordFailureAndMaybeRetry(
        endpointId,
        url,
        secret,
        body,
        deliveryId,
        attemptIndex,
        res.status,
        responseBody,
      );
    } catch (err) {
      await this.recordFailureAndMaybeRetry(
        endpointId,
        url,
        secret,
        body,
        deliveryId,
        attemptIndex,
        null,
        String(err),
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private async recordFailureAndMaybeRetry(
    endpointId: string,
    url: string,
    secret: string,
    body: string,
    deliveryId: string,
    attemptIndex: number,
    responseStatus: number | null,
    responseBody: string,
  ) {
    const nextAttemptIndex = attemptIndex + 1;
    const willRetry = nextAttemptIndex < MAX_ATTEMPTS;

    await this.prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: willRetry ? "PENDING" : "FAILED",
        attempts: { increment: 1 },
        responseStatus: responseStatus ?? undefined,
        responseBody: responseBody.slice(0, 2000),
        lastAttemptAt: new Date(),
      },
    });

    if (!willRetry) {
      this.logger.warn(
        `Webhook delivery ${deliveryId} to ${url} exhausted ${MAX_ATTEMPTS} attempts`,
      );
      return;
    }

    const delay = BACKOFF_MS[attemptIndex] ?? BACKOFF_MS[BACKOFF_MS.length - 1];
    setTimeout(() => {
      void this.attempt(endpointId, url, secret, body, deliveryId, nextAttemptIndex);
    }, delay);
  }
}
