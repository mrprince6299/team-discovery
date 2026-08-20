"use client"

import * as React from "react"
import Link from "next/link"
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Layers,
  Activity,
  MessageSquare,
  Paperclip,
  Link2,
  Star,
  CheckCircle2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface AnalyticsData {
  users: {
    total: number
    verified: number
    pending: number
    unverified: number
    verificationRate: number
  }
  teams: {
    total: number
    active: number
    full: number
    closed: number
    draft: number
  }
  recruitment: {
    totalApplications: number
    acceptedApplications: number
    pendingApplications: number
    rejectedApplications: number
    applicationAcceptanceRate: number
    totalInvitations: number
    acceptedInvitations: number
    pendingInvitations: number
  }
  verification: {
    totalRequests: number
    approved: number
    pending: number
    rejected: number
    approvalRate: number
    rejectionRate: number
  }
  engagement: {
    totalNotifications: number
    readNotifications: number
    totalMessages: number
    totalFiles: number
    totalLinks: number
    totalRatingsCount: number
    avgRatingScore: number
  }
}

export function AdminAnalyticsClient({ data }: { data: AnalyticsData }) {
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/admin" className="hover:text-foreground">Admin Console</Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Analytics &amp; Metrics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Platform &amp; Verification Analytics
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Real-time platform intelligence across student verification, squad formation, and candidate matching.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
            <Link href="/admin">
              <span>Admin Overview</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* SECTION 1: VERIFICATION TRUST INTELLIGENCE */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-bold text-foreground">Verification &amp; Trust Analytics</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border-border/80 rounded-2xl space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Verification Submissions
            </span>
            <div className="text-3xl font-extrabold font-mono text-foreground">
              {data.verification.totalRequests}
            </div>
            <p className="text-[11px] text-muted-foreground">Lifetime student verification applications</p>
          </Card>

          <Card className="p-5 border-emerald-500/40 bg-emerald-500/5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Approval Rate
              </span>
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              {data.verification.approvalRate}%
            </div>
            <p className="text-[11px] text-muted-foreground">
              {data.verification.approved} approved out of resolved
            </p>
          </Card>

          <Card className="p-5 border-amber-500/40 bg-amber-500/5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Pending Queue
              </span>
              <Clock className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
              {data.verification.pending}
            </div>
            <p className="text-[11px] text-muted-foreground">Active requests awaiting admin decision</p>
          </Card>

          <Card className="p-5 border-destructive/40 bg-destructive/5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-destructive">
                Rejection Rate
              </span>
              <ShieldAlert className="size-4 text-destructive" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-destructive">
              {data.verification.rejectionRate}%
            </div>
            <p className="text-[11px] text-muted-foreground">
              {data.verification.rejected} returned for clarification
            </p>
          </Card>
        </div>
      </div>

      {/* SECTION 2: PARTICIPATION & SQUADS */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Platform Activity &amp; Squad Pipeline</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 border-border/80 rounded-2xl space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Student Directory
            </span>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Students:</span>
                <span className="font-bold font-mono">{data.users.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verified Students:</span>
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {data.users.verified} ({data.users.verificationRate}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unverified Students:</span>
                <span className="font-bold font-mono text-muted-foreground">{data.users.unverified}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-border/80 rounded-2xl space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Squad Formations
            </span>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Squads:</span>
                <span className="font-bold font-mono">{data.teams.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active / Forming:</span>
                <span className="font-bold font-mono text-sky-600 dark:text-sky-400">{data.teams.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Full / Ready:</span>
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{data.teams.full}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Closed / Completed:</span>
                <span className="font-bold font-mono text-muted-foreground">{data.teams.closed}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-border/80 rounded-2xl space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recruitment Matching
            </span>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Applications Submitted:</span>
                <span className="font-bold font-mono">{data.recruitment.totalApplications}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Acceptance Rate:</span>
                <span className="font-bold font-mono text-primary">
                  {data.recruitment.applicationAcceptanceRate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invitations Sent:</span>
                <span className="font-bold font-mono">{data.recruitment.totalInvitations}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* SECTION 3: WORKSPACE & COLLABORATION ENGAGEMENT */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Workspace Engagement &amp; Peer Ratings</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageSquare className="size-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Messages</span>
            </div>
            <div className="text-2xl font-extrabold font-mono text-foreground">
              {data.engagement.totalMessages}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Paperclip className="size-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Shared Files</span>
            </div>
            <div className="text-2xl font-extrabold font-mono text-foreground">
              {data.engagement.totalFiles}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Link2 className="size-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Resource Links</span>
            </div>
            <div className="text-2xl font-extrabold font-mono text-foreground">
              {data.engagement.totalLinks}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-1">
            <div className="flex items-center gap-2 text-amber-500">
              <Star className="size-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Peer Ratings
              </span>
            </div>
            <div className="text-2xl font-extrabold font-mono text-foreground">
              {data.engagement.avgRatingScore > 0 ? `${data.engagement.avgRatingScore} / 5` : "N/A"}
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">
              {data.engagement.totalRatingsCount} reviews recorded
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
