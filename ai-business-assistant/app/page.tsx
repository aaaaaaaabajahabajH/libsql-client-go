import type { Metadata } from "next";

import { APP_DESCRIPTION, APP_NAME } from "@/utils/constants";

export const metadata: Metadata = {
  title: `${APP_NAME} — Grow Faster with AI`,
  description: APP_DESCRIPTION,
};

/**
 * Landing page — implemented in Milestone 6.
 */
export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8 text-center">
      <div className="space-y-4">
        <h1 className="text-5xl font-extrabold tracking-tight gradient-text">
          {APP_NAME}
        </h1>
        <p className="max-w-lg text-lg text-muted-foreground">{APP_DESCRIPTION}</p>
      </div>
      <div className="flex gap-4">
        <a
          href="/register"
          className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Get Started Free
        </a>
        <a
          href="/pricing"
          className="rounded-md border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-accent"
        >
          View Pricing
        </a>
      </div>
    </main>
  );
}
