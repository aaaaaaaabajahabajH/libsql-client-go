import { baseTemplate, h1, subtitle, paragraph, ctaButton, divider } from "./base";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "AI Business Suite";

export interface WelcomeEmailData {
  name: string;
  email: string;
}

export function welcomeEmail(data: WelcomeEmailData): { subject: string; html: string } {
  const displayName = data.name || data.email.split("@")[0];

  const content = `
    ${h1(`Welcome to ${APP_NAME}, ${displayName}!`)}
    ${subtitle("Your AI-powered business workspace is ready.")}
    ${paragraph(`We're thrilled to have you on board. Your account has been created and you're all set to start generating amazing content with our suite of AI tools.`)}

    ${ctaButton("Go to Dashboard", `${APP_URL}/dashboard`)}

    ${divider()}

    <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#18181b;">Here's what you can do:</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      ${[
        ["✍️", "Blog Writer", "Generate SEO-optimized blog posts in seconds"],
        ["📢", "Social Media", "Create engaging posts for every platform"],
        ["📧", "Email Writer", "Draft professional emails that convert"],
        ["🛍️", "Product Descriptions", "Write compelling product copy instantly"],
        ["🌐", "Translator", "Translate content into 50+ languages"],
      ]
        .map(
          ([icon, title, desc]) =>
            `<tr>
              <td style="padding:8px 0;vertical-align:top;width:32px;font-size:18px;">${icon}</td>
              <td style="padding:8px 0 8px 8px;vertical-align:top;">
                <p style="margin:0;font-size:14px;font-weight:600;color:#18181b;">${title}</p>
                <p style="margin:2px 0 0;font-size:13px;color:#71717a;">${desc}</p>
              </td>
            </tr>`,
        )
        .join("")}
    </table>

    ${divider()}

    ${paragraph(`You're on the <strong>Free plan</strong> with 20 monthly credits to get started. Upgrade anytime to unlock unlimited AI power.`)}

    <p style="margin:0;font-size:13px;color:#a1a1aa;">Questions? Reply to this email — we're happy to help.</p>
  `;

  return {
    subject: `Welcome to ${APP_NAME} — your workspace is ready!`,
    html: baseTemplate(content),
  };
}
