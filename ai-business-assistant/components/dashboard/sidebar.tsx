"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bot,
  LayoutDashboard,
  Sparkles,
  History,
  BookMarked,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
  TrendingUp,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { logoutAction } from "@/actions/auth";
import type { DbPlanType } from "@/types/database";

/* ─── Nav config ─────────────────────────────────────────── */

interface NavItemConfig {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
  exact?: boolean;
}

const mainNav: NavItemConfig[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/dashboard/tools", icon: Sparkles, label: "AI Tools" },
  { href: "/dashboard/history", icon: History, label: "History" },
  { href: "/dashboard/saved", icon: BookMarked, label: "Saved Documents" },
  { href: "/dashboard/billing", icon: CreditCard, label: "Billing" },
];

const bottomNav: NavItemConfig[] = [
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
  { href: "/dashboard/support", icon: HelpCircle, label: "Support" },
];

const planLabels: Record<DbPlanType, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

const planBadgeClass: Record<DbPlanType, string> = {
  free: "bg-muted text-muted-foreground border-border",
  starter: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  pro: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  enterprise: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
};

/* ─── Sub-components ──────────────────────────────────────── */

interface NavLinkProps {
  item: NavItemConfig;
  collapsed: boolean;
  pathname: string;
}

function NavLink({ item, collapsed, pathname }: NavLinkProps) {
  const isActive = item.exact
    ? pathname === item.href
    : pathname.startsWith(item.href);

  const inner = (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        "text-sidebar-foreground/70 hover:bg-sidebar-accent/20 hover:text-sidebar-foreground",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm hover:bg-sidebar-accent",
        collapsed && "justify-center px-2.5",
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-auto">
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{inner}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return inner;
}

/* ─── Props ───────────────────────────────────────────────── */

export interface SidebarProps {
  plan: DbPlanType;
  creditsBalance: number;
  creditsTotal: number;
  creditsPercentage: number;
}

/* ─── Sidebar ─────────────────────────────────────────────── */

export function Sidebar({ plan, creditsBalance, creditsTotal, creditsPercentage }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logoutAction();
    router.refresh();
  };

  const isUpgradeable = plan === "free" || plan === "starter";

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "hidden md:flex flex-col relative",
          "bg-sidebar border-r border-sidebar-border",
          "transition-[width] duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-sidebar-border px-4 shrink-0">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2.5 font-bold min-w-0",
              collapsed && "justify-center w-full",
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent shadow-glow-sm">
              <Bot className="h-5 w-5 text-sidebar-accent-foreground" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="gradient-text text-sm font-bold leading-none block">
                  AI Business
                </span>
                <span className="text-sidebar-foreground/40 text-[10px] font-normal leading-none block mt-0.5">
                  Assistant
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "absolute -right-3 top-[4.5rem] z-20",
            "flex h-6 w-6 items-center justify-center",
            "rounded-full border border-sidebar-border bg-sidebar shadow-sm",
            "text-sidebar-foreground/60 hover:text-sidebar-foreground",
            "transition-colors duration-200",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>

        {/* Main nav */}
        <ScrollArea className="flex-1 py-4">
          <nav className="px-2 space-y-6">
            <div className="space-y-1">
              {!collapsed && (
                <p className="px-3 mb-2 text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest">
                  Menu
                </p>
              )}
              {mainNav.map((item) => (
                <NavLink key={item.href} item={item} collapsed={collapsed} pathname={pathname} />
              ))}
            </div>

            <Separator className="bg-sidebar-border" />

            <div className="space-y-1">
              {!collapsed && (
                <p className="px-3 mb-2 text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest">
                  Account
                </p>
              )}
              {bottomNav.map((item) => (
                <NavLink key={item.href} item={item} collapsed={collapsed} pathname={pathname} />
              ))}

              {/* Logout */}
              {collapsed ? (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex w-full items-center justify-center rounded-lg px-2.5 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 disabled:opacity-50"
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    Sign Out
                  </TooltipContent>
                </Tooltip>
              ) : (
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>{loggingOut ? "Signing out…" : "Sign Out"}</span>
                </button>
              )}
            </div>
          </nav>
        </ScrollArea>

        {/* Credits & plan footer */}
        {!collapsed && (
          <div className="border-t border-sidebar-border p-4 space-y-3 shrink-0">
            {/* Plan badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-sidebar-foreground/60" />
                <span className="text-xs font-medium text-sidebar-foreground/70">Credits</span>
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                  planBadgeClass[plan],
                )}
              >
                {planLabels[plan]}
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <Progress
                value={creditsPercentage}
                className="h-1.5 bg-sidebar-border"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-sidebar-foreground/50">
                  {creditsBalance.toLocaleString()} remaining
                </span>
                <span className="text-[11px] text-sidebar-foreground/40">
                  / {creditsTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Upgrade button */}
            {isUpgradeable && (
              <Button
                asChild
                size="sm"
                className="w-full h-8 text-xs bg-sidebar-accent hover:bg-sidebar-accent/90 text-sidebar-accent-foreground"
              >
                <Link href="/pricing">
                  <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                  Upgrade Plan
                </Link>
              </Button>
            )}
          </div>
        )}

        {/* Collapsed credits indicator */}
        {collapsed && (
          <div className="border-t border-sidebar-border p-2 shrink-0">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center gap-1 py-1">
                  <Zap className="h-4 w-4 text-sidebar-foreground/60" />
                  <div className="w-8 h-1 rounded-full bg-sidebar-border overflow-hidden">
                    <div
                      className="h-full bg-sidebar-accent rounded-full transition-all"
                      style={{ width: `${Math.min(creditsPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-medium">{creditsBalance.toLocaleString()} credits left</p>
                <p className="text-muted-foreground text-[10px]">{planLabels[plan]} plan</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
