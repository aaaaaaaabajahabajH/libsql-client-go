import { baseTemplate, h1, subtitle, paragraph, ctaButton, divider, infoBox } from "./base";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export interface WeeklySummaryTool {
  name: string;
  count: number;
  credits: number;
}

export interface WeeklySummaryEmailData {
  name: string;
  weekStart: string;
  weekEnd: string;
  totalRequests: number;
  creditsUsed: number;
  creditsRemaining: number;
  topTool: string;
  tools: WeeklySummaryTool[];
  savedDocuments: number;
}

export function weeklySummaryEmail(
  data: WeeklySummaryEmailData,
): { subject: string; html: string } {
  const displayName = data.name || "there";

  const toolRows = data.tools
    .slice(0, 5)
    .map(
      (t) =>
        `<tr>
          <td style="padding:8px 0;font-size:14px;color:#3f3f46;border-bottom:1px solid #f4f4f5;">${t.name}</td>
          <td style="padding:8px 0;font-size:14px;color:#18181b;font-weight:600;text-align:center;border-bottom:1px solid #f4f4f5;">${t.count}</td>
          <td style="padding:8px 0;font-size:14px;color:#71717a;text-align:right;border-bottom:1px solid #f4f4f5;">${t.credits} credits</td>
        </tr>`,
    )
    .join("");

  const content = `
    ${h1(`Your week in review`)}
    ${subtitle(`Hi ${displayName}, here's what you created this week (${data.weekStart} – ${data.weekEnd}).`)}

    ${infoBox([
      { label: "AI Requests", value: data.totalRequests.toLocaleString() },
      { label: "Credits Used", value: data.creditsUsed.toLocaleString() },
      { label: "Credits Remaining", value: data.creditsRemaining.toLocaleString() },
      { label: "Saved Documents", value: data.savedDocuments.toLocaleString() },
      { label: "Top Tool", value: data.topTool || "–" },
    ])}

    ${
      data.tools.length > 0
        ? `<p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#18181b;">Tool breakdown</p>
           <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;">
             <tr>
               <th style="text-align:left;padding:0 0 8px;font-size:12px;color:#a1a1aa;font-weight:500;border-bottom:1px solid #e4e4e7;">TOOL</th>
               <th style="text-align:center;padding:0 0 8px;font-size:12px;color:#a1a1aa;font-weight:500;border-bottom:1px solid #e4e4e7;">USES</th>
               <th style="text-align:right;padding:0 0 8px;font-size:12px;color:#a1a1aa;font-weight:500;border-bottom:1px solid #e4e4e7;">CREDITS</th>
             </tr>
             ${toolRows}
           </table>`
        : paragraph("No AI requests this week — start creating to see your stats here!")
    }

    ${ctaButton("Continue Creating", `${APP_URL}/dashboard`)}

    ${divider()}

    ${paragraph(`Check your full <a href="${APP_URL}/dashboard" style="color:#6366f1;text-decoration:none;">history</a> and <a href="${APP_URL}/dashboard" style="color:#6366f1;text-decoration:none;">saved documents</a> for everything you've created.`)}
  `;

  return {
    subject: `Your weekly AI summary — ${data.totalRequests} requests, ${data.creditsUsed} credits used`,
    html: baseTemplate(content),
  };
}
