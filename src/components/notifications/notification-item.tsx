"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
  ArrowRight,
  BellRing,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Layers,
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

export function formatRelativeTime(date: Date | string): string {
  const now = new Date().getTime()
  const past = new Date(date).getTime()
  const diffInSeconds = Math.max(0, Math.floor((now - past) / 1000))

  if (diffInSeconds < 60) return "Just now"
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function getNotificationMeta(type: string) {
  switch (type) {
    case "APPLICATION_RECEIVED":
      return {
        icon: Users,
        color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        label: "Squad Application",
        actionLabel: "Review Application",
      }
    case "APPLICATION_ACCEPTED":
      return {
        icon: CheckCircle2,
        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        label: "Application Accepted",
        actionLabel: "Open Workspace",
      }
    case "APPLICATION_REJECTED":
    case "APPLICATION_AUTO_CLOSED":
      return {
        icon: XCircle,
        color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        label: "Application Update",
        actionLabel: "View Applications",
      }
    case "APPLICATION_WITHDRAWN":
      return {
        icon: UserMinus,
        color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        label: "Application Withdrawn",
        actionLabel: "View Squad",
      }
    case "INVITATION_RECEIVED":
      return {
        icon: Mail,
        color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
        label: "Team Invitation",
        actionLabel: "View Invitation",
      }
    case "INVITATION_ACCEPTED":
      return {
        icon: UserCheck,
        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        label: "Teammate Joined",
        actionLabel: "Open Workspace",
      }
    case "INVITATION_DECLINED":
      return {
        icon: UserX,
        color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        label: "Invitation Declined",
        actionLabel: "View Squad",
      }
    case "RATING_RECEIVED":
      return {
        icon: Star,
        color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        label: "Peer Review",
        actionLabel: "View Profile",
      }
    case "ROLE_FILLED":
      return {
        icon: Sparkles,
        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        label: "Role Filled",
        actionLabel: "View Squad",
      }
    case "TEAM_FULL":
      return {
        icon: Layers,
        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        label: "Squad Roster Full",
        actionLabel: "Open Workspace",
      }
    case "ROLE_EXPIRED":
      return {
        icon: Clock,
        color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        label: "Role Expired",
        actionLabel: "Manage Roles",
      }
    case "LEADERSHIP_TRANSFERRED":
      return {
        icon: Users,
        color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
        label: "Leadership Transfer",
        actionLabel: "Open Workspace",
      }
    case "VERIFICATION_APPROVED":
      return {
        icon: ShieldCheck,
        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        label: "Student Verified",
        actionLabel: "View Profile",
      }
    case "VERIFICATION_REJECTED":
      return {
        icon: ShieldAlert,
        color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        label: "Verification Update",
        actionLabel: "Update Verification",
      }
    case "VERIFICATION_SUBMITTED":
      return {
        icon: ShieldCheck,
        color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        label: "Verification Submitted",
        actionLabel: "Check Status",
      }
    case "EVENT_ANNOUNCEMENT":
    case "EVENT_PUBLISHED":
    case "EVENT_UPDATED":
    case "REGISTRATION_OPENING":
    case "REGISTRATION_CLOSING":
      return {
        icon: Calendar,
        color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
        label: "Hackathon Event",
        actionLabel: "View Hackathon",
      }
    default:
      return {
        icon: BellRing,
        color: "text-primary bg-primary/10 border-primary/20",
        label: "Notification",
        actionLabel: "View Details",
      }
  }
}

export function getTargetLink(type: string, referenceType: string, referenceId: string): string | null {
  if (type === "VERIFICATION_APPROVED") {
    return "/profile"
  }
  if (type === "VERIFICATION_REJECTED" || type === "VERIFICATION_SUBMITTED") {
    return "/verify/student"
  }
  if (type === "INVITATION_RECEIVED") {
    return "/invitations"
  }
  if (type === "APPLICATION_REJECTED" || type === "APPLICATION_AUTO_CLOSED") {
    return "/applications"
  }
  if (type === "RATING_RECEIVED") {
    return "/profile"
  }

  if (referenceType === "TEAM" && referenceId) {
    if (
      type === "APPLICATION_ACCEPTED" ||
      type === "INVITATION_ACCEPTED" ||
      type === "TEAM_FULL" ||
      type === "LEADERSHIP_TRANSFERRED"
    ) {
      return `/teams/${referenceId}/workspace`
    }
    return `/teams/${referenceId}`
  }

  if (referenceType === "INVITATION") {
    return "/invitations"
  }

  if (referenceType === "EVENT" && referenceId) {
    return `/events/${referenceId}`
  }

  if (referenceType === "USER" && referenceId) {
    return `/users/${referenceId}`
  }

  return null
}

export function NotificationItemCard({
  notification,
  onMarkRead,
  onDelete,
  isPending,
}: NotificationItemProps) {
  const router = useRouter()
  const meta = getNotificationMeta(notification.type)
  const Icon = meta.icon
  const targetLink = getTargetLink(notification.type, notification.referenceType, notification.referenceId)
  const relativeTime = formatRelativeTime(notification.createdAt)

  const handleCardClick = (e: React.MouseEvent) => {
    // If clicking a button or link inside, allow standard action
    const target = e.target as HTMLElement
    if (target.closest("button") || target.closest("a")) {
      return
    }

    if (!notification.isRead && onMarkRead) {
      onMarkRead(notification.id)
    }

    if (targetLink) {
      router.push(targetLink)
    }
  }

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!notification.isRead && onMarkRead) {
      onMarkRead(notification.id)
    }
    if (targetLink) {
      router.push(targetLink)
    }
  }

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "group relative flex flex-col sm:flex-row items-start justify-between gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer",
        notification.isRead
          ? "bg-card/40 border-border/50 hover:bg-card/80 text-muted-foreground"
          : "bg-card border-primary/30 shadow-xs ring-1 ring-primary/20 hover:border-primary/50 text-foreground"
      )}
      role="article"
      aria-label={`${notification.isRead ? "Read" : "Unread"} notification: ${notification.title}`}
    >
      {/* Unread Indicator Bar */}
      {!notification.isRead && (
        <span
          className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-500 rounded-r-full"
          aria-hidden="true"
        />
      )}

      {/* Main Content Area */}
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        {/* Category Icon */}
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl border mt-0.5",
            meta.color
          )}
        >
          <Icon className="size-5" />
        </div>

        {/* Text Details */}
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-sm leading-snug text-foreground">
              {notification.title}
            </span>
            <Badge
              variant="outline"
              className={cn("text-[10px] font-semibold px-1.5 py-0", meta.color)}
            >
              {meta.label}
            </Badge>
            {!notification.isRead && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>New</span>
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
            {notification.content}
          </p>

          <div className="pt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 font-medium">
              <Clock className="size-3" />
              <span>{relativeTime}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
        {targetLink && (
          <Button
            type="button"
            size="sm"
            onClick={handleActionClick}
            className="h-8 px-3 text-xs font-semibold gap-1.5 rounded-xl shadow-2xs"
          >
            <span>{meta.actionLabel}</span>
            <ArrowRight className="size-3" />
          </Button>
        )}

        {!notification.isRead && onMarkRead && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              onMarkRead(notification.id)
            }}
            disabled={isPending}
            className="size-8 rounded-xl text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10"
            title="Mark as read"
            aria-label="Mark as read"
          >
            <Check className="size-4" />
          </Button>
        )}

        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(notification.id)
            }}
            disabled={isPending}
            className="size-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Delete notification"
            aria-label="Delete notification"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
