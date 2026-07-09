import { MailCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Check your email to verify your AI Business Assistant account.",
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-8 ring-primary/5">
        <MailCheck className="h-8 w-8 text-primary" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Verify your email</h1>
        <p className="text-muted-foreground">
          We sent a verification link to your email address. Click the link to
          activate your account.
        </p>
      </div>

      <div className="w-full rounded-lg border bg-muted/40 p-4">
        <p className="text-sm text-muted-foreground">
          Didn&apos;t receive the email? Check your spam folder, or{" "}
          <Link className="text-primary hover:underline" href="/register">
            try a different email address
          </Link>
          .
        </p>
      </div>

      <Button asChild variant="outline">
        <Link href="/login">Back to sign in</Link>
      </Button>
    </div>
  );
}
