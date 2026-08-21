"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bell,
  CheckCheck,
  Inbox,
  Loader2,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  NotificationItem,
  getLatestNotificationsPreview,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/app/actions/notifications"
import { getNotificationMeta, getTargetLink, formatRelativeTime } from "./notification-item"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface NavbarNotificationDropdownProps {
  initialUnreadCount?: number
}

export function NavbarNotificationDropdown({
  initialUnreadCount = 0,
}: NavbarNotificationDropdownProps) {
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [hasFetched, setHasFetched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  const loadNotifications = async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      const res = await getLatestNotificationsPreview(4)
      setNotifications(res.notifications)
      setUnreadCount(res.unreadCount)
      setHasFetched(true)
    } catch {
      // Ignore preview fetch errors
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (open && !hasFetched) {
      loadNotifications()
    }
  }

  const handleItemClick = (n: NotificationItem) => {
    if (!n.isRead) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
      markNotificationRead(n.id)
    }

    const targetLink = getTargetLink(n.type, n.referenceType, n.referenceId)
    if (targetLink) {
      router.push(targetLink)
    }
  }

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (unreadCount === 0 || isPending) return

    startTransition(async () => {
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

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground rounded-xl"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white ring-2 ring-background">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80 sm:w-96 rounded-2xl p-0 shadow-lg border-border/80" align="end">
        {/* Dropdown Header */}
        <div className="p-3.5 bg-muted/30 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold py-0 px-1.5 rounded-full">
                {unreadCount} new
              </Badge>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={isPending}
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
            >
              <CheckCheck className="size-3 text-emerald-500" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Notification Preview List */}
        <div className="max-h-[320px] overflow-y-auto divide-y divide-border/40">
          {isLoading && !hasFetched ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="size-4 animate-spin mr-2" />
              <span className="text-xs">Loading alerts...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center px-4 space-y-1.5">
              <Inbox className="size-6 text-muted-foreground mx-auto opacity-50" />
              <p className="text-xs font-semibold text-foreground">No alerts right now</p>
              <p className="text-[11px] text-muted-foreground">
                You will be notified about team requests, verification decisions, and event alerts.
              </p>
            </div>
          ) : (
            <DropdownMenuGroup>
              {notifications.map((n) => {
                const meta = getNotificationMeta(n.type)
                const Icon = meta.icon
                const relativeTime = formatRelativeTime(n.createdAt)
                return (
                  <DropdownMenuItem
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={cn(
                      "p-3 flex items-start gap-3 cursor-pointer transition-colors focus:bg-muted/50",
                      !n.isRead && "bg-primary/5 font-medium"
                    )}
                  >
                    <div
                      className={cn(
                        "size-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5",
                        meta.color
                      )}
                    >
                      <Icon className="size-4" />
                    </div>

                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold truncate text-foreground">
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">
                        {n.content}
                      </p>
                      <span className="text-[10px] text-muted-foreground/80 block pt-0.5">
                        {relativeTime}
                      </span>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuGroup>
          )}
        </div>

        <DropdownMenuSeparator className="m-0" />

        {/* Footer Link */}
        <div className="p-2 bg-muted/20 text-center">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full text-xs font-semibold h-8 rounded-xl justify-center text-primary hover:text-primary hover:bg-primary/10 gap-1"
          >
            <Link href="/notifications">
              <span>View all notifications</span>
              <ArrowRight className="size-3" />
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
