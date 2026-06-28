import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email Writer",
  description: "Draft professional emails and campaigns with AI precision.",
};

/**
 * Email Writer tool page — implemented in Milestone 9.
 */
export default function EmailWriterPage() {
  return (
    <main className="flex-1 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Email Writer</h1>
      <p className="mt-1 text-muted-foreground">
        Tool implementation — Milestone 9
      </p>
    </main>
  );
}
