import { baseTemplate, h1, subtitle, paragraph, ctaButton, divider, infoBox } from "./base";

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

export interface PaymentSuccessfulEmailData {
  name: string;
  amount: string;
  plan: string;
  invoiceId: string;
  invoiceUrl?: string;
  billingDate: string;
  nextBillingDate: string;
}

export function paymentSuccessfulEmail(
  data: PaymentSuccessfulEmailData,
): { subject: string; html: string } {
  const displayName = data.name || "there";
  const planLabel = data.plan.charAt(0).toUpperCase() + data.plan.slice(1);

  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:56px;height:56px;background-color:#dcfce7;border-radius:14px;line-height:56px;font-size:28px;">✅</div>
    </div>

    ${h1("Payment successful")}
    ${subtitle(`Hi ${displayName}, your payment has been processed.`)}

    ${paragraph("Thank you for your payment. Here's your receipt:")}

    ${infoBox([
      { label: "Invoice ID", value: data.invoiceId },
      { label: "Plan", value: planLabel },
      { label: "Amount Paid", value: data.amount },
      { label: "Payment Date", value: data.billingDate },
      { label: "Next Billing Date", value: data.nextBillingDate },
    ])}

    ${
      data.invoiceUrl
        ? ctaButton("Download Invoice", data.invoiceUrl)
        : ctaButton("View Billing", `${APP_URL}/dashboard/billing`)
    }

    ${divider()}

    ${paragraph(`Questions about your invoice? <a href="${APP_URL}/dashboard/billing" style="color:#6366f1;text-decoration:none;">Visit your billing page</a> or reply to this email.`)}
  `;

  return {
    subject: `Payment receipt — ${data.amount} for ${planLabel}`,
    html: baseTemplate(content),
  };
}
