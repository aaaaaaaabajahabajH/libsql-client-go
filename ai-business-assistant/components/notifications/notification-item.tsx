"use client";

import { useState } from "react";
import { CreditCard, Sparkles, Shield, Package, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { markNotificationReadAction, deleteNotificationAction } from "@/actions/notifications";
import type { NotificationRow, DbNotificationType } from "@/types/database";

const TYPE_ICON: Record<DbNotificationType, React.ComponentType<{ className?: string }>> = {
  billing: CreditCard,
  ai: Sparkles,
  security: Shield,
  product: Package,
};

const TYPE_COLOR: Record<DbNotificationType, string> = {
  billing: "bg-amber-100 text-amber-600",
  ai: "bg-violet-100 text-violet-600",
  security: "bg-red-100 text-red-600",
  product: "bg-blue-100 text-blue-600",
};

interface NotificationItemProps {
  notification: NotificationRow;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export function NotificationItem({ notification, onDelete, compact = false }: NotificationItemProps) {
  const [deleting, setDeleting] = useState(false);
  const Icon = TYPE_ICON[notification.type];
  const colorClass = TYPE_COLOR[notification.type];

  const relativeTime = (() => {
    const diff = Date.now() - new Date(notification.created_at).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  })();

  const handleMouseEnter = () => {
    if (!notification.is_read) {
      markNotificationReadAction(notification.id).catch(() => null);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(true);
    await deleteNotificationAction(notification.id).catch(() => null);
    onDelete?.(notification.id);
    setDeleting(false);
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      className={cn(
        "group flex items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted/50",
        !notification.is_read && "bg-primary/5",
      )}
    >
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", colorClass)}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm leading-snug", notification.is_read ? "font-normal text-foreground" : "font-semibold text-foreground")}>
            {notification.title}
          </p>
          {!compact && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Delete notification"
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
          {notification.message}
        </p>
        <p className="text-[11px] text-muted-foreground/60 mt-1">{relativeTime}</p>
      </div>

      {!notification.is_read && (
        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
    </div>
  );
}
