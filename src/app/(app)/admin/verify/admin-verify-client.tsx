"use client"

import * as React from "react"
import { useState, useTransition, useMemo } from "react"
import Link from "next/link"
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Search,
  Users,
  Building,
  GraduationCap,
  Briefcase,
  Loader2,
  Check,
  X,
  ExternalLink,
  User,
  Layers,
  Eye,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { reviewStudentVerification } from "@/app/actions/verification"
import { TechIcon } from "@/components/common/tech-icon"

export interface VerificationRequestItem {
  id: string
  userId: string
  name: string
  username: string
  avatarUrl: string | null
  email: string
  erp: string
  status: string
  rejectionReason: string | null
  createdAt: Date
  updatedAt: Date
  reviewerName: string | null
  college: string
  department: string
  year: number | null
  primaryRole: string
  skills: Array<{ name: string; level: string }>
  completenessPercentage: number
  completenessBreakdown: Array<{ label: string; completed: boolean; weight: number }>
  projectCount: number
}

interface AdminVerifyClientProps {
  initialRequests: VerificationRequestItem[]
  initialCounts: {
    total: number
    pending: number
    approved: number
    rejected: number
  }
}

export function AdminVerifyClient({
  initialRequests,
  initialCounts,
}: AdminVerifyClientProps) {
  const [requests, setRequests] = useState(initialRequests)
  const [counts, setCounts] = useState(initialCounts)
  const [activeTab, setActiveTab] = useState<string>("PENDING")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isPending, startTransition] = useTransition()

  // Detailed Student Review Modal State
  const [reviewingRequest, setReviewingRequest] = useState<VerificationRequestItem | null>(null)

  // Rejection Dialog State
  const [rejectingRequest, setRejectingRequest] = useState<VerificationRequestItem | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (activeTab !== "ALL" && r.status !== activeTab) return false
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = r.name.toLowerCase().includes(q)
        const matchUsername = r.username.toLowerCase().includes(q)
        const matchEmail = r.email.toLowerCase().includes(q)
        const matchCollege = r.college.toLowerCase().includes(q)
        const matchDept = r.department.toLowerCase().includes(q)
        const matchRole = r.primaryRole.toLowerCase().includes(q)
        if (!matchName && !matchUsername && !matchEmail && !matchCollege && !matchDept && !matchRole) {
          return false
        }
      }
      return true
    })
  }, [requests, activeTab, searchQuery])

  const handleApprove = (req: VerificationRequestItem) => {
    startTransition(async () => {
      const res = await reviewStudentVerification({
        requestId: req.id,
        action: "APPROVE",
      })

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Approved student verification for ${req.name}`)
        setRequests((prev) =>
          prev.map((item) =>
            item.id === req.id
              ? { ...item, status: "APPROVED", rejectionReason: null, updatedAt: new Date() }
              : item
          )
        )
        setCounts((prev) => ({
          ...prev,
          pending: Math.max(0, req.status === "PENDING" ? prev.pending - 1 : prev.pending),
          approved: req.status !== "APPROVED" ? prev.approved + 1 : prev.approved,
          rejected: req.status === "REJECTED" ? Math.max(0, prev.rejected - 1) : prev.rejected,
        }))
        if (reviewingRequest?.id === req.id) {
          setReviewingRequest(null)
        }
      }
    })
  }

  const handleOpenRejectModal = (req: VerificationRequestItem) => {
    setRejectingRequest(req)
    setRejectionReason("")
  }

  const handleConfirmReject = () => {
    if (!rejectingRequest) return
    const target = rejectingRequest

    startTransition(async () => {
      const res = await reviewStudentVerification({
        requestId: target.id,
        action: "REJECT",
        rejectionReason: rejectionReason.trim() || "Profile details need clarification.",
      })

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Rejected verification request for ${target.name}`)
        setRequests((prev) =>
          prev.map((item) =>
            item.id === target.id
              ? {
                  ...item,
                  status: "REJECTED",
                  rejectionReason: rejectionReason.trim() || "Profile details need clarification.",
                  updatedAt: new Date(),
                }
              : item
          )
        )
        setCounts((prev) => ({
          ...prev,
          pending: Math.max(0, target.status === "PENDING" ? prev.pending - 1 : prev.pending),
          rejected: target.status !== "REJECTED" ? prev.rejected + 1 : prev.rejected,
          approved: target.status === "APPROVED" ? Math.max(0, prev.approved - 1) : prev.approved,
        }))
        setRejectingRequest(null)
        setRejectionReason("")
        if (reviewingRequest?.id === target.id) {
          setReviewingRequest(null)
        }
      }
    })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/admin" className="hover:text-foreground">Admin Console</Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Student Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Student Verification
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Review student profiles and manage Verified Student trust status.
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

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card
          onClick={() => setActiveTab("ALL")}
          className={`cursor-pointer border transition-all rounded-xl p-4 space-y-1 ${
            activeTab === "ALL" ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border/80 bg-card hover:bg-muted/20"
          }`}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total Requests
          </span>
          <div className="text-2xl font-extrabold text-foreground font-mono">{counts.total}</div>
        </Card>

        <Card
          onClick={() => setActiveTab("PENDING")}
          className={`cursor-pointer border transition-all rounded-xl p-4 space-y-1 ${
            activeTab === "PENDING" ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30" : "border-border/80 bg-card hover:bg-muted/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Pending Review
            </span>
            <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-foreground font-mono">{counts.pending}</div>
        </Card>

        <Card
          onClick={() => setActiveTab("APPROVED")}
          className={`cursor-pointer border transition-all rounded-xl p-4 space-y-1 ${
            activeTab === "APPROVED" ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30" : "border-border/80 bg-card hover:bg-muted/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Approved
            </span>
            <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-foreground font-mono">{counts.approved}</div>
        </Card>

        <Card
          onClick={() => setActiveTab("REJECTED")}
          className={`cursor-pointer border transition-all rounded-xl p-4 space-y-1 ${
            activeTab === "REJECTED" ? "border-destructive bg-destructive/10 ring-1 ring-destructive/30" : "border-border/80 bg-card hover:bg-muted/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-destructive">
              Rejected
            </span>
            <ShieldAlert className="size-3.5 text-destructive" />
          </div>
          <div className="text-2xl font-extrabold text-foreground font-mono">{counts.rejected}</div>
        </Card>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-2xl border border-border/80">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-4 bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="PENDING" className="text-xs font-semibold rounded-lg">
              Pending ({counts.pending})
            </TabsTrigger>
            <TabsTrigger value="APPROVED" className="text-xs font-semibold rounded-lg">
              Approved ({counts.approved})
            </TabsTrigger>
            <TabsTrigger value="REJECTED" className="text-xs font-semibold rounded-lg">
              Rejected ({counts.rejected})
            </TabsTrigger>
            <TabsTrigger value="ALL" className="text-xs font-semibold rounded-lg">
              All ({counts.total})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search student, college, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8.5 h-9 text-xs rounded-xl bg-background border-border/80"
          />
        </div>
      </div>

      {/* Verification Queue List */}
      {filteredRequests.length === 0 ? (
        <Card className="border-border/80 rounded-2xl p-12 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="size-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Users className="size-6" />
            </div>
            <h3 className="font-bold text-base text-foreground">No verification requests found</h3>
            <p className="text-xs text-muted-foreground">
              {searchQuery
                ? `No records match "${searchQuery}". Try adjusting your search or status filter.`
                : activeTab === "PENDING"
                ? "The verification queue is clean! All submitted student profiles have been reviewed."
                : "No verification requests match the selected status."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const isItemPending = req.status === "PENDING"
            const isItemApproved = req.status === "APPROVED"
            const isItemRejected = req.status === "REJECTED"

            return (
              <Card
                key={req.id}
                className="border-border/80 bg-card rounded-2xl shadow-sm hover:border-primary/40 transition-colors overflow-hidden"
              >
                <CardContent className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Student Identity & Academic Details */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <Avatar className="size-11 rounded-xl border border-border shrink-0">
                      <AvatarImage src={req.avatarUrl ?? undefined} alt={req.name} />
                      <AvatarFallback className="rounded-xl font-bold text-xs">
                        {req.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-foreground truncate">{req.name}</span>
                        <span className="text-xs text-muted-foreground font-mono truncate">@{req.username}</span>
                        <Badge
                          variant={
                            isItemApproved
                              ? "success"
                              : isItemPending
                              ? "outline"
                              : "destructive"
                          }
                          className="text-[10px] uppercase font-semibold py-0 px-2"
                        >
                          {req.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building className="size-3 text-primary shrink-0" />
                          <span className="truncate">{req.college}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <GraduationCap className="size-3 text-primary shrink-0" />
                          <span className="truncate">{req.department}</span>
                          {req.year && <span>(Year {req.year})</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="size-3 text-primary shrink-0" />
                          <span className="font-medium text-foreground">{req.primaryRole}</span>
                        </div>
                      </div>

                      {/* Technical Skills Preview */}
                      {req.skills && req.skills.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          {req.skills.slice(0, 4).map((s) => (
                            <span
                              key={s.name}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/40 text-[11px] font-medium border border-border/60"
                            >
                              <TechIcon name={s.name} className="size-3" />
                              <span>{s.name}</span>
                            </span>
                          ))}
                          {req.skills.length > 4 && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              +{req.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Rejection Feedback Callout (if rejected) */}
                      {isItemRejected && req.rejectionReason && (
                        <p className="text-[11px] text-destructive italic pt-1">
                          Rejection rationale: &quot;{req.rejectionReason}&quot;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions & Metrics */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 self-end lg:self-center border-t lg:border-t-0 pt-3 lg:pt-0 w-full lg:w-auto justify-end">
                    {/* Completeness Badge */}
                    <div className="hidden sm:flex flex-col items-end mr-2 text-right">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                        Profile Readiness
                      </span>
                      <span className="text-xs font-mono font-bold text-primary">
                        {req.completenessPercentage}% Complete
                      </span>
                    </div>

                    {/* Review Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReviewingRequest(req)}
                      className="gap-1.5 text-xs font-medium"
                    >
                      <Eye className="size-3.5" />
                      <span>Review Details</span>
                    </Button>

                    {/* Quick Action: Approve */}
                    {isItemPending && (
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleApprove(req)}
                        className="gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      >
                        <Check className="size-3.5" />
                        <span>Approve</span>
                      </Button>
                    )}

                    {/* Quick Action: Reject */}
                    {isItemPending && (
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleOpenRejectModal(req)}
                        className="gap-1.5 text-xs font-semibold shadow-xs"
                      >
                        <X className="size-3.5" />
                        <span>Reject</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Comprehensive Student Review Detail Modal (Phase 6) */}
      <Dialog open={!!reviewingRequest} onOpenChange={(open) => !open && setReviewingRequest(null)}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          {reviewingRequest && (
            <div className="space-y-6">
              <DialogHeader className="pb-3 border-b border-border/60">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-12 rounded-xl border border-border">
                      <AvatarImage src={reviewingRequest.avatarUrl ?? undefined} alt={reviewingRequest.name} />
                      <AvatarFallback className="font-bold">
                        {reviewingRequest.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-lg font-bold flex items-center gap-2">
                        <span>{reviewingRequest.name}</span>
                        <Badge
                          variant={
                            reviewingRequest.status === "APPROVED"
                              ? "success"
                              : reviewingRequest.status === "PENDING"
                              ? "outline"
                              : "destructive"
                          }
                          className="text-[10px] uppercase font-semibold"
                        >
                          {reviewingRequest.status}
                        </Badge>
                      </DialogTitle>
                      <DialogDescription className="text-xs">
                        @{reviewingRequest.username} · Submitted {new Date(reviewingRequest.createdAt).toLocaleDateString()}
                      </DialogDescription>
                    </div>
                  </div>

                  <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-primary">
                    <Link href={`/users/${reviewingRequest.userId}`} target="_blank">
                      <span>Public Profile</span>
                      <ExternalLink className="size-3" />
                    </Link>
                  </Button>
                </div>
              </DialogHeader>

              {/* 4 Structured Review Sections */}
              <div className="space-y-4 text-xs">
                {/* SECTION 1: PROFILE */}
                <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-2">
                  <span className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <User className="size-3.5 text-primary" />
                    <span>Candidate Profile</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-muted-foreground text-[11px] block">Full Name</span>
                      <span className="font-semibold text-foreground">{reviewingRequest.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block">Primary Role</span>
                      <span className="font-semibold text-foreground">{reviewingRequest.primaryRole || "Not specified"}</span>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: INSTITUTION */}
                <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-2">
                  <span className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="size-3.5 text-primary" />
                    <span>Institutional Affiliation</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-muted-foreground text-[11px] block">College / University</span>
                      <span className="font-semibold text-foreground">{reviewingRequest.college}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block">College Email</span>
                      <span className="font-semibold text-foreground font-mono">{reviewingRequest.email || "Not specified"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block">ERP / Student ID</span>
                      <span className="font-semibold text-foreground font-mono">{reviewingRequest.erp || "Not specified"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block">Program &amp; Branch</span>
                      <span className="font-semibold text-foreground">
                        {reviewingRequest.department}
                        {reviewingRequest.year && ` (Year ${reviewingRequest.year})`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: CAPABILITIES */}
                <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-2">
                  <span className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="size-3.5 text-primary" />
                    <span>Technical Stack &amp; Portfolio</span>
                  </span>
                  <div className="space-y-2 pt-1">
                    <span className="text-muted-foreground text-[11px] block">
                      Declared Skills ({reviewingRequest.skills.length})
                    </span>
                    {reviewingRequest.skills.length === 0 ? (
                      <p className="text-muted-foreground italic">No skills listed</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {reviewingRequest.skills.map((s) => (
                          <span
                            key={s.name}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-background border border-border text-[11px] font-medium"
                          >
                            <TechIcon name={s.name} className="size-3" />
                            <span>{s.name}</span>
                            <span className="text-[9px] uppercase font-semibold text-muted-foreground">
                              ({s.level})
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 4: TRUST & HISTORY */}
                <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-2">
                  <span className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-primary" />
                    <span>Trust &amp; Profile Completeness</span>
                  </span>
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Readiness Score</span>
                      <span className="font-bold font-mono text-primary">
                        {reviewingRequest.completenessPercentage}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-muted-foreground">
                      {reviewingRequest.completenessBreakdown.map((item) => (
                        <div key={item.label} className="flex items-center gap-1.5">
                          {item.completed ? (
                            <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          ) : (
                            <AlertCircle className="size-3 text-muted-foreground shrink-0" />
                          )}
                          <span className={item.completed ? "text-foreground font-medium" : ""}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {reviewingRequest.rejectionReason && (
                      <div className="mt-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-[11px]">
                        <span className="font-bold block">Previous Rejection Feedback:</span>
                        <span>{reviewingRequest.rejectionReason}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <DialogFooter className="flex flex-row items-center justify-between gap-2 pt-3 border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewingRequest(null)}
                  className="text-xs"
                >
                  Close
                </Button>

                <div className="flex items-center gap-2">
                  {reviewingRequest.status !== "REJECTED" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleOpenRejectModal(reviewingRequest)}
                      className="gap-1.5 text-xs font-semibold shadow-xs"
                    >
                      <X className="size-3.5" />
                      <span>Reject</span>
                    </Button>
                  )}

                  {reviewingRequest.status !== "APPROVED" && (
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleApprove(reviewingRequest)}
                      className="gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Check className="size-3.5" />
                          <span>Approve Student</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Confirmation Modal */}
      <Dialog open={!!rejectingRequest} onOpenChange={(open) => !open && setRejectingRequest(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
              <ShieldAlert className="size-5" />
              <span>Reject Verification Request</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provide feedback for {rejectingRequest?.name}. The student will receive an in-app notification with this reason and can update their profile before resubmitting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Rejection Rationale / Feedback *
            </label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. ERP ID does not match institutional format; please ensure full academic degree and branch are specified."
              className="min-h-[90px] rounded-xl text-xs resize-none"
              disabled={isPending}
            />
          </div>

          <DialogFooter className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectingRequest(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmReject}
              disabled={isPending || !rejectionReason.trim()}
              className="gap-1.5 font-semibold"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Rejecting...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="size-3.5" />
                  <span>Confirm Rejection</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
