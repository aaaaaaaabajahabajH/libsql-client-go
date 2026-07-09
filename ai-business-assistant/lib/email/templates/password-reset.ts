import { baseTemplate, h1, subtitle, paragraph, ctaButton, divider, linkFallback, warningBox } from "./base";

export interface PasswordResetEmailData {
  name: string;
  resetUrl: string;
}

export function passwordResetEmail(data: PasswordResetEmailData): { subject: string; html: string } {
  const displayName = data.name || "there";

  const content = `
    ${h1("Reset your password")}
    ${subtitle(`Hi ${displayName}, we received a request to reset your password.`)}

    ${paragraph("Click the button below to choose a new password. This link will expire in 1 hour.")}

    ${ctaButton("Reset Password", data.resetUrl)}

    ${warningBox("If you didn't request a password reset, please ignore this email or contact support immediately if you suspect unauthorized access to your account.")}

    ${divider()}

    ${linkFallback(data.resetUrl)}
  `;

  return {
    subject: "Reset your password",
    html: baseTemplate(content),
  };
}
