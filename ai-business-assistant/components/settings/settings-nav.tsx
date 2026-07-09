"use client";

import {
  User,
  Settings,
  Bot,
  BriefcaseBusiness,
  Bell,
  Shield,
  HardDrive,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/settings/profile",
    icon: User,
    label: "Profile",
    description: "Avatar, name, bio",
  },
  {
    href: "/settings/account",
    icon: Settings,
    label: "Account",
    description: "Password, theme, language",
  },
  {
    href: "/settings/ai",
    icon: Bot,
    label: "AI Preferences",
    description: "Model, tone, creativity",
  },
  {
    href: "/settings/workspace",
    icon: BriefcaseBusiness,
    label: "Workspace",
    description: "Name, logo, team",
  },
  {
    href: "/settings/notifications",
    icon: Bell,
    label: "Notifications",
    description: "Email & alert settings",
  },
  {
    href: "/settings/security",
    icon: Shield,
    label: "Security",
    description: "Sessions, 2FA, devices",
  },
  {
    href: "/settings/storage",
    icon: HardDrive,
    label: "Storage & Usage",
    description: "Credits, docs, history",
  },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="w-full space-y-0.5">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150",
              "text-sm group",
              isActive
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            href={item.href}
          >
            <item.icon
              className={cn(
                "h-4 w-4 shrink-0",
                isActive ? "text-accent-foreground" : "text-muted-foreground group-hover:text-foreground",
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium leading-none">{item.label}</p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{item.description}</p>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
