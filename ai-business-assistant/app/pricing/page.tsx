import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing. Start free, scale as you grow. No hidden fees.",
};

/**
 * Pricing page — implemented in Milestone 7.
 */
export default function PricingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-extrabold tracking-tight gradient-text">
        Pricing
      </h1>
      <p className="mt-3 text-muted-foreground">
        Plans implemented in Milestone 7.
      </p>
    </main>
  );
}
