import Link from "next/link";
import { CreditCard, AlertTriangle, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { PageHeader } from "@/components/admin/page-header";
import {
  getSubscriptionStats,
  listSubscriptions,
  getExpiringSubscriptions,
} from "@/services/admin/subscriptions";

export const metadata = { title: "Admin — Subscriptions" };
export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  const [stats, { subs: activeSubs }, { subs: pastDueSubs }, { subs: canceledSubs }, expiringSubs] =
    await Promise.all([
      getSubscriptionStats(),
      listSubscriptions("active", 1, 30),
      listSubscriptions("past_due", 1, 30),
      listSubscriptions("canceled", 1, 30),
      getExpiringSubscriptions(7),
    ]);

  function SubTable({ subs }: { subs: typeof activeSubs }) {
    if (subs.length === 0) {
      return (
        <div className="py-12 text-center text-muted-foreground text-sm">
          No subscriptions in this category
        </div>
      );
    }
    return (
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Plan</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Period ends</th>
            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {subs.map((sub) => (
            <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3">
                <p className="font-medium">{sub.user_name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{sub.user_email}</p>
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                <Badge variant="outline" className="capitalize text-[11px]">{sub.plan}</Badge>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={sub.status} />
              </td>
              <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                {sub.current_period_end
                  ? new Date(sub.current_period_end).toLocaleDateString("en-US", { dateStyle: "medium" })
                  : "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/admin/users/${sub.user_id}`}>View user</Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <>
      <PageHeader title="Subscriptions" description="Manage all subscription statuses" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active" value={stats.active.toLocaleString()} icon={CreditCard} variant="success" />
        <StatCard label="Past Due" value={stats.pastDue.toLocaleString()} icon={AlertTriangle} variant={stats.pastDue > 0 ? "warning" : "default"} />
        <StatCard label="Canceled" value={stats.canceled.toLocaleString()} icon={XCircle} />
        <StatCard label="Expiring (7d)" value={expiringSubs.length.toLocaleString()} icon={Clock} variant={expiringSubs.length > 0 ? "warning" : "default"} />
      </div>

      {expiringSubs.length > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              {expiringSubs.length} subscription{expiringSubs.length > 1 ? "s" : ""} expiring within 7 days
            </p>
          </div>
          <div className="space-y-2">
            {expiringSubs.slice(0, 5).map((sub) => (
              <div key={sub.id} className="flex items-center justify-between text-sm">
                <span className="text-amber-800 dark:text-amber-300">
                  {sub.user_email} · <span className="capitalize">{sub.plan}</span>
                </span>
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  {sub.current_period_end
                    ? new Date(sub.current_period_end).toLocaleDateString("en-US", { dateStyle: "medium" })
                    : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Tabs defaultValue="active">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
          <TabsTrigger value="past_due">Past Due ({stats.pastDue})</TabsTrigger>
          <TabsTrigger value="canceled">Canceled ({stats.canceled})</TabsTrigger>
        </TabsList>

        <div className="rounded-xl border border-border overflow-hidden">
          <TabsContent value="active" className="m-0">
            <SubTable subs={activeSubs} />
          </TabsContent>
          <TabsContent value="past_due" className="m-0">
            <SubTable subs={pastDueSubs} />
          </TabsContent>
          <TabsContent value="canceled" className="m-0">
            <SubTable subs={canceledSubs} />
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}
