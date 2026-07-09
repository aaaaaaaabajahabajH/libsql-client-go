"use client";

import {
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
import Link from "next/link";
import { useTheme } from "next-themes";
import * as React from "react";

import { logoutAction } from "@/actions/auth";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { DbPlanType } from "@/types/database";

import { MobileNav } from "./mobile-nav";


export interface DashboardHeaderProps {
  userName: string | null;
  userEmail: string;
  avatarUrl: string | null;
  plan: DbPlanType;
  creditsBalance: number;
  creditsTotal: number;
  creditsPercentage: number;
  unreadNotificationCount: number;
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
  unreadNotificationCount,
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

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/50 bg-background/95 backdrop-blur-sm px-4 md:px-6">
      {/* Mobile menu trigger + logo */}
      <div className="flex items-center gap-2 md:hidden">
        <MobileNav
          creditsBalance={creditsBalance}
          creditsPercentage={creditsPercentage}
          creditsTotal={creditsTotal}
          plan={plan}
        />
      </div>

      {/* Search */}
      <div className="hidden sm:flex flex-1 max-w-xs">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            aria-label="Search"
            className="pl-9 h-9 bg-muted/40 border-transparent focus-visible:border-input focus-visible:bg-background text-sm"
            placeholder="Search tools, history…"
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
            aria-label="Toggle theme"
            className="h-9 w-9"
            size="icon"
            variant="ghost"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        )}

        {/* Notifications */}
        <NotificationDropdown initialUnreadCount={unreadNotificationCount} />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background ml-1">
              <Avatar className="h-8 w-8 border border-border/50">
                {avatarUrl && <AvatarImage alt={userName ?? ""} src={avatarUrl} />}
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
                <Link className="cursor-pointer" href="/dashboard/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link className="cursor-pointer" href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link className="cursor-pointer" href="/dashboard/billing">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link className="cursor-pointer" href="/dashboard/tools">
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Tools
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link className="cursor-pointer" href="/dashboard/history">
                  <FileText className="mr-2 h-4 w-4" />
                  History
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link className="cursor-pointer" href="/dashboard/saved">
                  <BookMarked className="mr-2 h-4 w-4" />
                  Saved Documents
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            {(plan === "free" || plan === "starter") && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link className="cursor-pointer text-primary font-medium" href="/pricing">
                    <Zap className="mr-2 h-4 w-4" />
                    Upgrade Plan
                  </Link>
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              disabled={loggingOut}
              onClick={handleLogout}
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
