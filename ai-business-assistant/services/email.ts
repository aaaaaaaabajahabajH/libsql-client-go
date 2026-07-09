import { createAdminClient } from "@/lib/supabase/admin";
import { getEmailProvider } from "@/lib/email";
import { enqueueEmail } from "@/lib/email/queue";

import { welcomeEmail, type WelcomeEmailData } from "@/lib/email/templates/welcome";
import { verifyEmailEmail, type VerifyEmailData } from "@/lib/email/templates/verify-email";
import { passwordResetEmail, type PasswordResetEmailData } from "@/lib/email/templates/password-reset";
import { subscriptionActivatedEmail, type SubscriptionActivatedEmailData } from "@/lib/email/templates/subscription-activated";
import { subscriptionCancelledEmail, type SubscriptionCancelledEmailData } from "@/lib/email/templates/subscription-cancelled";
import { paymentSuccessfulEmail, type PaymentSuccessfulEmailData } from "@/lib/email/templates/payment-successful";
import { paymentFailedEmail, type PaymentFailedEmailData } from "@/lib/email/templates/payment-failed";
import { creditsResetEmail, type CreditsResetEmailData } from "@/lib/email/templates/credits-reset";
import { weeklySummaryEmail, type WeeklySummaryEmailData } from "@/lib/email/templates/weekly-summary";
import { aiCompletedEmail, type AiCompletedEmailData } from "@/lib/email/templates/ai-completed";

async function sendAndLog(
  emailType: string,
  toAddress: string,
  subject: string,
  html: string,
  userId?: string | null,
): Promise<void> {
  const admin = createAdminClient();
  const provider = getEmailProvider();

  const { data: log } = await admin
    .from("email_logs")
    .insert({ email_type: emailType, to_address: toAddress, subject, user_id: userId ?? null, status: "pending" })
    .select("id")
    .single();

  const logId = log?.id as string | undefined;

  const result = await provider.send({ to: toAddress, subject, html });

  if (logId) {
    if (result.success) {
      await admin
        .from("email_logs")
        .update({ status: "sent", provider_message_id: result.messageId ?? null, sent_at: new Date().toISOString() })
        .eq("id", logId);
    } else {
      await admin
        .from("email_logs")
        .update({ status: "failed", error_message: result.error ?? null })
        .eq("id", logId);
    }
  }

  if (!result.success) {
    await enqueueEmail({ emailType, toAddress, subject, htmlBody: html, userId: userId ?? null });
  }
}

export async function sendWelcomeEmail(toAddress: string, data: WelcomeEmailData, userId?: string): Promise<void> {
  const { subject, html } = welcomeEmail(data);
  await sendAndLog("welcome", toAddress, subject, html, userId);
}

export async function sendVerifyEmail(toAddress: string, data: VerifyEmailData, userId?: string): Promise<void> {
  const { subject, html } = verifyEmailEmail(data);
  await sendAndLog("verify-email", toAddress, subject, html, userId);
}

export async function sendPasswordResetEmail(toAddress: string, data: PasswordResetEmailData, userId?: string): Promise<void> {
  const { subject, html } = passwordResetEmail(data);
  await sendAndLog("password-reset", toAddress, subject, html, userId);
}

export async function sendSubscriptionActivatedEmail(
  toAddress: string,
  data: SubscriptionActivatedEmailData,
  userId?: string,
): Promise<void> {
  const { subject, html } = subscriptionActivatedEmail(data);
  await sendAndLog("subscription-activated", toAddress, subject, html, userId);
}

export async function sendSubscriptionCancelledEmail(
  toAddress: string,
  data: SubscriptionCancelledEmailData,
  userId?: string,
): Promise<void> {
  const { subject, html } = subscriptionCancelledEmail(data);
  await sendAndLog("subscription-cancelled", toAddress, subject, html, userId);
}

export async function sendPaymentSuccessfulEmail(
  toAddress: string,
  data: PaymentSuccessfulEmailData,
  userId?: string,
): Promise<void> {
  const { subject, html } = paymentSuccessfulEmail(data);
  await sendAndLog("payment-successful", toAddress, subject, html, userId);
}

export async function sendPaymentFailedEmail(
  toAddress: string,
  data: PaymentFailedEmailData,
  userId?: string,
): Promise<void> {
  const { subject, html } = paymentFailedEmail(data);
  await sendAndLog("payment-failed", toAddress, subject, html, userId);
}

export async function sendCreditsResetEmail(
  toAddress: string,
  data: CreditsResetEmailData,
  userId?: string,
): Promise<void> {
  const { subject, html } = creditsResetEmail(data);
  await sendAndLog("credits-reset", toAddress, subject, html, userId);
}

export async function sendWeeklySummaryEmail(
  toAddress: string,
  data: WeeklySummaryEmailData,
  userId?: string,
): Promise<void> {
  const { subject, html } = weeklySummaryEmail(data);
  await sendAndLog("weekly-summary", toAddress, subject, html, userId);
}

export async function sendAiCompletedEmail(
  toAddress: string,
  data: AiCompletedEmailData,
  userId?: string,
): Promise<void> {
  const { subject, html } = aiCompletedEmail(data);
  await sendAndLog("ai-completed", toAddress, subject, html, userId);
}
