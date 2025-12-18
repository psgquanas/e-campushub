"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  IconBell,
  IconBellRinging,
  IconCheckbox,
  IconInbox,
  IconCheck,
  IconX,
  IconInfoCircle,
} from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  material?: {
    title: string;
    type: string;
  } | null;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      const data = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(
        data.notifications.filter((n: Notification) => !n.isRead).length
      );
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notificationId: string) => {
    // Optimistic update
    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;

    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to mark as read:", error);
      // Revert optimistic update
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update
    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });
    } catch (error) {
      toast.error("Failed to mark all as read");
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "MATERIAL_APPROVED":
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500/15 text-green-600 dark:text-green-500">
            <IconCheck className="size-5" />
          </div>
        );
      case "MATERIAL_REJECTED":
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/15 text-red-600 dark:text-red-500">
            <IconX className="size-5" />
          </div>
        );
      default:
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-500">
            <IconInfoCircle className="size-5" />
          </div>
        );
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <IconBellRinging className="size-5" />
          ) : (
            <IconBell className="size-5" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 size-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="end"
        sideOffset={12}
        collisionPadding={16}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={loading}
            >
              <IconCheckbox className="mr-2 size-4" />
              Mark all read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <IconInbox className="size-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">No notifications</h3>
            <p className="text-sm text-muted-foreground">
              You're all caught up!
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-accent cursor-pointer transition-colors relative group ${
                    !notification.isRead ? "bg-accent/50" : ""
                  }`}
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm leading-tight text-foreground/90">
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <div className="size-2 shrink-0 rounded-full bg-blue-500 mt-1.5 shadow-sm shadow-blue-500/50" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-snug">
                        {notification.message}
                      </p>
                      <p className="text-xs font-medium text-muted-foreground/70 pt-1 uppercase tracking-wider">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
