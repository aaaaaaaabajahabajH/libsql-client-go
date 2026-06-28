import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog Writer",
  description: "Generate SEO-optimized blog articles that rank and engage.",
};

/**
 * Blog Writer tool page — implemented in Milestone 9.
 */
export default function BlogWriterPage() {
  return (
    <main className="flex-1 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Blog Writer</h1>
      <p className="mt-1 text-muted-foreground">
        Tool implementation — Milestone 9
      </p>
    </main>
  );
}
