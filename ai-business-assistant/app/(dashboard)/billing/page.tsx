import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { CreditsRow, SubscriptionRow } from "@/types/database";
import { BillingClient } from "./billing-client";

export const metadata = {
  title: "Billing & Plans",
};

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: subscription }, { data: credits }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single<SubscriptionRow>(),
    supabase
      .from("credits")
      .select("*")
      .eq("user_id", user.id)
      .single<CreditsRow>(),
  ]);

  return <BillingClient subscription={subscription} credits={credits} />;
}
