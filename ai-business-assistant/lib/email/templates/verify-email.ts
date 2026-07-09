import { baseTemplate, h1, subtitle, paragraph, ctaButton, divider, linkFallback, warningBox } from "./base";

export interface VerifyEmailData {
  name: string;
  verificationUrl: string;
}

export function verifyEmailEmail(data: VerifyEmailData): { subject: string; html: string } {
  const displayName = data.name || "there";

  const content = `
    ${h1("Verify your email address")}
    ${subtitle(`Hi ${displayName}, please confirm your email to activate your account.`)}

    ${paragraph("Click the button below to verify your email address. This link will expire in 24 hours.")}

    ${ctaButton("Verify Email Address", data.verificationUrl)}

    ${warningBox("If you didn't create an account, you can safely ignore this email.")}

    ${divider()}

    ${linkFallback(data.verificationUrl)}
  `;

  return {
    subject: "Verify your email address",
    html: baseTemplate(content),
  };
}
