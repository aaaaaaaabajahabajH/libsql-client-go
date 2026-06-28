import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Set a new password for your AI Business Assistant account.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
        <p className="text-muted-foreground">
          Enter a new password for your account
        </p>
      </div>

      <ResetPasswordForm />
    </div>
  );
}
