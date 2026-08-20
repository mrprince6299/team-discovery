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

interface VerificationRequestItem {
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
        if (!matchName && !matchUsername && !matchEmail && !matchCollege && !matchDept) {
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
        toast.success(`Approved verification for ${req.name}`)
        setRequests((prev) =>
          prev.map((r) =>
            r.id === req.id
              ? { ...r, status: "APPROVED", rejectionReason: null, updatedAt: new Date() }
              : r
          )
        )
        setCounts((prev) => ({
          ...prev,
          pending: Math.max(0, prev.pending - (req.status === "PENDING" ? 1 : 0)),
          approved: prev.approved + (req.status !== "APPROVED" ? 1 : 0),
          rejected: Math.max(0, prev.rejected - (req.status === "REJECTED" ? 1 : 0)),
        }))
      }
    })
  }

  const handleRejectConfirm = () => {
    if (!rejectingRequest) return

    startTransition(async () => {
      const res = await reviewStudentVerification({
        requestId: rejectingRequest.id,
        action: "REJECT",
        rejectionReason: rejectionReason.trim() || undefined,
      })

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Rejected verification for ${rejectingRequest.name}`)
        setRequests((prev) =>
          prev.map((r) =>
            r.id === rejectingRequest.id
              ? {
                  ...r,
                  status: "REJECTED",
                  rejectionReason: rejectionReason.trim() || "Profile requirements not met.",
                  updatedAt: new Date(),
                }
              : r
          )
        )
        setCounts((prev) => ({
          ...prev,
          pending: Math.max(0, prev.pending - (rejectingRequest.status === "PENDING" ? 1 : 0)),
          approved: Math.max(0, prev.approved - (rejectingRequest.status === "APPROVED" ? 1 : 0)),
          rejected: prev.rejected + (rejectingRequest.status !== "REJECTED" ? 1 : 0),
        }))
        setRejectingRequest(null)
        setRejectionReason("")
      }
    })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Student Verification Administration
          </h1>
          <Badge variant="outline" className="text-xs uppercase font-semibold border-primary/30 text-primary bg-primary/10">
            Admin Console
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Review student academic information and grant Verified Student trust badges to candidate profiles.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border/80 bg-card shadow-2xs rounded-2xl">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground font-semibold">Total Requests</span>
            <div className="text-2xl font-bold text-foreground">{counts.total}</div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-500/5 shadow-2xs rounded-2xl">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
              <Clock className="size-3.5" />
              <span>Pending Review</span>
            </span>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {counts.pending}
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-2xs rounded-2xl">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="size-3.5" />
              <span>Approved</span>
            </span>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {counts.approved}
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/30 bg-destructive/5 shadow-2xs rounded-2xl">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-destructive font-semibold flex items-center gap-1">
              <ShieldAlert className="size-3.5" />
              <span>Rejected</span>
            </span>
            <div className="text-2xl font-bold text-destructive">{counts.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls: Search & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="PENDING" className="text-xs font-semibold rounded-lg gap-1.5">
              <span>Pending ({counts.pending})</span>
            </TabsTrigger>
            <TabsTrigger value="APPROVED" className="text-xs font-semibold rounded-lg gap-1.5">
              <span>Approved ({counts.approved})</span>
            </TabsTrigger>
            <TabsTrigger value="REJECTED" className="text-xs font-semibold rounded-lg gap-1.5">
              <span>Rejected ({counts.rejected})</span>
            </TabsTrigger>
            <TabsTrigger value="ALL" className="text-xs font-semibold rounded-lg gap-1.5">
              <span>All ({counts.total})</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student, college, email..."
            className="pl-8 h-9 text-xs rounded-xl"
          />
        </div>
      </div>

      {/* Request Cards List */}
      {filteredRequests.length === 0 ? (
        <Card className="border-2 border-dashed border-border/70 rounded-2xl bg-muted/20 text-center py-12">
          <CardContent className="space-y-2">
            <Users className="size-8 text-muted-foreground mx-auto opacity-50" />
            <p className="text-sm font-semibold text-foreground">No verification requests found</p>
            <p className="text-xs text-muted-foreground">
              {searchQuery ? "Try clearing your search query." : "No candidates currently in this verification state."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const initials = req.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)

            return (
              <Card
                key={req.id}
                className="border-border/80 bg-card shadow-sm rounded-2xl overflow-hidden hover:border-primary/30 transition-all"
              >
                <div className="p-5 space-y-4">
                  {/* Top Row: Student Identity & Status Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-12 rounded-xl border border-border shadow-2xs">
                        <AvatarImage src={req.avatarUrl || undefined} alt={req.name} />
                        <AvatarFallback className="font-bold text-sm bg-muted">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-foreground leading-tight">
                            {req.name}
                          </h3>
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
                        </div>
                        <p className="text-xs text-muted-foreground">
                          @{req.username} {req.email ? `· ${req.email}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Completeness Meter */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                          Profile Completeness
                        </span>
                        <span className="text-xs font-mono font-bold text-primary">
                          {req.completenessPercentage}%
                        </span>
                      </div>
                      <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${req.completenessPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Academic & Role Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-muted/30 border border-border/60 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                        College / University
                      </span>
                      <div className="flex items-center gap-1.5 font-medium text-foreground truncate">
                        <Building className="size-3.5 text-primary shrink-0" />
                        <span className="truncate">{req.college}</span>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                        Degree &amp; Specialization
                      </span>
                      <div className="flex items-center gap-1.5 font-medium text-foreground truncate">
                        <GraduationCap className="size-3.5 text-primary shrink-0" />
                        <span className="truncate">{req.department}</span>
                        {req.year && <span className="text-muted-foreground">· Yr {req.year}</span>}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                        Primary Role
                      </span>
                      <div className="flex items-center gap-1.5 font-medium text-foreground truncate">
                        <Briefcase className="size-3.5 text-primary shrink-0" />
                        <span className="truncate">{req.primaryRole}</span>
                      </div>
                    </div>
                  </div>

                  {/* Skills Snapshot */}
                  {req.skills.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Declared Skills ({req.skills.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {req.skills.map((s) => (
                          <div
                            key={s.name}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-border bg-card text-[11px] font-medium"
                          >
                            <TechIcon name={s.name} className="size-3" />
                            <span>{s.name}</span>
                            <span className="text-[9px] text-muted-foreground font-semibold uppercase">
                              ({s.level})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rejection Feedback Banner if Rejected */}
                  {req.status === "REJECTED" && req.rejectionReason && (
                    <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-xs text-destructive space-y-0.5">
                      <span className="font-bold text-[11px] uppercase tracking-wider">
                        Rejection Reason:
                      </span>
                      <p>{req.rejectionReason}</p>
                    </div>
                  )}

                  {/* Action Footer */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-border/60">
                    <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
                      <Link href={`/users/${req.userId}`} target="_blank">
                        <ExternalLink className="size-3" />
                        <span>View Public Profile</span>
                      </Link>
                    </Button>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto">
                      {req.status !== "APPROVED" && (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(req)}
                          disabled={isPending}
                          className="flex-1 sm:flex-none h-8 gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        >
                          <Check className="size-3.5" />
                          <span>Approve Verification</span>
                        </Button>
                      )}

                      {req.status !== "REJECTED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRejectingRequest(req)
                            setRejectionReason(req.rejectionReason || "")
                          }}
                          disabled={isPending}
                          className="flex-1 sm:flex-none h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                        >
                          <X className="size-3.5" />
                          <span>Reject...</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Reject Confirmation Dialog */}
      <Dialog open={!!rejectingRequest} onOpenChange={(open) => !open && setRejectingRequest(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <ShieldAlert className="size-5 text-destructive" />
              <span>Reject Verification Request</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provide optional feedback for {rejectingRequest?.name}. The student will receive an in-app notification explaining what information to update.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Rejection Reason / Guidance
              </label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Please specify your college and graduation year before requesting verification..."
                className="min-h-[90px] rounded-xl text-xs"
              />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRejectingRequest(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRejectConfirm}
              disabled={isPending}
              className="gap-1.5 text-xs font-semibold"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Confirm Rejection</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
