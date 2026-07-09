import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { SecurityForm } from "./security-form";

export const metadata = { title: "Security" };

export default async function SecurityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: mfaData } = await supabase.auth.mfa.listFactors();
  const totpFactor = mfaData?.totp?.[0] ?? null;
  const isMfaEnabled = totpFactor?.status === "verified";

  return (
    <SecurityForm
      isMfaEnabled={isMfaEnabled}
      lastSignIn={user.last_sign_in_at ?? null}
      totpFactorId={totpFactor?.id ?? null}
      userEmail={user.email ?? ""}
    />
  );
}
