import { ArrowLeft, Mail, Calendar, MapPin, Building, Globe, Zap } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/admin/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminUserDetail, getUserActivityHistory } from "@/services/admin/users";

import { UserActions } from "./user-actions";


export const dynamic = "force-dynamic";

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-2.5 py-2.5 border-b border-border last:border-0">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value ?? "—"}</p>
      </div>
    </div>
  );
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, activity] = await Promise.all([
    getAdminUserDetail(id),
    getUserActivityHistory(id, 15),
  ]);

  if (!user) notFound();

  const initials = (user.full_name ?? user.email)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const TOOL_LABELS: Record<string, string> = {
    "social-media": "Social Media",
    "product-description": "Product Desc",
    "blog-writer": "Blog Writer",
    "email-writer": "Email Writer",
    "invoice-generator": "Invoice Gen",
    translator: "Translator",
  };

  return (
    <>
      <div className="mb-6">
        <Button asChild className="mb-4 -ml-2" size="sm" variant="ghost">
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to users
          </Link>
        </Button>

        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 border-2 border-border">
            <AvatarImage src={user.avatar_url ?? undefined} />
            <AvatarFallback className="text-xl font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{user.full_name ?? "No name"}</h1>
              <StatusBadge status={user.is_suspended ? "suspended" : "active"} />
              <Badge className="capitalize" variant="outline">{user.plan}</Badge>
              <Badge className="capitalize text-[11px]" variant="secondary">{user.role}</Badge>
            </div>
            <p className="text-muted-foreground mt-0.5">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold mb-2">Profile</p>
            <InfoRow icon={Mail} label="Email" value={user.email} />
            <InfoRow icon={Calendar} label="Joined" value={new Date(user.created_at).toLocaleDateString("en-US", { dateStyle: "long" })} />
            <InfoRow icon={Building} label="Company" value={user.company} />
            <InfoRow icon={Globe} label="Website" value={user.website} />
            <InfoRow icon={MapPin} label="Country" value={user.country} />
            {user.username && (
              <InfoRow icon={Mail} label="Username" value={`@${user.username}`} />
            )}
          </div>

          {/* Credits */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold mb-3">Credits</p>
            {user.credits ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Balance</span>
                  <span className="text-sm font-medium">{user.credits.balance.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Allowance</span>
                  <span className="text-sm font-medium">
                    {user.credits.monthly_allowance >= 999_999 ? "Unlimited" : user.credits.monthly_allowance.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Used</span>
                  <span className="text-sm font-medium">{user.credits.total_used.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No credits row found</p>
            )}
          </div>

          {/* Subscription */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold mb-3">Subscription</p>
            {user.subscription ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Plan</span>
                  <Badge className="capitalize text-[11px]" variant="outline">{user.subscription.plan}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <StatusBadge status={user.subscription.status} />
                </div>
                {user.subscription.current_period_end && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Renews</span>
                    <span className="text-xs font-medium">
                      {new Date(user.subscription.current_period_end).toLocaleDateString("en-US", { dateStyle: "medium" })}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active subscription</p>
            )}
          </div>
        </div>

        {/* Admin actions + activity */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold mb-4">Admin Actions</p>
            <UserActions
              currentAllowance={user.credits?.monthly_allowance ?? 20}
              currentBalance={user.credits?.balance ?? 0}
              currentPlan={user.plan}
              isSuspended={user.is_suspended}
              userId={user.id}
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold mb-4">Recent Activity</p>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet</p>
            ) : (
              <div className="space-y-0 divide-y divide-border">
                {activity.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {TOOL_LABELS[item.tool] ?? item.tool} · {item.credits_used} credits
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-3">
                      {new Date(item.created_at).toLocaleDateString("en-US", { dateStyle: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
