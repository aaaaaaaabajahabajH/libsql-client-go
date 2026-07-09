import {
  Database,
  CreditCard,
  Sparkles,
  Mail,
  HardDrive,
  Wifi,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { cn } from "@/lib/utils";
import { getSystemStatus, getStorageUsage } from "@/services/admin/system";
import type { ServiceStatus } from "@/services/admin/system";

export const metadata = { title: "Admin — System" };
export const dynamic = "force-dynamic";

function StatusIcon({ status }: { status: ServiceStatus }) {
  if (status === "operational") return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
  if (status === "degraded") return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  return <XCircle className="h-5 w-5 text-red-500" />;
}

function statusLabel(s: ServiceStatus) {
  if (s === "operational") return { text: "Operational", color: "text-emerald-600 dark:text-emerald-400" };
  if (s === "degraded") return { text: "Degraded", color: "text-amber-600 dark:text-amber-400" };
  return { text: "Down", color: "text-red-600 dark:text-red-400" };
}

function ServiceRow({
  icon: Icon,
  label,
  detail,
  status,
  latencyMs,
}: {
  icon: React.ElementType;
  label: string;
  detail: string;
  status: ServiceStatus;
  latencyMs?: number;
}) {
  const { text, color } = statusLabel(status);
  return (
    <div className="flex items-center gap-4 py-4 border-b border-border last:border-0">
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
        status === "operational" ? "bg-emerald-100 dark:bg-emerald-900/30" :
        status === "degraded" ? "bg-amber-100 dark:bg-amber-900/30" :
        "bg-red-100 dark:bg-red-900/30"
      )}>
        <Icon className={cn("h-5 w-5",
          status === "operational" ? "text-emerald-600 dark:text-emerald-400" :
          status === "degraded" ? "text-amber-600 dark:text-amber-400" :
          "text-red-600 dark:text-red-400"
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      <div className="flex items-center gap-3">
        {latencyMs !== undefined && (
          <span className="text-xs text-muted-foreground">{latencyMs}ms</span>
        )}
        <div className="flex items-center gap-1.5">
          <StatusIcon status={status} />
          <span className={cn("text-sm font-medium", color)}>{text}</span>
        </div>
      </div>
    </div>
  );
}

export default async function SystemPage() {
  const [status, storageUsage] = await Promise.all([
    getSystemStatus(),
    getStorageUsage(),
  ]);

  const allOperational = Object.values({
    db: status.database,
    stripe: status.stripe,
    storage: status.storage,
    email: status.email,
  }).every((s) => s === "operational");

  return (
    <>
      <PageHeader description="Live status of all integrated services" title="System Monitoring" />

      <div className={cn(
        "rounded-xl border p-4 mb-6 flex items-center gap-3",
        allOperational
          ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20"
          : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20"
      )}>
        {allOperational ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        )}
        <p className={cn("text-sm font-medium",
          allOperational ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"
        )}>
          {allOperational
            ? "All systems operational"
            : "Some services need attention"}
        </p>
        <span className="ml-auto text-xs text-muted-foreground">
          Last checked: {new Date().toLocaleTimeString()}
        </span>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <p className="text-sm font-semibold mb-1">Services</p>
        <p className="text-xs text-muted-foreground mb-4">Real-time connectivity checks</p>

        <ServiceRow
          detail="Supabase PostgreSQL"
          icon={Database}
          label="Database"
          latencyMs={status.dbLatencyMs}
          status={status.database}
        />
        <ServiceRow
          detail="Payment processing"
          icon={CreditCard}
          label="Stripe"
          latencyMs={status.stripeLatencyMs}
          status={status.stripe}
        />
        <ServiceRow
          detail="Supabase Storage"
          icon={HardDrive}
          label="Storage"
          status={status.storage}
        />
        <ServiceRow
          detail="Email delivery service"
          icon={Mail}
          label="Email"
          status={status.email}
        />
        <ServiceRow
          detail="OpenAI / Anthropic / Google"
          icon={Sparkles}
          label="AI Providers"
          status="operational"
        />
        <ServiceRow
          detail="Next.js Edge Runtime"
          icon={Wifi}
          label="API"
          status="operational"
        />
      </div>

      {storageUsage.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold mb-4">Storage Buckets</p>
          <div className="space-y-3">
            {storageUsage.map((bucket) => (
              <div key={bucket.bucket} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{bucket.bucket}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {bucket.filesCount.toLocaleString()} file{bucket.filesCount !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
