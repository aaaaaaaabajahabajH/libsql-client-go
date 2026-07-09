import { Resend } from "resend";
import type { EmailProvider, SendEmailPayload, SendEmailResult } from "./provider";

export class ResendProvider implements EmailProvider {
  private client: Resend;
  private from: string;

  constructor() {
    this.client = new Resend(process.env.RESEND_API_KEY ?? "");
    const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "AI Business Suite";
    const fromAddress = process.env.EMAIL_FROM ?? "noreply@example.com";
    this.from = `${appName} <${fromAddress}>`;
  }

  async send(payload: SendEmailPayload): Promise<SendEmailResult> {
    try {
      const { data, error } = await this.client.emails.send({
        from: this.from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        replyTo: payload.replyTo,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data?.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return { success: false, error: message };
    }
  }
}
