import { baseTemplate, h1, subtitle, paragraph, ctaButton, divider, infoBox } from "./base";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export interface SubscriptionActivatedEmailData {
  name: string;
  plan: string;
  monthlyCredits: string;
  billingDate: string;
  amount: string;
}

const PLAN_FEATURES: Record<string, string[]> = {
  starter: ["500 AI credits/month", "All 6 AI tools", "History & saved docs", "Email support"],
  pro: ["Unlimited AI credits", "All 6 AI tools", "Priority processing", "Priority support"],
  enterprise: ["Unlimited AI credits", "All 6 AI tools", "Dedicated support", "Custom integrations"],
};

export function subscriptionActivatedEmail(
  data: SubscriptionActivatedEmailData,
): { subject: string; html: string } {
  const displayName = data.name || "there";
  const planLabel = data.plan.charAt(0).toUpperCase() + data.plan.slice(1);
  const features = PLAN_FEATURES[data.plan.toLowerCase()] ?? [];

  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:56px;height:56px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:14px;line-height:56px;font-size:28px;">🚀</div>
    </div>

    ${h1(`You're on ${planLabel}!`)}
    ${subtitle(`Hi ${displayName}, your subscription has been activated.`)}

    ${paragraph(`Your <strong>${planLabel} plan</strong> is now active. Here's a summary of your subscription:`)}

    ${infoBox([
      { label: "Plan", value: planLabel },
      { label: "Monthly Credits", value: data.monthlyCredits },
      { label: "Amount", value: data.amount },
      { label: "Next Billing Date", value: data.billingDate },
    ])}

    ${
      features.length > 0
        ? `<p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#18181b;">Your plan includes:</p>
           <ul style="margin:0 0 24px;padding-left:20px;">
             ${features.map((f) => `<li style="margin-bottom:6px;font-size:14px;color:#3f3f46;">${f}</li>`).join("")}
           </ul>`
        : ""
    }

    ${ctaButton("Go to Dashboard", `${APP_URL}/dashboard`)}

    ${divider()}

    ${paragraph(`Manage your subscription, download invoices, or update your payment method in your <a href="${APP_URL}/billing" style="color:#6366f1;text-decoration:none;">billing settings</a>.`)}
  `;

  return {
    subject: `Your ${planLabel} subscription is now active!`,
    html: baseTemplate(content),
  };
}
