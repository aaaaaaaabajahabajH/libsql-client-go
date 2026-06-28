"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  LayoutDashboard,
  User,
  Settings,
  Zap,
  FileText,
  Mail,
  Share2,
  Receipt,
  PenTool,
  Globe,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const mainNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/profile", icon: User, label: "Profile" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
  { href: "/pricing", icon: CreditCard, label: "Upgrade" },
];

const tools = [
  { href: "/dashboard/tools/social-media", icon: Share2, label: "Social Media", badge: "Popular" },
  { href: "/dashboard/tools/product-description", icon: FileText, label: "Product Desc." },
  { href: "/dashboard/tools/email-writer", icon: Mail, label: "Email Writer" },
  { href: "/dashboard/tools/invoice-generator", icon: Receipt, label: "Invoice" },
  { href: "/dashboard/tools/blog-writer", icon: PenTool, label: "Blog Writer" },
  { href: "/dashboard/tools/translator", icon: Globe, label: "Translator" },
];

interface SidebarProps {
  creditsUsed: number;
  creditsTotal: number;
  plan: string;
}

export function Sidebar({ creditsUsed, creditsTotal, plan }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const creditsPercent = Math.min((creditsUsed / creditsTotal) * 100, 100);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-border/50 bg-card transition-all duration-300 relative",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border/50 px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent text-sm">
              AI Business
            </span>
          )}
        </Link>
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border/50 bg-background shadow-sm hover:bg-accent transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {/* Main navigation */}
        <div>
          {!collapsed && (
            <p className="px-2 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Navigation
            </p>
          )}
          <ul className="space-y-1">
            {mainNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      collapsed && "justify-center px-2"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* AI Tools */}
        <div>
          {!collapsed && (
            <p className="px-2 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              AI Tools
            </p>
          )}
          <ul className="space-y-1">
            {tools.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      collapsed && "justify-center px-2"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && (
                      <span className="flex-1">{item.label}</span>
                    )}
                    {!collapsed && item.badge && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Credits section */}
      {!collapsed && (
        <div className="border-t border-border/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span>Credits</span>
            </div>
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 capitalize">
              {plan}
            </Badge>
          </div>
          <Progress value={creditsPercent} className="h-1.5 mb-1.5" />
          <p className="text-xs text-muted-foreground">
            {creditsUsed.toLocaleString()} / {creditsTotal.toLocaleString()} used
          </p>
        </div>
      )}
    </aside>
  );
}
