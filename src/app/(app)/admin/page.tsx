import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { isCurrentUserAdmin } from "@/app/actions/verification"
import { getAdminDashboardOverview } from "@/app/actions/admin"
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Users,
  UserCheck,
  Layers,
  ArrowRight,
  FileText,
  Mail,
  Activity,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default async function AdminOverviewPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/login")
  }

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    notFound()
  }

  const res = await getAdminDashboardOverview()
  if (res.error || !res.metrics) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <p className="text-destructive font-semibold">Failed to load admin overview.</p>
      </div>
    )
  }

  const { metrics, recentRequests } = res

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase font-bold border-primary/40 text-primary bg-primary/10">
              Admin Workspace
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">Live Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Platform Administration
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Monitor real-time student verification requests, team formations, and platform metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button asChild size="sm" className="gap-1.5 font-semibold shadow-xs">
            <Link href="/admin/verify">
              <ShieldCheck className="size-4" />
              <span>Review Verifications</span>
              {metrics.pendingVerification > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] bg-amber-500 text-white">
                  {metrics.pendingVerification}
                </Badge>
              )}
            </Link>
          </Button>
        </div>
      </div>

      {/* Action Required Banner if Pending Requests Exist */}
      {metrics.pendingVerification > 0 && (
        <Card className="border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-card rounded-2xl shadow-sm">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="size-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Clock className="size-5 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-sm text-foreground">
                  {metrics.pendingVerification} Student Verification Request{metrics.pendingVerification === 1 ? "" : "s"} Awaiting Review
                </h3>
                <p className="text-xs text-muted-foreground">
                  Review complete student profiles and issue Verified Student badges to elevate discovery trust.
                </p>
              </div>
            </div>

            <Button asChild size="sm" variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300 gap-1.5 shrink-0">
              <Link href="/admin/verify">
                <span>Open Verification Queue</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Pending Verification */}
        <Card className="border-border/80 bg-card rounded-2xl shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending Review
            </span>
            <div className="size-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-3xl font-extrabold text-foreground font-mono">
              {metrics.pendingVerification}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Requests queued for admin approval
            </p>
          </div>
        </Card>

        {/* Metric 2: Verified Students */}
        <Card className="border-border/80 bg-card rounded-2xl shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Verified Students
            </span>
            <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <UserCheck className="size-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-3xl font-extrabold text-foreground font-mono">
              {metrics.verifiedUsers}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Active verified candidate trust badges
            </p>
          </div>
        </Card>

        {/* Metric 3: Total Students */}
        <Card className="border-border/80 bg-card rounded-2xl shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Students
            </span>
            <div className="size-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <Users className="size-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-3xl font-extrabold text-foreground font-mono">
              {metrics.totalUsers}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Registered platform participants
            </p>
          </div>
        </Card>

        {/* Metric 4: Active Teams */}
        <Card className="border-border/80 bg-card rounded-2xl shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Squads
            </span>
            <div className="size-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Layers className="size-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-3xl font-extrabold text-foreground font-mono">
              {metrics.activeTeams}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Teams recruiting or forming ({metrics.totalTeams} total)
            </p>
          </div>
        </Card>
      </div>

      {/* Secondary Operational Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl border border-border/70 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="size-4 text-muted-foreground" />
            <div>
              <p className="font-bold text-foreground">Pending Applications</p>
              <p className="text-[11px] text-muted-foreground">Candidate requests to join teams</p>
            </div>
          </div>
          <span className="font-mono font-extrabold text-base text-foreground">
            {metrics.pendingApplications}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border/70 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="size-4 text-muted-foreground" />
            <div>
              <p className="font-bold text-foreground">Pending Invitations</p>
              <p className="text-[11px] text-muted-foreground">Direct squad recruitment invites</p>
            </div>
          </div>
          <span className="font-mono font-extrabold text-base text-foreground">
            {metrics.pendingInvitations}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border/70 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="size-4 text-muted-foreground" />
            <div>
              <p className="font-bold text-foreground">Rejected Verifications</p>
              <p className="text-[11px] text-muted-foreground">Requests returned for clarification</p>
            </div>
          </div>
          <span className="font-mono font-extrabold text-base text-foreground">
            {metrics.rejectedVerification}
          </span>
        </div>
      </div>

      {/* Recent Verification Activity Section */}
      <Card className="border-border/80 shadow-sm rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              <span>Recent Verification Queue</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Latest student verification submissions across institutions.
            </CardDescription>
          </div>

          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-primary">
            <Link href="/admin/verify">
              <span>View Full Queue</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </CardHeader>

        <CardContent>
          {recentRequests.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-4 text-center">
              No verification requests recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-border/60">
              {recentRequests.map((req) => (
                <div key={req.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9 border border-border">
                      <AvatarImage src={req.avatarUrl ?? undefined} alt={req.name} />
                      <AvatarFallback className="text-xs font-bold">
                        {req.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{req.name}</span>
                        <span className="text-muted-foreground font-mono text-[11px]">@{req.username}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                        <span>{req.college}</span>
                        <span>·</span>
                        <span>{req.department}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <Badge
                      variant={
                        req.status === "APPROVED"
                          ? "success"
                          : req.status === "PENDING"
                          ? "outline"
                          : "destructive"
                      }
                      className="text-[10px] uppercase font-semibold"
                    >
                      {req.status}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {new Date(req.updatedAt).toLocaleDateString()}
                    </span>
                    <Button asChild variant="outline" size="sm" className="h-7 px-2.5 text-[11px]">
                      <Link href="/admin/verify">Review</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
