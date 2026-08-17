import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Dashboard content is per-user and session-dependent — never statically
// cached — and this also keeps the Supabase server client out of the build's
// static-generation pass (see invoiceai/README.md).
export const dynamic = "force-dynamic";

// TODO(phase: Dashboard layout): replace with the real sidebar shell
// (nav, org switcher, user menu, mobile drawer).
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <div className="min-h-screen bg-muted/20">{children}</div>;
}
