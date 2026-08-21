"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import Link from "next/link"
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  ArrowLeft,
  Flag,
  FileText,
  Calendar,
  Layers,
  MessageSquare,
  User,
  Info,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ReportStatus, ReportTargetType, ReportReason } from "@prisma/client"

export interface SubmittedReportItem {
  id: string
  targetType: ReportTargetType
  targetId: string
  targetSnapshot: string
  reason: ReportReason
  description: string | null
  status: ReportStatus
  resolvedAt: Date | null
  createdAt: Date
}

interface ReportsClientProps {
  initialReports: SubmittedReportItem[]
}

export function ReportsClient({ initialReports }: ReportsClientProps) {
  const [reports] = useState<SubmittedReportItem[]>(initialReports)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [selectedReport, setSelectedReport] = useState<SubmittedReportItem | null>(null)

  const counts = useMemo(() => {
    return {
      total: reports.length,
      open: reports.filter((r) => r.status === "OPEN").length,
      inReview: reports.filter((r) => r.status === "IN_REVIEW").length,
      resolved: reports.filter((r) => r.status === "RESOLVED").length,
      dismissed: reports.filter((r) => r.status === "DISMISSED").length,
    }
  }, [reports])

  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      if (statusFilter !== "ALL" && rep.status !== statusFilter) return false
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim()
        const matchTarget = rep.targetSnapshot.toLowerCase().includes(q)
        const matchReason = rep.reason.toLowerCase().includes(q)
        const matchDesc = rep.description?.toLowerCase().includes(q)
        return matchTarget || matchReason || matchDesc
      }
      return true
    })
  }, [reports, statusFilter, searchQuery])

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

  const getTargetIcon = (type: ReportTargetType) => {
    switch (type) {
      case "USER":
        return <User className="size-3.5" />
      case "TEAM":
        return <Layers className="size-3.5" />
      case "MESSAGE":
        return <MessageSquare className="size-3.5" />
      default:
        return <FileText className="size-3.5" />
    }
  }

  const formatReason = (reason: ReportReason) => {
    return reason.replace(/_/g, " ")
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-foreground -ml-2">
              <Link href="/dashboard">
                <ArrowLeft className="size-3.5" />
                <span>Back to Dashboard</span>
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            My Submitted Reports
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Track the triage and resolution status of reports you have submitted to maintain platform safety.
          </p>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
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
            <span className="font-semibold uppercase tracking-wider text-[11px]">Open</span>
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

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search submitted reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["ALL", "OPEN", "IN_REVIEW", "RESOLVED", "DISMISSED"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="text-xs h-8 px-3 rounded-lg"
            >
              {status.replace(/_/g, " ")}
            </Button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <Card className="rounded-2xl border-border/80 p-12 text-center space-y-3">
          <div className="size-12 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto text-muted-foreground">
            <Flag className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground">
              {reports.length === 0 ? "You haven't submitted any reports." : "No reports match your filters."}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {reports.length === 0
                ? "When you flag inappropriate profiles, teams, or messages, they will appear here with live status updates."
                : "Try resetting your search query or status filter to see all reports."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <Card
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className="border-border/80 hover:border-primary/40 transition-all rounded-2xl p-5 cursor-pointer shadow-2xs hover:shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-[10px] uppercase font-semibold gap-1 py-0 px-2">
                      {getTargetIcon(report.targetType)}
                      <span>{report.targetType}</span>
                    </Badge>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-destructive border-destructive/30">
                      {formatReason(report.reason)}
                    </Badge>
                    {getStatusBadge(report.status)}
                  </div>

                  <p className="text-sm font-bold text-foreground truncate">
                    {report.targetSnapshot}
                  </p>

                  {report.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 italic">
                      &ldquo;{report.description}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold">
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Report Details Modal */}
      {selectedReport && (
        <Dialog open={selectedReport !== null} onOpenChange={(open) => !open && setSelectedReport(null)}>
          <DialogContent className="sm:max-w-md rounded-2xl p-6">
            <DialogHeader className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-[10px] uppercase font-semibold gap-1">
                  {getTargetIcon(selectedReport.targetType)}
                  <span>{selectedReport.targetType} Report</span>
                </Badge>
                {getStatusBadge(selectedReport.status)}
              </div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Report Details
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Submitted on {new Date(selectedReport.createdAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs py-2">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Target Entity
                </span>
                <p className="font-bold text-foreground">{selectedReport.targetSnapshot}</p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-foreground">Violation Reason</span>
                <p className="text-muted-foreground font-medium">{formatReason(selectedReport.reason)}</p>
              </div>

              {selectedReport.description && (
                <div className="space-y-1">
                  <span className="font-bold text-foreground">Your Submitted Notes</span>
                  <p className="p-3 rounded-xl bg-muted/30 border border-border/60 text-muted-foreground whitespace-pre-wrap">
                    {selectedReport.description}
                  </p>
                </div>
              )}

              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2.5">
                <Info className="size-4 text-primary shrink-0 mt-0.5" />
                <p className="text-muted-foreground leading-relaxed">
                  {selectedReport.status === "OPEN" && "Your report is in the queue and awaiting review by a moderator."}
                  {selectedReport.status === "IN_REVIEW" && "A moderator is currently reviewing the reported content."}
                  {selectedReport.status === "RESOLVED" && "This report has been reviewed and resolved by platform moderation."}
                  {selectedReport.status === "DISMISSED" && "This report has been reviewed and closed by platform moderation."}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
