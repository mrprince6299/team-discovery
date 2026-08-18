"use client"

import * as React from "react"
import Link from "next/link"
import {
  Users,
  CheckCircle2,
  XCircle,
  Mail,
  UserCheck,
  UserX,
  Star,
  Clock,
  Sparkles,
  UserMinus,
  Trash2,
  Check,
  ExternalLink,
  BellRing,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NotificationItem } from "@/app/actions/notifications"
import { cn } from "@/lib/utils"

interface NotificationItemProps {
  notification: NotificationItem
  onMarkRead?: (id: string) => void
  onDelete?: (id: string) => void
  isPending?: boolean
}

function getRelativeTime(date: Date | string): string {
  const now = new Date().getTime()
  const past = new Date(date).getTime()
  const diffInSeconds = Math.floor((now - past) / 1000)

  if (diffInSeconds < 60) return "Just now"
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function getNotificationMeta(type: string) {
  switch (type) {
    case "APPLICATION_RECEIVED":
      return {
        icon: Users,
        color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        label: "Application",
      }
    case "APPLICATION_ACCEPTED":
      return {
        icon: CheckCircle2,
        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        label: "Accepted",
      }
    case "APPLICATION_REJECTED":
    case "APPLICATION_AUTO_CLOSED":
      return {
        icon: XCircle,
        color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        label: "Application Update",
      }
    case "APPLICATION_WITHDRAWN":
      return {
        icon: UserMinus,
        color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        label: "Withdrawn",
      }
    case "INVITATION_RECEIVED":
      return {
        icon: Mail,
        color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
        label: "Invitation",
      }
    case "INVITATION_ACCEPTED":
      return {
        icon: UserCheck,
        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        label: "Joined Squad",
      }
    case "INVITATION_DECLINED":
      return {
        icon: UserX,
        color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        label: "Declined",
      }
    case "RATING_RECEIVED":
      return {
        icon: Star,
        color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        label: "Peer Review",
      }
    case "ROLE_FILLED":
    case "TEAM_FULL":
      return {
        icon: Sparkles,
        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        label: "Squad Update",
      }
    case "ROLE_EXPIRED":
      return {
        icon: Clock,
        color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        label: "Role Expired",
      }
    default:
      return {
        icon: BellRing,
        color: "text-primary bg-primary/10 border-primary/20",
        label: "Notification",
      }
  }
}

function getTargetLink(referenceType: string, referenceId: string): string | null {
  if (!referenceId) return null
  switch (referenceType) {
    case "TEAM":
      return `/teams/${referenceId}`
    case "INVITATION":
      return "/invitations"
    case "USER":
      return `/users/${referenceId}`
    default:
      return null
  }
}

export function NotificationItemCard({
  notification,
  onMarkRead,
  onDelete,
  isPending,
}: NotificationItemProps) {
  const meta = getNotificationMeta(notification.type)
  const Icon = meta.icon
  const targetLink = getTargetLink(notification.referenceType, notification.referenceId)
  const relativeTime = getRelativeTime(notification.createdAt)

  return (
    <div
      className={cn(
        "group relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-200",
        notification.isRead
          ? "bg-card/40 border-border/50 hover:bg-card/70"
          : "bg-card border-primary/30 shadow-xs ring-1 ring-primary/20"
      )}
      role="article"
      aria-label={`${notification.isRead ? "Read" : "Unread"} notification: ${notification.title}`}
    >
      {/* Unread indicator bar */}
      {!notification.isRead && (
        <span
          className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-500 rounded-r-full"
          aria-hidden="true"
        />
      )}

      {/* Icon Badge */}
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg border",
          meta.color
        )}
      >
        <Icon className="size-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Badge variant="outline" className="text-[10px] uppercase font-semibold tracking-wider">
            {meta.label}
          </Badge>
          <span className="text-xs text-muted-foreground">{relativeTime}</span>
          {!notification.isRead && (
            <span className="inline-flex items-center size-2 rounded-full bg-emerald-500 ring-2 ring-background" title="Unread" />
          )}
        </div>

        <h3 className={cn("text-sm font-semibold tracking-tight", notification.isRead ? "text-foreground/90" : "text-foreground")}>
          {notification.title}
        </h3>

        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">
          {notification.content}
        </p>

        {/* Action deep link if applicable */}
        {targetLink && (
          <div className="mt-2.5">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5 font-medium border-border/80 hover:border-primary/50"
            >
              <Link href={targetLink}>
                <span>View Details</span>
                <ExternalLink className="size-3 text-muted-foreground" />
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-1 shrink-0 self-start">
        {!notification.isRead && onMarkRead && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10"
            onClick={() => onMarkRead(notification.id)}
            disabled={isPending}
            aria-label="Mark as read"
            title="Mark as read"
          >
            <Check className="size-4" />
          </Button>
        )}

        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(notification.id)}
            disabled={isPending}
            aria-label="Delete notification"
            title="Delete notification"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
