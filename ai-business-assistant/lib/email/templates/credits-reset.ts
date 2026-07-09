import { baseTemplate, h1, subtitle, paragraph, ctaButton, divider, infoBox } from "./base";

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

export interface CreditsResetEmailData {
  name: string;
  plan: string;
  newBalance: number;
  resetDate: string;
  nextResetDate: string;
}

export function creditsResetEmail(
  data: CreditsResetEmailData,
): { subject: string; html: string } {
  const displayName = data.name || "there";
  const planLabel = data.plan.charAt(0).toUpperCase() + data.plan.slice(1);
  const isUnlimited = data.newBalance >= 999_999;

  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:56px;height:56px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:14px;line-height:56px;font-size:28px;">⚡</div>
    </div>

    ${h1("Your credits have been reset!")}
    ${subtitle(`Hi ${displayName}, your monthly AI credits are refreshed and ready to use.`)}

    ${infoBox([
      { label: "Plan", value: planLabel },
      { label: "New Balance", value: isUnlimited ? "Unlimited" : `${data.newBalance.toLocaleString()} credits` },
      { label: "Reset On", value: data.resetDate },
      { label: "Next Reset", value: data.nextResetDate },
    ])}

    ${paragraph(`Your ${isUnlimited ? "unlimited" : data.newBalance.toLocaleString() + " monthly"} credits are ready to fuel your creativity. Start creating amazing content with our AI tools.`)}

    ${ctaButton("Start Creating", `${APP_URL}/dashboard/tools`)}

    ${divider()}

    ${paragraph(`Want more credits or faster processing? <a href="${APP_URL}/dashboard/billing" style="color:#6366f1;text-decoration:none;">Explore our plans</a> to unlock unlimited AI power.`)}
  `;

  return {
    subject: "Your AI credits have been reset — ready to create!",
    html: baseTemplate(content),
  };
}
