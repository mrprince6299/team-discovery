"use client"

import * as React from "react"
import Link from "next/link"
import {
  CheckCheck,
  Inbox,
  Loader2,
  Sparkles,
  Users,
  Calendar,
  ShieldCheck,
  Star,
  Compass,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  NotificationItem,
  NotificationCategory,
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

const CATEGORIES: Array<{ id: NotificationCategory; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "ALL", label: "All Alerts", icon: Inbox },
  { id: "UNREAD", label: "Unread", icon: Sparkles },
  { id: "TEAM", label: "Squads & Roles", icon: Users },
  { id: "EVENT", label: "Events & Hackathons", icon: Calendar },
  { id: "VERIFICATION", label: "Verification", icon: ShieldCheck },
  { id: "REVIEWS", label: "Peer Reviews", icon: Star },
]

function isToday(date: Date | string) {
  const d = new Date(date)
  const now = new Date()
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  )
}

function isYesterday(date: Date | string) {
  const d = new Date(date)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  )
}

function isThisWeek(date: Date | string) {
  const d = new Date(date)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  return d > weekAgo && !isToday(d) && !isYesterday(d)
}

export function NotificationList({
  initialNotifications,
  initialUnreadCount,
}: NotificationListProps) {
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(initialNotifications)
  const [unreadCount, setUnreadCount] = React.useState<number>(initialUnreadCount)
  const [activeCategory, setActiveCategory] = React.useState<NotificationCategory>("ALL")
  const [isPending, startTransition] = React.useTransition()

  // Filter items based on activeCategory
  const filteredNotifications = React.useMemo(() => {
    switch (activeCategory) {
      case "UNREAD":
        return notifications.filter((n) => !n.isRead)
      case "TEAM":
        return notifications.filter((n) =>
          [
            "APPLICATION_RECEIVED",
            "APPLICATION_ACCEPTED",
            "APPLICATION_REJECTED",
            "APPLICATION_AUTO_CLOSED",
            "APPLICATION_WITHDRAWN",
            "INVITATION_RECEIVED",
            "INVITATION_ACCEPTED",
            "INVITATION_DECLINED",
            "ROLE_FILLED",
            "TEAM_FULL",
            "ROLE_EXPIRED",
            "LEADERSHIP_TRANSFERRED",
          ].includes(n.type)
        )
      case "EVENT":
        return notifications.filter((n) =>
          [
            "EVENT_ANNOUNCEMENT",
            "EVENT_PUBLISHED",
            "EVENT_UPDATED",
            "REGISTRATION_OPENING",
            "REGISTRATION_CLOSING",
          ].includes(n.type)
        )
      case "VERIFICATION":
        return notifications.filter((n) =>
          [
            "VERIFICATION_APPROVED",
            "VERIFICATION_REJECTED",
            "VERIFICATION_SUBMITTED",
          ].includes(n.type)
        )
      case "REVIEWS":
        return notifications.filter((n) => n.type === "RATING_RECEIVED")
      default:
        return notifications
    }
  }, [notifications, activeCategory])

  // Group notifications into Date clusters
  const groupedNotifications = React.useMemo(() => {
    const groups: { [key: string]: NotificationItem[] } = {
      Today: [],
      Yesterday: [],
      "This Week": [],
      Earlier: [],
    }

    filteredNotifications.forEach((n) => {
      if (isToday(n.createdAt)) {
        groups.Today.push(n)
      } else if (isYesterday(n.createdAt)) {
        groups.Yesterday.push(n)
      } else if (isThisWeek(n.createdAt)) {
        groups["This Week"].push(n)
      } else {
        groups.Earlier.push(n)
      }
    })

    return groups
  }, [filteredNotifications])

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
      {/* Header Controls & Filter Tabs */}
      <div className="space-y-4 pb-4 border-b border-border/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Scrollable Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const isActive = activeCategory === cat.id
              const isUnreadTab = cat.id === "UNREAD"
              return (
                <Button
                  key={cat.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(cat.id)}
                  className="rounded-xl h-8 gap-1.5 text-xs font-semibold shrink-0"
                >
                  <Icon className="size-3.5" />
                  <span>{cat.label}</span>
                  {isUnreadTab && unreadCount > 0 && (
                    <Badge
                      className="px-1.5 py-0 text-[10px] h-4 rounded-full bg-emerald-500 text-white font-mono"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                  {cat.id === "ALL" && (
                    <Badge
                      variant={isActive ? "secondary" : "outline"}
                      className="px-1.5 py-0 text-[10px] h-4 rounded-full font-mono"
                    >
                      {notifications.length}
                    </Badge>
                  )}
                </Button>
              )
            })}
          </div>

          {/* Mark All As Read Bulk Action */}
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isPending}
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8 rounded-xl shrink-0 self-start sm:self-auto"
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
      </div>

      {/* Notification Stream or Empty State */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed border-border/70 bg-card/40 space-y-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mx-auto">
            <Inbox className="size-7 opacity-60" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-foreground">
              {activeCategory === "UNREAD" ? "No unread alerts" : "You're all caught up"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {activeCategory === "UNREAD"
                ? "You have acknowledged all your notifications. Switch to All Alerts to browse history."
                : "Team invitations, application updates, verification decisions, and important event activity will appear here."}
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2">
            <Button asChild size="sm" variant="outline" className="rounded-xl text-xs gap-1.5">
              <Link href="/discover">
                <Compass className="size-3.5 text-primary" />
                <span>Find Teammates</span>
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-xl text-xs gap-1.5">
              <Link href="/events">
                <Calendar className="size-3.5 text-purple-500" />
                <span>Explore Hackathons</span>
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedNotifications).map(([groupTitle, items]) => {
            if (items.length === 0) return null
            return (
              <div key={groupTitle} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {groupTitle}
                  </h2>
                  <div className="h-px bg-border/60 flex-1" />
                </div>

                <div className="space-y-3">
                  {items.map((notification) => (
                    <NotificationItemCard
                      key={notification.id}
                      notification={notification}
                      onMarkRead={handleMarkRead}
                      onDelete={handleDelete}
                      isPending={isPending}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
