"use client";

import { Bell, CheckCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useCallback } from "react";

import { fetchNotificationsAction, markAllNotificationsReadAction } from "@/actions/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NotificationRow } from "@/types/database";

import { NotificationItem } from "./notification-item";

interface NotificationDropdownProps {
  initialUnreadCount: number;
}

export function NotificationDropdown({ initialUnreadCount }: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [loaded, setLoaded] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const result = await fetchNotificationsAction(10, 0);
      setNotifications(result.notifications);
      setUnreadCount(result.notifications.filter((n) => !n.is_read).length);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [loaded]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) loadNotifications();
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    await markAllNotificationsReadAction().catch(() => null);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    setMarkingAll(false);
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => {
      const wasUnread = notifications.find((n) => n.id === id)?.is_read === false;
      return wasUnread ? Math.max(0, prev - 1) : prev;
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button aria-label="Notifications" className="h-9 w-9 relative" size="icon" variant="ghost">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <Badge className="h-5 text-xs px-1.5" variant="secondary">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              disabled={markingAll}
              size="sm"
              variant="ghost"
              onClick={handleMarkAllRead}
            >
              {markingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
              <span className="ml-1">Mark all read</span>
            </Button>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-0" />

        <div className="max-h-96 overflow-y-auto py-1">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center py-10 px-4 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-2">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">No notifications right now</p>
            </div>
          ) : (
            <div className="px-1">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  compact
                  notification={n}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator className="my-0" />
            <div className="px-4 py-2">
              <Link
                className="text-xs text-primary hover:underline font-medium"
                href="/notifications"
                onClick={() => setOpen(false)}
              >
                View all notifications →
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
