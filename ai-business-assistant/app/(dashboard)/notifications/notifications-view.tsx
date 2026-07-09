"use client";

import { useState } from "react";
import { Bell, CheckCheck, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationItem } from "@/components/notifications/notification-item";
import {
  markAllNotificationsReadAction,
  deleteAllNotificationsAction,
  fetchNotificationsAction,
} from "@/actions/notifications";
import type { NotificationRow, DbNotificationType } from "@/types/database";

interface NotificationsViewProps {
  initialNotifications: NotificationRow[];
  initialTotal: number;
  initialUnreadCount: number;
}

const TABS: Array<{ value: string; label: string; type?: DbNotificationType }> = [
  { value: "all", label: "All" },
  { value: "billing", label: "Billing", type: "billing" },
  { value: "ai", label: "AI", type: "ai" },
  { value: "security", label: "Security", type: "security" },
  { value: "product", label: "Product", type: "product" },
];

export function NotificationsView({
  initialNotifications,
  initialTotal,
  initialUnreadCount,
}: NotificationsViewProps) {
  const [notifications, setNotifications] = useState<NotificationRow[]>(initialNotifications);
  const [total, setTotal] = useState(initialTotal);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [activeTab, setActiveTab] = useState("all");
  const [markingAll, setMarkingAll] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const filtered =
    activeTab === "all"
      ? notifications
      : notifications.filter((n) => n.type === activeTab);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    await markAllNotificationsReadAction().catch(() => null);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    setMarkingAll(false);
  };

  const handleClearAll = async () => {
    setClearingAll(true);
    await deleteAllNotificationsAction().catch(() => null);
    setNotifications([]);
    setTotal(0);
    setUnreadCount(0);
    setClearingAll(false);
  };

  const handleDelete = (id: string) => {
    const wasUnread = notifications.find((n) => n.id === id)?.is_read === false;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));
    if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const result = await fetchNotificationsAction(30, notifications.length);
      setNotifications((prev) => [...prev, ...result.notifications]);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {total} total
            {unreadCount > 0 && (
              <span>
                {" "}·{" "}
                <Badge variant="secondary" className="text-xs h-5 px-1.5">
                  {unreadCount} unread
                </Badge>
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markingAll}
            >
              {markingAll ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
              )}
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={clearingAll}
              className="text-destructive hover:text-destructive"
            >
              {clearingAll ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              )}
              Clear all
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-9">
          {TABS.map((t) => {
            const count =
              t.value === "all"
                ? notifications.length
                : notifications.filter((n) => n.type === t.value).length;
            return (
              <TabsTrigger key={t.value} value={t.value} className="text-xs">
                {t.label}
                {count > 0 && (
                  <span className="ml-1.5 text-muted-foreground tabular-nums">({count})</span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <div className="rounded-xl border border-border/60 divide-y divide-border/40 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No notifications here</p>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === "all"
                ? "You're all caught up!"
                : `No ${activeTab} notifications yet.`}
            </p>
          </div>
        ) : (
          filtered.map((n) => (
            <NotificationItem key={n.id} notification={n} onDelete={handleDelete} />
          ))
        )}
      </div>

      {notifications.length < total && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore}>
            {loadingMore && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
