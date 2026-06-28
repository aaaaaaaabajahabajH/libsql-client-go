import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings and preferences.",
};

/**
 * Settings page — implemented in Milestone 5.
 */
export default function SettingsPage() {
  return (
    <main className="flex-1 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <p className="mt-1 text-muted-foreground">Settings form — Milestone 5</p>
    </main>
  );
}
