import type { EmailProvider } from "./provider";
import { ResendProvider } from "./resend";

let _provider: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (!_provider) {
    _provider = new ResendProvider();
  }
  return _provider;
}

export type { EmailProvider, SendEmailPayload, SendEmailResult } from "./provider";
