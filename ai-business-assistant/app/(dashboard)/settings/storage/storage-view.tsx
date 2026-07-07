import { FileText, History, Zap, RefreshCw } from "lucide-react";
import { SettingsSection } from "@/components/settings/settings-section";
import { StorageRing } from "@/components/settings/storage-ring";
import { Badge } from "@/components/ui/badge";

interface StorageViewProps {
  savedDocuments: number;
  historyEntries: number;
  creditsUsed: number;
  creditsAllowance: number;
  creditsBalance: number;
  isUnlimited: boolean;
  resetAt: string | null;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sublabel?: string;
}) {
  return (
    <div className="rounded-xl border border-border p-4 flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs font-medium mt-1">{label}</p>
        {sublabel && <p className="text-[11px] text-muted-foreground mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}

function formatResetDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(iso));
}

export function StorageView({
  savedDocuments,
  historyEntries,
  creditsUsed,
  creditsAllowance,
  creditsBalance,
  isUnlimited,
  resetAt,
}: StorageViewProps) {
  return (
    <div className="space-y-10">
      {/* Content storage */}
      <SettingsSection
        title="Content Storage"
        description="Documents and history stored in your workspace."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            icon={FileText}
            label="Saved documents"
            value={savedDocuments.toLocaleString()}
            sublabel="Pinned outputs kept in your library"
          />
          <StatCard
            icon={History}
            label="History entries"
            value={historyEntries.toLocaleString()}
            sublabel="AI generation log (auto-purged after 90 days)"
          />
        </div>
      </SettingsSection>

      {/* Monthly credits */}
      <SettingsSection
        title="Monthly Credits"
        description="Credits are consumed each time you generate AI content. They reset on your billing cycle."
      >
        {isUnlimited ? (
          <div className="rounded-xl border border-border p-6 flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Unlimited credits</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your Pro plan includes unlimited AI generation.
              </p>
            </div>
            <Badge variant="secondary" className="text-[11px]">Pro plan</Badge>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
              <StorageRing
                label="Credits used"
                value={creditsUsed}
                max={creditsAllowance}
                unit="used"
                colorClass="text-primary"
              />
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xl font-bold">{creditsAllowance.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Monthly allowance</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xl font-bold">{creditsBalance.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Remaining balance</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xl font-bold">{creditsUsed.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Used this month</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Resets</p>
                    </div>
                    <p className="text-sm font-medium mt-0.5">{formatResetDate(resetAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </SettingsSection>
    </div>
  );
}
