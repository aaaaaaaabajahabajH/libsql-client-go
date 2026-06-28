import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your profile and account details.",
};

/**
 * Profile page — implemented in Milestone 5.
 */
export default function ProfilePage() {
  return (
    <main className="flex-1 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
      <p className="mt-1 text-muted-foreground">Profile form — Milestone 5</p>
    </main>
  );
}
