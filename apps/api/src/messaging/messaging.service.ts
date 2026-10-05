import { Injectable, Logger } from "@nestjs/common";

export type OutboundMessage = {
  channel: "sms" | "email";
  to: string;
  subject?: string;
  body: string;
  meta?: Record<string, unknown>;
};

export type DispatchResult = {
  ok: boolean;
  skipped: boolean;
  mode: string;
  provider?: string;
  error?: string;
};

/**
 * Messaging gateway. Three modes via MESSAGING_MODE:
 *   off  — no-op, doesn't even log (e.g. quiet test runs)
 *   log  — print to the console instead of sending (default; no provider
 *          credentials required, safe for local/dev)
 *   live — send through a real provider (SMS via Africa's Talking, email via
 *          SendGrid). Falls back to log mode automatically if the relevant
 *          provider's credentials aren't set, so flipping MESSAGING_MODE to
 *          "live" without configuring a provider never breaks the app —
 *          it just keeps behaving like dev mode for that channel.
 *
 * A send failure never throws: callers fire-and-forget notifications and
 * shouldn't have a downed SMS gateway take out a shipment update.
 */
@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  get mode() {
    return (process.env.MESSAGING_MODE ?? "log").toLowerCase();
  }

  async sendSms(
    to: string,
    body: string,
    meta?: Record<string, unknown>,
  ): Promise<DispatchResult> {
    return this.dispatch({ channel: "sms", to, body, meta });
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    meta?: Record<string, unknown>,
  ): Promise<DispatchResult> {
    return this.dispatch({ channel: "email", to, subject, body, meta });
  }

  private async dispatch(message: OutboundMessage): Promise<DispatchResult> {
    if (this.mode === "off") {
      return { ok: true, skipped: true, mode: this.mode };
    }

    if (this.mode === "live") {
      const result =
        message.channel === "sms"
          ? await this.sendViaAfricasTalking(message)
          : await this.sendViaSendGrid(message);
      if (result?.ok) return result;

      // Either the provider isn't configured (result is null) or the send
      // failed (result carries the error). Either way, log the content so
      // it isn't silently lost, but surface the failure if there was one.
      this.logContent(message);
      return result ?? { ok: true, skipped: false, mode: this.mode };
    }

    this.logContent(message);
    return { ok: true, skipped: false, mode: this.mode };
  }

  private logContent(message: OutboundMessage) {
    this.logger.log(
      `[${message.channel.toUpperCase()}] to=${message.to}` +
        (message.subject ? ` subject="${message.subject}"` : "") +
        ` body="${message.body}"` +
        (message.meta ? ` meta=${JSON.stringify(message.meta)}` : ""),
    );
  }

  /** Returns null (not a failure) when Africa's Talking isn't configured, so the caller falls back to log mode. */
  private async sendViaAfricasTalking(
    message: OutboundMessage,
  ): Promise<DispatchResult | null> {
    const apiKey = process.env.AFRICASTALKING_API_KEY;
    const username = process.env.AFRICASTALKING_USERNAME;
    if (!apiKey || !username) return null;

    const base = process.env.AFRICASTALKING_API_BASE ?? "https://api.africastalking.com";
    const params = new URLSearchParams({
      username,
      to: message.to,
      message: message.body,
      ...(process.env.AFRICASTALKING_SENDER_ID
        ? { from: process.env.AFRICASTALKING_SENDER_ID }
        : {}),
    });

    try {
      const res = await fetch(`${base}/version1/messaging`, {
        method: "POST",
        headers: {
          apiKey,
          "content-type": "application/x-www-form-urlencoded",
          accept: "application/json",
        },
        body: params.toString(),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        this.logger.warn(`Africa's Talking SMS failed (${res.status}): ${text}`);
        return { ok: false, skipped: false, mode: this.mode, provider: "africastalking", error: text };
      }
      return { ok: true, skipped: false, mode: this.mode, provider: "africastalking" };
    } catch (err) {
      this.logger.warn(`Africa's Talking SMS request failed: ${err}`);
      return {
        ok: false,
        skipped: false,
        mode: this.mode,
        provider: "africastalking",
        error: String(err),
      };
    }
  }

  /** Returns null (not a failure) when SendGrid isn't configured, so the caller falls back to log mode. */
  private async sendViaSendGrid(message: OutboundMessage): Promise<DispatchResult | null> {
    const apiKey = process.env.SENDGRID_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey || !from) return null;

    const base = process.env.SENDGRID_API_BASE ?? "https://api.sendgrid.com";

    try {
      const res = await fetch(`${base}/v3/mail/send`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: message.to }] }],
          from: { email: from, name: "TumaNow" },
          subject: message.subject ?? "TumaNow",
          content: [{ type: "text/plain", value: message.body }],
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        this.logger.warn(`SendGrid email failed (${res.status}): ${text}`);
        return { ok: false, skipped: false, mode: this.mode, provider: "sendgrid", error: text };
      }
      return { ok: true, skipped: false, mode: this.mode, provider: "sendgrid" };
    } catch (err) {
      this.logger.warn(`SendGrid email request failed: ${err}`);
      return { ok: false, skipped: false, mode: this.mode, provider: "sendgrid", error: String(err) };
    }
  }
}
