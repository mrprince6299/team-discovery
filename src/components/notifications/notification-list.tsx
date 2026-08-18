"use client"

import * as React from "react"
import {
  CheckCheck,
  Inbox,
  Loader2,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  NotificationItem,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "@/app/actions/notifications"
import { NotificationItemCard } from "./notification-item"
import { toast } from "sonner"

interface NotificationListProps {
  initialNotifications: NotificationItem[]
  initialUnreadCount: number
}

export function NotificationList({
  initialNotifications,
  initialUnreadCount,
}: NotificationListProps) {
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(initialNotifications)
  const [unreadCount, setUnreadCount] = React.useState<number>(initialUnreadCount)
  const [activeFilter, setActiveFilter] = React.useState<"ALL" | "UNREAD">("ALL")
  const [isPending, startTransition] = React.useTransition()

  const displayedNotifications = React.useMemo(() => {
    if (activeFilter === "UNREAD") {
      return notifications.filter((n) => !n.isRead)
    }
    return notifications
  }, [notifications, activeFilter])

  const handleMarkRead = (id: string) => {
    startTransition(async () => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))

      const res = await markNotificationRead(id)
      if (res.error) {
        toast.error(res.error)
      }
    })
  }

  const handleMarkAllRead = () => {
    if (unreadCount === 0 || isPending) return

    startTransition(async () => {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)

      const res = await markAllNotificationsRead()
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("All notifications marked as read")
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const target = notifications.find((n) => n.id === id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }

      const res = await deleteNotification(id)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Notification deleted")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        {/* Filters */}
        <div className="flex items-center gap-2">
          <Button
            variant={activeFilter === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("ALL")}
            className="rounded-lg h-8 gap-1.5 text-xs font-medium"
          >
            <span>All Alerts</span>
            <Badge
              variant={activeFilter === "ALL" ? "secondary" : "outline"}
              className="px-1.5 py-0 text-[10px] h-4 rounded-full"
            >
              {notifications.length}
            </Badge>
          </Button>

          <Button
            variant={activeFilter === "UNREAD" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("UNREAD")}
            className="rounded-lg h-8 gap-1.5 text-xs font-medium"
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <Badge
                variant="success"
                className="px-1.5 py-0 text-[10px] h-4 rounded-full"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Bulk Action */}
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8 self-start sm:self-auto"
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCheck className="size-3.5 text-emerald-500" />
            )}
            <span>Mark all as read</span>
          </Button>
        )}
      </div>

      {/* Notifications Stream */}
      {displayedNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/30">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-4">
            {activeFilter === "UNREAD" ? (
              <Sparkles className="size-7 text-emerald-500" />
            ) : (
              <Inbox className="size-7" />
            )}
          </div>
          <h3 className="font-semibold text-base text-foreground mb-1">
            {activeFilter === "UNREAD" ? "You're all caught up!" : "No notifications yet"}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
            {activeFilter === "UNREAD"
              ? "There are no unread alerts in your inbox right now."
              : "When teammates apply to your squad, send you invites, or submit reviews, alerts will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3" role="feed" aria-label="Notifications Stream">
          {displayedNotifications.map((notification) => (
            <NotificationItemCard
              key={notification.id}
              notification={notification}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
              isPending={isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
