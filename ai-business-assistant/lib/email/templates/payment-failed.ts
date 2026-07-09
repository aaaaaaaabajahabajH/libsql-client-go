import { baseTemplate, h1, subtitle, paragraph, ctaButton, divider, warningBox, infoBox } from "./base";

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

export interface PaymentFailedEmailData {
  name: string;
  amount: string;
  plan: string;
  failedDate: string;
  retryDate?: string;
}

export function paymentFailedEmail(
  data: PaymentFailedEmailData,
): { subject: string; html: string } {
  const displayName = data.name || "there";
  const planLabel = data.plan.charAt(0).toUpperCase() + data.plan.slice(1);

  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:56px;height:56px;background-color:#fee2e2;border-radius:14px;line-height:56px;font-size:28px;">⚠️</div>
    </div>

    ${h1("Payment failed")}
    ${subtitle(`Hi ${displayName}, we couldn't process your payment.`)}

    ${warningBox("Action required — please update your payment method to keep your subscription active.")}

    ${infoBox([
      { label: "Plan", value: planLabel },
      { label: "Amount", value: data.amount },
      { label: "Failed On", value: data.failedDate },
      ...(data.retryDate ? [{ label: "Next Retry", value: data.retryDate }] : []),
    ])}

    ${paragraph("Your subscription is still active, but if we can't collect payment, your account will be downgraded to the Free plan. Please update your payment details to avoid any interruption.")}

    ${ctaButton("Update Payment Method", `${APP_URL}/dashboard/billing`)}

    ${divider()}

    <p style="margin:0;font-size:13px;color:#71717a;line-height:1.6;">
      Common reasons for failed payments: card expired, insufficient funds, or billing address mismatch.
      <a href="${APP_URL}/dashboard/billing" style="color:#6366f1;text-decoration:none;">Update your card details</a> to resolve this.
    </p>
  `;

  return {
    subject: `Action required: Payment of ${data.amount} failed`,
    html: baseTemplate(content),
  };
}
