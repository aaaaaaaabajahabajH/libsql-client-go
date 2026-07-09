import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ServiceCheck {
  status: "ok" | "degraded" | "down";
  latencyMs?: number;
  message?: string;
}

async function checkDatabase(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("profiles").select("id").limit(1);
    if (error) return { status: "degraded", message: error.message };
    return { status: "ok", latencyMs: Date.now() - start };
  } catch (err) {
    return {
      status: "down",
      message: err instanceof Error ? err.message : "Database unreachable",
    };
  }
}

function checkEnvironment(): ServiceCheck {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    return { status: "down", message: `Missing env vars: ${missing.join(", ")}` };
  }
  return { status: "ok" };
}

export async function GET(): Promise<NextResponse> {
  const [database, environment] = await Promise.all([
    checkDatabase(),
    Promise.resolve(checkEnvironment()),
  ]);

  const services = { database, environment };
  const allOk = Object.values(services).every((s) => s.status === "ok");
  const anyDown = Object.values(services).some((s) => s.status === "down");
  const overallStatus = allOk ? "ok" : anyDown ? "down" : "degraded";

  const body = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "1.0.0",
    environment: process.env.NODE_ENV,
    services,
  };

  return NextResponse.json(body, {
    status: overallStatus === "down" ? 503 : 200,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
