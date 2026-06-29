"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Bell,
  Search,
  LogOut,
  User,
  Settings,
  CreditCard,
  Moon,
  Sun,
  Zap,
  Sparkles,
  FileText,
  BookMarked,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { MobileNav } from "./mobile-nav";
import { logoutAction } from "@/actions/auth";
import type { DbPlanType } from "@/types/database";

/* ─── Notification type ──────────────────────────────────── */

interface Notification {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  time: string;
  read: boolean;
}

const DEMO_NOTIFICATIONS: Notification[] = [];

/* ─── Props ───────────────────────────────────────────────── */

export interface DashboardHeaderProps {
  userName: string | null;
  userEmail: string;
  avatarUrl: string | null;
  plan: DbPlanType;
  creditsBalance: number;
  creditsTotal: number;
  creditsPercentage: number;
}

/* ─── Component ───────────────────────────────────────────── */

export function DashboardHeader({
  userName,
  userEmail,
  avatarUrl,
  plan,
  creditsBalance,
  creditsTotal,
  creditsPercentage,
}: DashboardHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isDark = theme === "dark";

  const handleLogout = async () => {
    setLoggingOut(true);
    await logoutAction();
  };

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : userEmail.slice(0, 2).toUpperCase();

  const unreadCount = DEMO_NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/50 bg-background/95 backdrop-blur-sm px-4 md:px-6">
      {/* Mobile menu trigger + logo */}
      <div className="flex items-center gap-2 md:hidden">
        <MobileNav
          plan={plan}
          creditsBalance={creditsBalance}
          creditsTotal={creditsTotal}
          creditsPercentage={creditsPercentage}
        />
      </div>

      {/* Search */}
      <div className="hidden sm:flex flex-1 max-w-xs">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search tools, history…"
            className="pl-9 h-9 bg-muted/40 border-transparent focus-visible:border-input focus-visible:bg-background text-sm"
            aria-label="Search"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        {/* Credits badge */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold tabular-nums">
            {creditsBalance.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">credits</span>
        </div>

        {/* Theme toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Toggle theme"
            className="h-9 w-9"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        )}

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs h-5">
                  {unreadCount} new
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {DEMO_NOTIFICATIONS.length === 0 ? (
              <div className="flex flex-col items-center py-8 px-4 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-2">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">All caught up</p>
                <p className="text-xs text-muted-foreground mt-1">
                  No new notifications right now
                </p>
              </div>
            ) : (
              DEMO_NOTIFICATIONS.map((n) => (
                <DropdownMenuItem key={n.id} className="flex items-start gap-3 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <n.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">{n.time}</p>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background ml-1">
              <Avatar className="h-8 w-8 border border-border/50">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={userName ?? ""} />}
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left max-w-[120px]">
                <p className="text-sm font-medium leading-none truncate">{userName ?? "User"}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">{plan} plan</p>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-semibold">{userName ?? "User"}</span>
                <span className="text-xs text-muted-foreground font-normal truncate">{userEmail}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/billing" className="cursor-pointer">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/tools" className="cursor-pointer">
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Tools
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/history" className="cursor-pointer">
                  <FileText className="mr-2 h-4 w-4" />
                  History
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/saved" className="cursor-pointer">
                  <BookMarked className="mr-2 h-4 w-4" />
                  Saved Documents
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            {(plan === "free" || plan === "starter") && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/pricing" className="cursor-pointer text-primary font-medium">
                    <Zap className="mr-2 h-4 w-4" />
                    Upgrade Plan
                  </Link>
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {loggingOut ? "Signing out…" : "Sign Out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
