import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your AI Business Assistant dashboard.",
};

/**
 * Main dashboard page — widgets implemented in Milestone 5.
 */
export default function DashboardPage() {
  return (
    <main className="flex-1 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-muted-foreground">
        Dashboard widgets — Milestone 5
      </p>
    </main>
  );
}
