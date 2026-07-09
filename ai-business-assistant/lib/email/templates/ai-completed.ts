import { baseTemplate, h1, subtitle, paragraph, ctaButton, divider, infoBox } from "./base";

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

export interface AiCompletedEmailData {
  name: string;
  tool: string;
  title: string;
  creditsUsed: number;
  creditsRemaining: number;
  outputUrl?: string;
}

const TOOL_LABELS: Record<string, string> = {
  "blog-writer": "Blog Writer",
  "social-media": "Social Media",
  "email-writer": "Email Writer",
  "product-description": "Product Description",
  "invoice-generator": "Invoice Generator",
  translator: "Translator",
};

export function aiCompletedEmail(
  data: AiCompletedEmailData,
): { subject: string; html: string } {
  const displayName = data.name || "there";
  const toolLabel = TOOL_LABELS[data.tool] ?? data.tool;

  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:56px;height:56px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:14px;line-height:56px;font-size:28px;">✨</div>
    </div>

    ${h1("Your AI content is ready!")}
    ${subtitle(`Hi ${displayName}, your ${toolLabel} request has been completed.`)}

    ${paragraph(`Your content "<strong>${data.title}</strong>" has been generated and is ready to view.`)}

    ${infoBox([
      { label: "Tool", value: toolLabel },
      { label: "Credits Used", value: data.creditsUsed.toLocaleString() },
      { label: "Credits Remaining", value: data.creditsRemaining.toLocaleString() },
    ])}

    ${ctaButton("View Your Content", data.outputUrl ?? `${APP_URL}/dashboard/history`)}

    ${divider()}

    ${paragraph(`Keep the momentum going! Head to your <a href="${APP_URL}/dashboard/tools" style="color:#6366f1;text-decoration:none;">AI tools</a> to create more content.`)}
  `;

  return {
    subject: `Your ${toolLabel} content is ready — "${data.title}"`,
    html: baseTemplate(content),
  };
}
