import { baseTemplate, h1, subtitle, paragraph, ctaButton, divider, infoBox, warningBox } from "./base";

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

export interface SubscriptionCancelledEmailData {
  name: string;
  plan: string;
  accessUntil: string;
}

export function subscriptionCancelledEmail(
  data: SubscriptionCancelledEmailData,
): { subject: string; html: string } {
  const displayName = data.name || "there";
  const planLabel = data.plan.charAt(0).toUpperCase() + data.plan.slice(1);

  const content = `
    ${h1("Subscription cancelled")}
    ${subtitle(`Hi ${displayName}, your ${planLabel} subscription has been cancelled.`)}

    ${paragraph("We're sorry to see you go. Your subscription has been cancelled and you won't be charged again.")}

    ${infoBox([
      { label: "Plan Cancelled", value: planLabel },
      { label: "Access Until", value: data.accessUntil },
      { label: "After That", value: "Free plan (20 credits/month)" },
    ])}

    ${warningBox(`You'll still have full ${planLabel} access until <strong>${data.accessUntil}</strong>. After that, your account will revert to the Free plan.`)}

    ${paragraph("Changed your mind? You can reactivate your subscription at any time from your billing settings — you won't lose any of your saved content.")}

    ${ctaButton("Reactivate Subscription", `${APP_URL}/dashboard/billing`)}

    ${divider()}

    <p style="margin:0;font-size:13px;color:#71717a;line-height:1.6;">
      We'd love to hear why you cancelled. <a href="mailto:support@${APP_URL.replace(/^https?:\/\//, "")}" style="color:#6366f1;text-decoration:none;">Reply to this email</a> to share your feedback — it helps us improve.
    </p>
  `;

  return {
    subject: `Your ${planLabel} subscription has been cancelled`,
    html: baseTemplate(content),
  };
}
