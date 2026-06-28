import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your AI Business Assistant account.",
  robots: { index: false, follow: false },
};

/**
 * Reset password page — form implemented in Milestone 3.
 */
export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Set new password</h1>
          <p className="text-sm text-muted-foreground">
            Create a strong password for your account.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Auth form — Milestone 3
          </p>
        </div>
      </div>
    </main>
  );
}
