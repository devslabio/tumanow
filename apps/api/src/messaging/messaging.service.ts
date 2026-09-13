import { Injectable, Logger } from "@nestjs/common";

export type OutboundMessage = {
  channel: "sms" | "email";
  to: string;
  subject?: string;
  body: string;
  meta?: Record<string, unknown>;
};

/**
 * Sandbox messaging provider.
 * Set MESSAGING_MODE=log (default) to print messages.
 * Later swap for MTN SMS / SendGrid without changing callers.
 */
@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  get mode() {
    return (process.env.MESSAGING_MODE ?? "log").toLowerCase();
  }

  async sendSms(to: string, body: string, meta?: Record<string, unknown>) {
    return this.dispatch({ channel: "sms", to, body, meta });
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    meta?: Record<string, unknown>,
  ) {
    return this.dispatch({ channel: "email", to, subject, body, meta });
  }

  private async dispatch(message: OutboundMessage) {
    if (this.mode === "off") {
      return { ok: true, skipped: true };
    }

    // Production hooks would go here (MoMo SMS gateway, SendGrid, etc.)
    this.logger.log(
      `[${message.channel.toUpperCase()}] to=${message.to}` +
        (message.subject ? ` subject="${message.subject}"` : "") +
        ` body="${message.body}"` +
        (message.meta ? ` meta=${JSON.stringify(message.meta)}` : ""),
    );

    return { ok: true, skipped: false, mode: this.mode };
  }
}
