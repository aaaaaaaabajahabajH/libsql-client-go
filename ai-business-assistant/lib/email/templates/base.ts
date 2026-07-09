const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "AI Business Suite";
const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

export function baseTemplate(content: string): string {
  const year = new Date().getFullYear();
  const displayUrl = APP_URL.replace(/^https?:\/\//, "");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;">

          <!-- Logo row -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <a href="${APP_URL}" style="text-decoration:none;display:inline-block;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="vertical-align:middle;padding-right:10px;">
                      <div style="width:36px;height:36px;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);border-radius:8px;"></div>
                    </td>
                    <td style="vertical-align:middle;">
                      <span style="font-size:20px;font-weight:700;color:#18181b;letter-spacing:-0.4px;">${APP_NAME}</span>
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08),0 1px 2px rgba(0,0,0,0.06);">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding:40px 40px 36px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0 0 6px;font-size:12px;color:#a1a1aa;line-height:1.6;">
                © ${year} ${APP_NAME} · All rights reserved
              </p>
              <p style="margin:0;font-size:12px;line-height:1.6;">
                <a href="${APP_URL}/settings/notifications" style="color:#6366f1;text-decoration:none;">Manage email preferences</a>
                <span style="color:#d4d4d8;"> · </span>
                <a href="${APP_URL}" style="color:#a1a1aa;text-decoration:none;">${displayUrl}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function h1(text: string): string {
  return `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#18181b;letter-spacing:-0.5px;line-height:1.3;">${text}</h1>`;
}

export function subtitle(text: string): string {
  return `<p style="margin:0 0 28px;font-size:15px;color:#71717a;line-height:1.6;">${text}</p>`;
}

export function paragraph(text: string): string {
  return `<p style="margin:0 0 20px;font-size:15px;color:#3f3f46;line-height:1.7;">${text}</p>`;
}

export function ctaButton(label: string, url: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0;">
    <tr>
      <td style="border-radius:8px;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);">
        <a href="${url}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:0.1px;">${label}</a>
      </td>
    </tr>
  </table>`;
}

export function divider(): string {
  return `<hr style="border:none;border-top:1px solid #f4f4f5;margin:28px 0;" />`;
}

export function infoBox(lines: { label: string; value: string }[]): string {
  const rows = lines
    .map(
      ({ label, value }) =>
        `<tr>
          <td style="padding:10px 16px;font-size:13px;color:#71717a;font-weight:500;white-space:nowrap;">${label}</td>
          <td style="padding:10px 16px;font-size:13px;color:#18181b;font-weight:600;text-align:right;">${value}</td>
        </tr>`,
    )
    .join("");

  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;background-color:#f9f9fb;border-radius:10px;border:1px solid #f0f0f3;">
    ${rows}
  </table>`;
}

export function warningBox(text: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;background-color:#fff7ed;border-radius:10px;border-left:4px solid #f97316;">
    <tr>
      <td style="padding:14px 16px;font-size:14px;color:#c2410c;line-height:1.6;">${text}</td>
    </tr>
  </table>`;
}

export function linkFallback(url: string): string {
  return `<p style="margin:20px 0 0;font-size:12px;color:#a1a1aa;line-height:1.6;">
    If the button doesn't work, copy and paste this link into your browser:<br />
    <a href="${url}" style="color:#6366f1;text-decoration:none;word-break:break-all;">${url}</a>
  </p>`;
}
