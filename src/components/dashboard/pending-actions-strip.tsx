"use client"

import * as React from "react"
import Link from "next/link"
import {
  Mail,
  FileText,
  Bell,
  ArrowRight,
  CheckCircle2,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DashboardData } from "@/app/actions/dashboard"

interface PendingActionsStripProps {
  metrics: DashboardData["metrics"]
  pendingInvitations: DashboardData["pendingInvitations"]
  pendingApplications: DashboardData["pendingApplications"]
  unreadNotificationsCount: number
}

export function PendingActionsStrip({
  metrics,
  pendingInvitations,
  pendingApplications,
  unreadNotificationsCount,
}: PendingActionsStripProps) {
  const totalPending =
    metrics.pendingInvitationsCount +
    metrics.pendingApplicationsCount +
    unreadNotificationsCount

  if (totalPending === 0) {
    return (
      <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-foreground backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="size-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">
              Inbox Zero — You&apos;re All Caught Up
            </h4>
            <p className="text-xs text-muted-foreground">
              No pending applications or invitations requiring your attention right now.
            </p>
          </div>
        </div>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-8 text-xs font-medium border-border/80 hover:border-primary/40 hidden sm:flex"
        >
          <Link href="/discover">
            <span>Find Teammates</span>
            <ArrowRight className="size-3 ml-1" />
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-amber-500" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Items Requiring Attention
          </h3>
          <Badge
            variant="secondary"
            className="h-4 px-1.5 text-[10px] font-bold border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400"
          >
            {totalPending} Action{totalPending !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Pending Invitations Box */}
        {metrics.pendingInvitationsCount > 0 && (
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                <Mail className="size-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-foreground truncate">
                  {metrics.pendingInvitationsCount} Squad Invitation{metrics.pendingInvitationsCount !== 1 ? "s" : ""}
                </h4>
                <p className="text-[11px] text-muted-foreground truncate">
                  {pendingInvitations[0]?.teamName ? `From ${pendingInvitations[0].teamName}` : "Pending your response"}
                </p>
              </div>
            </div>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2.5 font-medium border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0"
            >
              <Link href="/invitations">
                <span>Review</span>
                <ArrowRight className="size-3 ml-1" />
              </Link>
            </Button>
          </div>
        )}

        {/* Pending Applications Box */}
        {metrics.pendingApplicationsCount > 0 && (
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-foreground truncate">
                  {metrics.pendingApplicationsCount} Role Application{metrics.pendingApplicationsCount !== 1 ? "s" : ""}
                </h4>
                <p className="text-[11px] text-muted-foreground truncate">
                  {pendingApplications[0]?.teamName ? `To ${pendingApplications[0].teamName}` : "Under review by leaders"}
                </p>
              </div>
            </div>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2.5 font-medium border-blue-500/30 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0"
            >
              <Link href="/applications">
                <span>View</span>
                <ArrowRight className="size-3 ml-1" />
              </Link>
            </Button>
          </div>
        )}

        {/* Unread Notifications Box */}
        {unreadNotificationsCount > 0 && (
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Bell className="size-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-foreground truncate">
                  {unreadNotificationsCount} Unread Alert{unreadNotificationsCount !== 1 ? "s" : ""}
                </h4>
                <p className="text-[11px] text-muted-foreground truncate">
                  Updates on your applications & reviews
                </p>
              </div>
            </div>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2.5 font-medium border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0"
            >
              <Link href="/notifications">
                <span>Inbox</span>
                <ArrowRight className="size-3 ml-1" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
