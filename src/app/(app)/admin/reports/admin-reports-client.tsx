"use client"

import * as React from "react"
import { useState, useMemo, useTransition } from "react"
import Link from "next/link"
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Flag,
  Calendar,
  ExternalLink,
  Loader2,
  Lock,
  Unlock,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  updateReportStatus,
  resolveReport,
  dismissReport,
  suspendUser,
  liftUserSuspension,
} from "@/app/actions/admin-moderation"
import { toast } from "sonner"
import type { ReportStatus, ReportTargetType, ReportReason } from "@prisma/client"

export interface AdminReportItem {
  id: string
  reporterId: string
  targetType: ReportTargetType
  targetId: string
  reason: ReportReason
  description: string | null
  status: ReportStatus
  resolverId: string | null
  resolutionNote: string | null
  actionTaken: string | null
  resolvedAt: Date | null
  createdAt: Date
  reporter: {
    id: string
    name: string
    username: string
    profilePhoto: string | null
  }
  resolver?: {
    id: string
    name: string
    username: string
  } | null
  targetContext?: any
}

interface AdminReportsClientProps {
  initialReports: AdminReportItem[]
  initialCounts: {
    open: number
    inReview: number
    resolved: number
    dismissed: number
    total: number
  }
}

export function AdminReportsClient({ initialReports, initialCounts }: AdminReportsClientProps) {
  const [reports, setReports] = useState<AdminReportItem[]>(initialReports)
  const [counts, setCounts] = useState(initialCounts)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>("ALL")
  const [inspectReport, setInspectReport] = useState<AdminReportItem | null>(null)
  const [isPending, startTransition] = useTransition()

  // Action Dialog States
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false)
  const [resolveActionTaken, setResolveActionTaken] = useState("")
  const [resolveNote, setResolveNote] = useState("")

  const [isDismissDialogOpen, setIsDismissDialogOpen] = useState(false)
  const [dismissalReason, setDismissalReason] = useState("")

  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false)
  const [suspensionReason, setSuspensionReason] = useState("")

  const [isLiftSuspendDialogOpen, setIsLiftSuspendDialogOpen] = useState(false)

  // Filter & Search Logic
  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      if (statusFilter !== "ALL" && rep.status !== statusFilter) return false
      if (targetTypeFilter !== "ALL" && rep.targetType !== targetTypeFilter) return false

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim()
        const reporterMatch =
          rep.reporter.name.toLowerCase().includes(q) ||
          rep.reporter.username.toLowerCase().includes(q)
        const reasonMatch = rep.reason.toLowerCase().includes(q)
        const descMatch = rep.description?.toLowerCase().includes(q)
        const targetContextMatch = JSON.stringify(rep.targetContext || {}).toLowerCase().includes(q)
        return reporterMatch || reasonMatch || descMatch || targetContextMatch
      }
      return true
    })
  }, [reports, statusFilter, targetTypeFilter, searchQuery])

  // Status Badge Helper
  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case "OPEN":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] uppercase font-bold">
            <Clock className="size-3 mr-1" />
            Open
          </Badge>
        )
      case "IN_REVIEW":
        return (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] uppercase font-bold">
            <ShieldAlert className="size-3 mr-1 animate-pulse" />
            In Review
          </Badge>
        )
      case "RESOLVED":
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] uppercase font-bold">
            <CheckCircle2 className="size-3 mr-1" />
            Resolved
          </Badge>
        )
      case "DISMISSED":
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[10px] uppercase font-bold">
            <XCircle className="size-3 mr-1" />
            Dismissed
          </Badge>
        )
    }
  }

  // Triage Handlers
  const handleMarkInReview = (reportId: string) => {
    startTransition(async () => {
      const res = await updateReportStatus(reportId, "IN_REVIEW")
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Report marked as In Review.")
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status: "IN_REVIEW" } : r))
        )
        setCounts((prev) => ({
          ...prev,
          open: Math.max(0, prev.open - 1),
          inReview: prev.inReview + 1,
        }))
        if (inspectReport?.id === reportId) {
          setInspectReport((prev) => (prev ? { ...prev, status: "IN_REVIEW" } : null))
        }
      }
    })
  }

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inspectReport) return

    startTransition(async () => {
      const res = await resolveReport(inspectReport.id, {
        actionTaken: resolveActionTaken.trim() || 'Report reviewed and resolved',
        resolutionNote: resolveNote.trim() || undefined,
      })

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Report marked as Resolved.")
        setReports((prev) =>
          prev.map((r) =>
            r.id === inspectReport.id
              ? {
                  ...r,
                  status: "RESOLVED",
                  actionTaken: resolveActionTaken.trim() || null,
                  resolutionNote: resolveNote.trim() || null,
                  resolvedAt: new Date(),
                }
              : r
          )
        )
        setCounts((prev) => ({
          ...prev,
          open: inspectReport.status === "OPEN" ? Math.max(0, prev.open - 1) : prev.open,
          inReview:
            inspectReport.status === "IN_REVIEW" ? Math.max(0, prev.inReview - 1) : prev.inReview,
          resolved: prev.resolved + 1,
        }))
        setIsResolveDialogOpen(false)
        setInspectReport(null)
      }
    })
  }

  const handleDismissSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inspectReport) return

    startTransition(async () => {
      const res = await dismissReport(inspectReport.id, dismissalReason.trim())
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Report Dismissed.")
        setReports((prev) =>
          prev.map((r) =>
            r.id === inspectReport.id
              ? {
                  ...r,
                  status: "DISMISSED",
                  resolutionNote: dismissalReason.trim() || null,
                  resolvedAt: new Date(),
                }
              : r
          )
        )
        setCounts((prev) => ({
          ...prev,
          open: inspectReport.status === "OPEN" ? Math.max(0, prev.open - 1) : prev.open,
          inReview:
            inspectReport.status === "IN_REVIEW" ? Math.max(0, prev.inReview - 1) : prev.inReview,
          dismissed: prev.dismissed + 1,
        }))
        setIsDismissDialogOpen(false)
        setInspectReport(null)
      }
    })
  }

  const handleSuspendUserSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inspectReport || inspectReport.targetType !== "USER" || !suspensionReason.trim()) {
      toast.error("Suspension reason is required.")
      return
    }

    startTransition(async () => {
      const res = await suspendUser(inspectReport.targetId, suspensionReason.trim())
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("User account suspended.")
        // Update local state
        setReports((prev) =>
          prev.map((r) => {
            if (r.targetType === "USER" && r.targetId === inspectReport.targetId) {
              return {
                ...r,
                targetContext: { ...r.targetContext, isSuspended: true },
              }
            }
            return r
          })
        )
        if (inspectReport) {
          setInspectReport({
            ...inspectReport,
            targetContext: { ...inspectReport.targetContext, isSuspended: true },
          })
        }
        setIsSuspendDialogOpen(false)
        setSuspensionReason("")
      }
    })
  }

  const handleLiftSuspensionSubmit = () => {
    if (!inspectReport || inspectReport.targetType !== "USER") return

    startTransition(async () => {
      const res = await liftUserSuspension(inspectReport.targetId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("User suspension lifted.")
        // Update local state
        setReports((prev) =>
          prev.map((r) => {
            if (r.targetType === "USER" && r.targetId === inspectReport.targetId) {
              return {
                ...r,
                targetContext: { ...r.targetContext, isSuspended: false },
              }
            }
            return r
          })
        )
        if (inspectReport) {
          setInspectReport({
            ...inspectReport,
            targetContext: { ...inspectReport.targetContext, isSuspended: false },
          })
        }
        setIsLiftSuspendDialogOpen(false)
      }
    })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/admin" className="hover:text-foreground">Admin Console</Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Reports &amp; Moderation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Trust &amp; Safety Moderation Queue
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Triage, investigate, resolve student incident reports, and manage reversible account suspensions.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card
          onClick={() => setStatusFilter("ALL")}
          className={`cursor-pointer border transition-all rounded-xl p-4 space-y-1 ${
            statusFilter === "ALL"
              ? "border-primary/50 bg-primary/5 shadow-2xs"
              : "border-border/70 hover:border-border"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Total Reports</span>
            <Flag className="size-4 text-primary" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-foreground">{counts.total}</div>
        </Card>

        <Card
          onClick={() => setStatusFilter("OPEN")}
          className={`cursor-pointer border transition-all rounded-xl p-4 space-y-1 ${
            statusFilter === "OPEN"
              ? "border-amber-500/50 bg-amber-500/5 shadow-2xs"
              : "border-border/70 hover:border-border"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Open Reports</span>
            <Clock className="size-4" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-foreground">{counts.open}</div>
        </Card>

        <Card
          onClick={() => setStatusFilter("IN_REVIEW")}
          className={`cursor-pointer border transition-all rounded-xl p-4 space-y-1 ${
            statusFilter === "IN_REVIEW"
              ? "border-primary/50 bg-primary/5 shadow-2xs"
              : "border-border/70 hover:border-border"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-primary">
            <span className="font-semibold uppercase tracking-wider text-[11px]">In Review</span>
            <ShieldAlert className="size-4" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-foreground">{counts.inReview}</div>
        </Card>

        <Card
          onClick={() => setStatusFilter("RESOLVED")}
          className={`cursor-pointer border transition-all rounded-xl p-4 space-y-1 ${
            statusFilter === "RESOLVED"
              ? "border-emerald-500/50 bg-emerald-500/5 shadow-2xs"
              : "border-border/70 hover:border-border"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Resolved</span>
            <CheckCircle2 className="size-4" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-foreground">{counts.resolved}</div>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reports by reporter, target, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Target Type Filter */}
          <Select value={targetTypeFilter} onValueChange={setTargetTypeFilter}>
            <SelectTrigger className="text-xs h-9 w-36">
              <SelectValue placeholder="All Targets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Targets</SelectItem>
              <SelectItem value="USER">User / Candidate</SelectItem>
              <SelectItem value="TEAM">Team / Squad</SelectItem>
              <SelectItem value="MESSAGE">Message</SelectItem>
              <SelectItem value="FILE">File</SelectItem>
              <SelectItem value="LINK">Link</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "OPEN", "IN_REVIEW", "RESOLVED", "DISMISSED"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="text-xs h-8 px-2.5 rounded-lg"
              >
                {status.replace(/_/g, " ")}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports Queue List */}
      {filteredReports.length === 0 ? (
        <Card className="rounded-2xl border-border/80 p-12 text-center space-y-3">
          <div className="size-12 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto text-muted-foreground">
            <ShieldCheck className="size-6 text-emerald-500" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground">
              {reports.length === 0 ? "Moderation queue is clear." : "No reports match your filters."}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {reports.length === 0
                ? "No student incident reports require moderation action at this time."
                : "Try resetting your search query or status filter to see all reports."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <Card
              key={report.id}
              className="border-border/80 hover:border-primary/40 transition-all rounded-2xl p-5 shadow-2xs"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Metadata & Target Snapshot */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-[10px] uppercase font-semibold font-mono">
                      #{report.id.slice(0, 8)}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold">
                      {report.targetType}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-destructive border-destructive/30">
                      {report.reason.replace(/_/g, " ")}
                    </Badge>
                    {getStatusBadge(report.status)}
                    {report.targetContext?.isSuspended && (
                      <Badge variant="destructive" className="text-[10px] uppercase font-bold">
                        Target Suspended
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span>Reporter:</span>
                      <span className="font-semibold text-foreground">{report.reporter.name}</span>
                      <span className="text-[11px] font-mono text-muted-foreground">(@{report.reporter.username})</span>
                    </div>

                    <span className="text-muted-foreground">·</span>

                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="size-3.5" />
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {report.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 italic bg-muted/30 p-2 rounded-lg">
                      &ldquo;{report.description}&rdquo;
                    </p>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Button
                    size="sm"
                    onClick={() => setInspectReport(report)}
                    className="gap-1.5 text-xs font-semibold shadow-xs"
                  >
                    <ShieldAlert className="size-3.5" />
                    <span>Review Report</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Review & Triage Drawer / Dialog */}
      {inspectReport && (
        <Dialog open={inspectReport !== null} onOpenChange={(open) => !open && setInspectReport(null)}>
          <DialogContent className="sm:max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-1.5 text-left border-b border-border/60 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] uppercase font-mono font-bold">
                    Report #{inspectReport.id.slice(0, 8)}
                  </Badge>
                  {getStatusBadge(inspectReport.status)}
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {new Date(inspectReport.createdAt).toLocaleString()}
                </span>
              </div>
              <DialogTitle className="text-xl font-extrabold text-foreground">
                Incident Review: {inspectReport.reason.replace(/_/g, " ")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Investigate the reported content and execute appropriate moderation actions.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4 text-xs">
              {/* 1. Reporter Information */}
              <div className="space-y-2">
                <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                  1. Reporting Student
                </h4>
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9 border border-border">
                      <AvatarImage src={inspectReport.reporter.profilePhoto || undefined} alt={inspectReport.reporter.name} />
                      <AvatarFallback className="text-xs font-bold">
                        {inspectReport.reporter.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-foreground">{inspectReport.reporter.name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">@{inspectReport.reporter.username}</p>
                    </div>
                  </div>

                  <Button asChild variant="outline" size="sm" className="h-7 text-[11px] gap-1">
                    <Link href={`/users/${inspectReport.reporter.id}`} target="_blank">
                      <span>View Profile</span>
                      <ExternalLink className="size-3" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* 2. Reporter Notes */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                  2. Incident Description &amp; Reason
                </h4>
                <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">Violation Category:</span>
                    <Badge variant="destructive" className="text-[10px] uppercase font-bold">
                      {inspectReport.reason.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground pt-1 leading-relaxed whitespace-pre-wrap">
                    {inspectReport.description || "No additional text description provided by reporter."}
                  </p>
                </div>
              </div>

              {/* 3. Hydrated Target Entity Inspection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                    3. Target Entity ({inspectReport.targetType})
                  </h4>
                  {inspectReport.targetType === "USER" && (
                    <Badge
                      variant={inspectReport.targetContext?.isSuspended ? "destructive" : "success"}
                      className="text-[10px] uppercase font-bold"
                    >
                      {inspectReport.targetContext?.isSuspended ? "Account Suspended" : "Account Active"}
                    </Badge>
                  )}
                </div>

                {/* Target Type: USER */}
                {inspectReport.targetType === "USER" && (
                  <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10 border border-border">
                          <AvatarImage src={inspectReport.targetContext?.profilePhoto || undefined} alt={inspectReport.targetContext?.name || "User"} />
                          <AvatarFallback className="text-xs font-bold">
                            {inspectReport.targetContext?.name?.slice(0, 2).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-sm text-foreground">{inspectReport.targetContext?.name || "Unknown User"}</p>
                          <p className="text-xs text-muted-foreground font-mono">@{inspectReport.targetContext?.username}</p>
                        </div>
                      </div>

                      <Button asChild size="sm" variant="outline" className="gap-1 text-xs">
                        <Link href={`/users/${inspectReport.targetId}`} target="_blank">
                          <span>Open Profile</span>
                          <ExternalLink className="size-3.5" />
                        </Link>
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-muted-foreground">
                      <div>
                        <span className="font-semibold text-foreground">College: </span>
                        <span>{inspectReport.targetContext?.college?.name || "Not specified"}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">Department: </span>
                        <span>{inspectReport.targetContext?.department?.name || "Not specified"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Target Type: TEAM */}
                {inspectReport.targetType === "TEAM" && (
                  <div className="p-4 rounded-xl border border-border/80 bg-card space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-foreground">{inspectReport.targetContext?.name || "Squad"}</p>
                        <p className="text-xs text-muted-foreground">
                          Event: {inspectReport.targetContext?.event?.name || "General Project"}
                        </p>
                      </div>

                      <Button asChild size="sm" variant="outline" className="gap-1 text-xs">
                        <Link href={`/teams/${inspectReport.targetId}`} target="_blank">
                          <span>View Squad</span>
                          <ExternalLink className="size-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Target Type: MESSAGE */}
                {inspectReport.targetType === "MESSAGE" && (
                  <div className="p-4 rounded-xl border border-border/80 bg-card space-y-2">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Sender: <strong className="text-foreground">{inspectReport.targetContext?.sender?.name}</strong></span>
                      <span>{inspectReport.targetContext?.createdAt ? new Date(inspectReport.targetContext.createdAt).toLocaleString() : ""}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-foreground font-mono text-xs whitespace-pre-wrap">
                      {inspectReport.targetContext?.content || "Message content"}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Previous Resolution Notes (if resolved or dismissed) */}
              {inspectReport.resolvedAt && (
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-[11px] uppercase tracking-wider">
                      Moderation Outcome
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Resolved {new Date(inspectReport.resolvedAt).toLocaleString()}
                    </span>
                  </div>
                  {inspectReport.actionTaken && (
                    <p className="text-foreground"><strong className="text-muted-foreground">Action Taken:</strong> {inspectReport.actionTaken}</p>
                  )}
                  {inspectReport.resolutionNote && (
                    <p className="text-muted-foreground italic"><strong className="text-foreground not-italic">Internal Moderator Note:</strong> {inspectReport.resolutionNote}</p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <DialogFooter className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/60 pt-4">
              {/* Left: User Suspension Control if target is USER */}
              {inspectReport.targetType === "USER" && (
                <div>
                  {inspectReport.targetContext?.isSuspended ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsLiftSuspendDialogOpen(true)}
                      className="gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10"
                    >
                      <Unlock className="size-3.5" />
                      <span>Lift User Suspension</span>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setIsSuspendDialogOpen(true)}
                      className="gap-1.5 text-xs shadow-xs"
                    >
                      <Lock className="size-3.5" />
                      <span>Suspend Candidate Account</span>
                    </Button>
                  )}
                </div>
              )}

              {/* Right: Triage Lifecycle Actions */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {inspectReport.status === "OPEN" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkInReview(inspectReport.id)}
                    disabled={isPending}
                    className="gap-1.5 text-xs text-primary border-primary/40 hover:bg-primary/10"
                  >
                    <Clock className="size-3.5" />
                    <span>Mark In Review</span>
                  </Button>
                )}

                {inspectReport.status !== "DISMISSED" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDismissalReason("")
                      setIsDismissDialogOpen(true)
                    }}
                    disabled={isPending}
                    className="text-xs"
                  >
                    Dismiss Report
                  </Button>
                )}

                {inspectReport.status !== "RESOLVED" && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setResolveActionTaken("")
                      setResolveNote("")
                      setIsResolveDialogOpen(true)
                    }}
                    disabled={isPending}
                    className="gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  >
                    <CheckCircle2 className="size-3.5" />
                    <span>Resolve Report</span>
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Resolve Confirmation Dialog */}
      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <form onSubmit={handleResolveSubmit} className="space-y-4">
            <DialogHeader className="space-y-1.5 text-left">
              <DialogTitle className="text-lg font-bold text-foreground">
                Resolve Moderation Report
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                This will close the report and send a safe notification to the reporting student.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Action Taken (Admin Record)</label>
                <Input
                  placeholder="e.g. User warned, Content removed, Profile updated"
                  value={resolveActionTaken}
                  onChange={(e) => setResolveActionTaken(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Internal Moderator Notes</label>
                <Textarea
                  placeholder="Private internal resolution rationale (only visible to admins)..."
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  rows={3}
                  className="text-xs resize-none"
                />
              </div>
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsResolveDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5"
              >
                {isPending && <Loader2 className="size-3.5 animate-spin" />}
                <span>Confirm Resolution</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dismiss Confirmation Dialog */}
      <Dialog open={isDismissDialogOpen} onOpenChange={setIsDismissDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <form onSubmit={handleDismissSubmit} className="space-y-4">
            <DialogHeader className="space-y-1.5 text-left">
              <DialogTitle className="text-lg font-bold text-foreground">
                Dismiss Incident Report
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Dismiss this report if no community guideline violation occurred.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-foreground">Internal Dismissal Reason</label>
              <Textarea
                placeholder="Reason for dismissal (e.g. No violation found, duplicate report)..."
                value={dismissalReason}
                onChange={(e) => setDismissalReason(e.target.value)}
                rows={3}
                className="text-xs resize-none"
              />
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDismissDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" variant="destructive" disabled={isPending} className="text-xs">
                {isPending && <Loader2 className="size-3.5 animate-spin mr-1" />}
                <span>Confirm Dismissal</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Suspend User Dialog */}
      <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <form onSubmit={handleSuspendUserSubmit} className="space-y-4">
            <DialogHeader className="space-y-1.5 text-left">
              <div className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="size-5" />
                <DialogTitle className="text-lg font-bold">Suspend Candidate Account</DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                This will immediately restrict the student from squad creation, applications, invitations, chat messages, file uploads, and profile mutations. Suspension is reversible.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-foreground">
                Mandatory Suspension Reason <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="Specify the policy violation (e.g. Repeated harassment in workspace chat)..."
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                required
                rows={3}
                className="text-xs resize-none"
              />
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsSuspendDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={!suspensionReason.trim() || isPending}
                className="text-xs font-semibold"
              >
                {isPending && <Loader2 className="size-3.5 animate-spin mr-1" />}
                <span>Confirm Suspension</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lift Suspension Dialog */}
      <Dialog open={isLiftSuspendDialogOpen} onOpenChange={setIsLiftSuspendDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 space-y-4">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Unlock className="size-5" />
              <DialogTitle className="text-lg font-bold">Lift Account Suspension</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              This will restore all standard candidate permissions and core platform features for this student account.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsLiftSuspendDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleLiftSuspensionSubmit}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
            >
              {isPending && <Loader2 className="size-3.5 animate-spin mr-1" />}
              <span>Confirm Lift Suspension</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
