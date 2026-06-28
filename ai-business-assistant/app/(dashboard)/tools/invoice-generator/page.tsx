import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoice Generator",
  description: "Generate professional invoices and business documents.",
};

/**
 * Invoice Generator tool page — implemented in Milestone 9.
 */
export default function InvoiceGeneratorPage() {
  return (
    <main className="flex-1 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Invoice Generator</h1>
      <p className="mt-1 text-muted-foreground">
        Tool implementation — Milestone 9
      </p>
    </main>
  );
}
