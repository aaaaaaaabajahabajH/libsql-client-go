import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Social Media Generator",
  description: "Create viral posts for any platform in seconds.",
};

/**
 * Social Media Generator tool page — implemented in Milestone 9.
 */
export default function SocialMediaPage() {
  return (
    <main className="flex-1 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Social Media Generator</h1>
      <p className="mt-1 text-muted-foreground">
        Tool implementation — Milestone 9
      </p>
    </main>
  );
}
