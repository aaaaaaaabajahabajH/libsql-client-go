import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product Description Generator",
  description: "Write product descriptions that convert browsers into buyers.",
};

/**
 * Product Description Generator tool page — implemented in Milestone 9.
 */
export default function ProductDescriptionPage() {
  return (
    <main className="flex-1 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Product Description Generator</h1>
      <p className="mt-1 text-muted-foreground">
        Tool implementation — Milestone 9
      </p>
    </main>
  );
}
