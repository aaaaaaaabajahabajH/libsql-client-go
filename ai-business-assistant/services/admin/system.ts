import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

export type ServiceStatus = "operational" | "degraded" | "down";

export interface SystemStatusResult {
  database: ServiceStatus;
  stripe: ServiceStatus;
  storage: ServiceStatus;
  email: ServiceStatus;
  dbLatencyMs: number;
  stripeLatencyMs: number;
}

export interface StorageUsageStat {
  bucket: string;
  filesCount: number;
}

async function checkDatabase(): Promise<{ status: ServiceStatus; latencyMs: number }> {
  const start = Date.now();
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("profiles").select("id").limit(1);
    const latencyMs = Date.now() - start;
    return { status: error ? "degraded" : "operational", latencyMs };
  } catch {
    return { status: "down", latencyMs: Date.now() - start };
  }
}

async function checkStripe(): Promise<{ status: ServiceStatus; latencyMs: number }> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { status: "down", latencyMs: 0 };
  const start = Date.now();
  try {
    const stripe = new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
    await stripe.balance.retrieve();
    return { status: "operational", latencyMs: Date.now() - start };
  } catch {
    return { status: "degraded", latencyMs: Date.now() - start };
  }
}

async function checkStorage(): Promise<ServiceStatus> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.storage.listBuckets();
    return error ? "degraded" : "operational";
  } catch {
    return "down";
  }
}

function checkEmail(): ServiceStatus {
  const key = process.env.RESEND_API_KEY ?? process.env.SMTP_HOST ?? "";
  return key ? "operational" : "degraded";
}

export async function getSystemStatus(): Promise<SystemStatusResult> {
  const [dbResult, stripeResult, storageStatus] = await Promise.all([
    checkDatabase(),
    checkStripe(),
    checkStorage(),
  ]);

  return {
    database: dbResult.status,
    dbLatencyMs: dbResult.latencyMs,
    stripe: stripeResult.status,
    stripeLatencyMs: stripeResult.latencyMs,
    storage: storageStatus,
    email: checkEmail(),
  };
}

export async function getStorageUsage(): Promise<StorageUsageStat[]> {
  try {
    const admin = createAdminClient();
    const { data: buckets } = await admin.storage.listBuckets();
    if (!buckets) return [];

    const results = await Promise.all(
      buckets.map(async (bucket) => {
        const { data: files } = await admin.storage.from(bucket.name).list("", { limit: 1000 });
        return { bucket: bucket.name, filesCount: files?.length ?? 0 };
      }),
    );
    return results;
  } catch {
    return [];
  }
}
