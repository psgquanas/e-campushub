"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  postId?: string | null;
  commentId?: string | null;
  material?: {
    title: string;
    type: string;
  } | null;
  post?: {
    id: string;
    content: string;
    author: {
      name: string;
    };
  } | null;
  comment?: {
    id: string;
    content: string;
    postId: string;
  } | null;
}

export function NotificationBell() {
  const router = useRouter();
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
        data.notifications.filter((n: Notification) => !n.isRead).length,
      );
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Navigate to the post modal
    if (notification.postId || notification.comment?.postId) {
      const postId = notification.postId || notification.comment?.postId;
      router.push(`/dashboard/feed/${postId}`);
      setOpen(false);
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
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
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
      case "POST_LIKED":
      case "COMMENT_LIKED":
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-500/15 text-pink-600 dark:text-pink-500">
            <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        );
      case "COMMENT_REPLY":
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-500">
            <svg
              className="size-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
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
                  onClick={() => handleNotificationClick(notification)}
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
