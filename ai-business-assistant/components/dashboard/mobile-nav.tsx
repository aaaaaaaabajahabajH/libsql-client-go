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
  Menu,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { logoutAction } from "@/actions/auth";
import type { DbPlanType } from "@/types/database";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  exact?: boolean;
}

const mainNav: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/dashboard/tools", icon: Sparkles, label: "AI Tools" },
  { href: "/dashboard/history", icon: History, label: "History" },
  { href: "/dashboard/saved", icon: BookMarked, label: "Saved Documents" },
  { href: "/dashboard/billing", icon: CreditCard, label: "Billing" },
];

const bottomNav: NavItem[] = [
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
  { href: "/dashboard/support", icon: HelpCircle, label: "Support" },
];

const planLabels: Record<DbPlanType, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

interface MobileNavProps {
  plan: DbPlanType;
  creditsBalance: number;
  creditsTotal: number;
  creditsPercentage: number;
}

export function MobileNav({ plan, creditsBalance, creditsTotal, creditsPercentage }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const handleLogout = async () => {
    setOpen(false);
    await logoutAction();
    router.refresh();
  };

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-72 p-0 flex flex-col bg-sidebar border-sidebar-border">
        <SheetHeader className="px-4 pt-5 pb-4 border-b border-sidebar-border">
          <SheetTitle asChild>
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-accent">
                <Bot className="h-5 w-5 text-sidebar-accent-foreground" />
              </div>
              <div>
                <span className="gradient-text text-sm font-bold block leading-none">AI Business</span>
                <span className="text-sidebar-foreground/40 text-[10px] block mt-0.5">Assistant</span>
              </div>
            </Link>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          <div className="space-y-1">
            <p className="px-3 mb-2 text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest">
              Menu
            </p>
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive(item)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/20 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            ))}
          </div>

          <Separator className="bg-sidebar-border" />

          <div className="space-y-1">
            <p className="px-3 mb-2 text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest">
              Account
            </p>
            {bottomNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive(item)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/20 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign Out
            </button>
          </div>
        </nav>

        {/* Credits footer */}
        <div className="border-t border-sidebar-border p-4 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-sidebar-foreground/60" />
              <span className="text-xs font-medium text-sidebar-foreground/70">Credits</span>
            </div>
            <Badge variant="secondary" className="text-[10px] capitalize">
              {planLabels[plan]}
            </Badge>
          </div>
          <Progress value={creditsPercentage} className="h-1.5" />
          <p className="text-[11px] text-sidebar-foreground/50">
            {creditsBalance.toLocaleString()} / {creditsTotal.toLocaleString()} remaining
          </p>
          {(plan === "free" || plan === "starter") && (
            <Button asChild size="sm" className="w-full h-8 text-xs bg-sidebar-accent hover:bg-sidebar-accent/90 text-sidebar-accent-foreground">
              <Link href="/pricing" onClick={() => setOpen(false)}>
                Upgrade Plan
              </Link>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
