"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import Link from "next/link"
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Edit3,
  Layers,
  Info,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { submitStudentVerificationRequest } from "@/app/actions/verification"
import { TechIcon } from "@/components/common/tech-icon"

interface VerificationCheck {
  id: string
  label: string
  completed: boolean
  value: string | null
}

interface StudentVerifyClientProps {
  user: {
    id: string
    name: string
    username: string
    email: string
    erp: string
    verificationStatus: string
    college: string | null
    department: string | null
    program: string | null
    branch: string | null
    year: number | null
    availability: string
    primaryRole: string | null
    bio: string | null
    isAdmin?: boolean
    skills: Array<{ id: string; name: string; level: string }>
    interests: Array<{ id: string; name: string }>
    completeness: {
      percentage: number
      breakdown: Array<{ label: string; completed: boolean; weight: number }>
    }
    readiness: {
      isReady: boolean
      completedCount: number
      totalCount: number
      percentage: number
      missingFields: string[]
      checks: VerificationCheck[]
    }
  }
  verificationRequest: {
    id: string
    status: string
    rejectionReason: string | null
    createdAt: Date
    updatedAt: Date
    reviewerName: string | null
  } | null
}

export function StudentVerifyClient({
  user,
  verificationRequest: initialReq,
}: StudentVerifyClientProps) {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState(user.verificationStatus)
  const [request, setRequest] = useState(initialReq)

  const isApproved = request?.status === "APPROVED" || status === "APPROVED"
  const isPendingReview = request?.status === "PENDING"
  const isRejected = request?.status === "REJECTED"

  const readiness = user.readiness || {
    isReady: false,
    completedCount: 0,
    totalCount: 11,
    percentage: 0,
    missingFields: [],
    checks: [],
  }

  if (user.isAdmin) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 pb-16 pt-6">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <Link href="/dashboard">
              <ArrowLeft className="size-3.5" />
              <span>Return to Dashboard</span>
            </Link>
          </Button>
        </div>

        <Card className="border-primary/30 bg-gradient-to-b from-primary/5 to-card rounded-2xl shadow-sm text-center p-8 sm:p-12 space-y-6">
          <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
            <ShieldCheck className="size-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <Badge variant="outline" className="text-xs uppercase font-bold text-primary border-primary/40 bg-primary/10 px-2.5 py-0.5">
              Admin Account
            </Badge>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Administrator Account
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Student verification is not required for administrator accounts. You manage student verifications, reviews, and platform operations directly from the Admin Console.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button asChild size="default" className="font-semibold shadow-xs gap-2">
              <Link href="/admin">
                <ShieldCheck className="size-4" />
                <span>Open Admin Console</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="default">
              <Link href="/dashboard">
                <span>Return to Dashboard</span>
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const handleSubmit = () => {
    if (!readiness.isReady) {
      toast.error(
        `Please complete your profile before requesting verification. Missing: ${readiness.missingFields.join(", ")}`
      )
      return
    }

    startTransition(async () => {
      const res = await submitStudentVerificationRequest()
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(res.message || "Verification request submitted successfully!")
        setStatus("PENDING")
        setRequest({
          id: res.requestId || "new-req",
          status: "PENDING",
          rejectionReason: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          reviewerName: null,
        })
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <Link href="/profile">
            <ArrowLeft className="size-3.5" />
            <span>Back to Profile</span>
          </Link>
        </Button>

        <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
          <Link href={`/users/${user.id}`}>
            <span>View Public Profile</span>
            <ExternalLink className="size-3 text-muted-foreground" />
          </Link>
        </Button>
      </div>

      {/* Header Title & Description */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {readiness.isReady
              ? "Student Trust Verification"
              : "Complete your profile to request verification"}
          </h1>
          <Badge variant="outline" className="text-xs uppercase font-semibold border-primary/30 text-primary bg-primary/10">
            Trust Signal
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          To verify your student profile, please complete the required information below. You can still use the full platform while your profile is incomplete.
        </p>
      </div>

      {/* Important Policy Callout */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs">
        <Info className="size-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-foreground">Verification is optional for platform access</p>
          <p className="text-muted-foreground leading-relaxed">
            You already have full access to create teams, discover candidates, send invitations, and join hackathon squads. Verification exists purely to establish peer trust and boost your ranking in teammate discovery. No document or ID card uploads required.
          </p>
        </div>
      </div>

      {/* Current Status Banner (Approved / Pending / Rejected) */}
      {isApproved ? (
        <Card className="border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-card rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="size-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <ShieldCheck className="size-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-foreground">Verified Student Account</h3>
                  <Badge variant="success" className="text-[10px] uppercase font-semibold">
                    Approved
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your student identity is verified. Your profile displays the Verified Student badge across discovery and team listings.
                </p>
              </div>
            </div>

            <Button asChild size="sm" variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
              <Link href="/discover">Find Teammates</Link>
            </Button>
          </CardContent>
        </Card>
      ) : isPendingReview ? (
        <Card className="border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-card rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="size-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Clock className="size-6 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-foreground">Verification Request Under Review</h3>
                  <Badge variant="outline" className="text-[10px] uppercase font-semibold border-amber-500/40 text-amber-600 bg-amber-500/10">
                    Pending
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your profile details have been submitted. An administrator will review your academic summary shortly. You retain full platform access.
                </p>
              </div>
            </div>

            <span className="text-xs text-muted-foreground font-mono shrink-0">
              {request?.createdAt ? new Date(request.createdAt).toLocaleDateString() : "Just now"}
            </span>
          </CardContent>
        </Card>
      ) : isRejected ? (
        <Card className="border-destructive/40 bg-gradient-to-r from-destructive/10 via-destructive/5 to-card rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="size-12 rounded-2xl bg-destructive/20 border border-destructive/40 flex items-center justify-center text-destructive shrink-0">
                <ShieldAlert className="size-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-foreground">Verification Not Approved</h3>
                  <Badge variant="destructive" className="text-[10px] uppercase font-semibold">
                    Rejected
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {request?.rejectionReason
                    ? `Feedback from reviewer: "${request.rejectionReason}"`
                    : "Your profile details were insufficient for verification approval. Please update your academic details and resubmit."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/60">
              <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs">
                <Link href="/profile">
                  <Edit3 className="size-3.5" />
                  <span>Update Profile</span>
                </Link>
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={isPending || !readiness.isReady}
                className="gap-1.5 text-xs font-semibold shadow-xs"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Resubmitting...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-3.5" />
                    <span>Resubmit Verification</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Verification Readiness Checklist Card */}
      <Card className="border-border/80 bg-card shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <span>Verification Readiness Checklist</span>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                All 11 institutional and candidate fields must be completed to request trust verification.
              </CardDescription>
            </div>

            <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs font-semibold shrink-0">
              <Link href="/profile">
                <Edit3 className="size-3.5" />
                <span>Complete Profile</span>
              </Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress Bar & Counter */}
          <div className="space-y-2 p-4 rounded-xl bg-muted/30 border border-border/60">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span>Readiness Progress</span>
                <Badge
                  variant={readiness.isReady ? "success" : "outline"}
                  className="text-[10px] uppercase font-semibold"
                >
                  {readiness.isReady ? "Ready for Verification" : `${readiness.completedCount} of ${readiness.totalCount} Complete`}
                </Badge>
              </span>
              <span className="font-mono font-bold text-primary">
                {readiness.percentage}%
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  readiness.isReady ? "bg-emerald-500" : "bg-primary"
                }`}
                style={{ width: `${readiness.percentage}%` }}
              />
            </div>
          </div>

          {/* Missing Fields Alert Banner (if incomplete) */}
          {!readiness.isReady && readiness.missingFields.length > 0 && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <span>Required fields missing ({readiness.missingFields.length}):</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {readiness.missingFields.map((field) => (
                  <Badge
                    key={field}
                    variant="outline"
                    className="border-destructive/40 text-destructive bg-destructive/10 text-xs font-semibold py-1 px-2.5"
                  >
                    ✗ {field}
                  </Badge>
                ))}
              </div>
              <p className="text-muted-foreground text-[11px] pt-1">
                Click <Link href="/profile" className="text-primary underline font-medium">Complete Profile</Link> to fill in these missing details.
              </p>
            </div>
          )}

          {/* 11 Required Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {readiness.checks.map((check) => (
              <div
                key={check.id}
                className={`p-3.5 rounded-xl border transition-colors flex items-start justify-between gap-2 ${
                  check.completed
                    ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10"
                    : "border-border/70 bg-muted/10"
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {check.completed ? (
                      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="size-4 text-destructive shrink-0" />
                    )}
                    <span className="font-bold text-foreground truncate">{check.label}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate pl-5.5">
                    {check.completed ? (
                      <span className="text-foreground/90 font-medium">{check.value || "Configured"}</span>
                    ) : (
                      <span className="text-destructive/80 font-medium italic">Missing in profile</span>
                    )}
                  </p>
                </div>

                {!check.completed && (
                  <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-[11px] text-primary shrink-0">
                    <Link href="/profile">
                      <span>Add</span>
                      <ArrowRight className="size-3 ml-1" />
                    </Link>
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Technical Skills Listed */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="size-3.5 text-primary" />
                <span>Declared Skills ({user.skills.length})</span>
              </span>
              <Link href="/profile" className="text-primary text-[11px] hover:underline">
                Manage skills in profile
              </Link>
            </div>

            {user.skills.length === 0 ? (
              <p className="text-xs text-destructive italic flex items-center gap-1.5">
                <AlertCircle className="size-3.5" />
                <span>No technical skills added yet (at least 1 required).</span>
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {user.skills.map((s) => (
                  <div
                    key={s.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-muted/20 text-xs font-medium"
                  >
                    <TechIcon name={s.name} className="size-3.5" />
                    <span>{s.name}</span>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                      ({s.level})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>

        {/* Verification Request Action Footer */}
        {!isApproved && !isPendingReview && (
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-border/60 bg-muted/10 rounded-b-2xl">
            <div className="space-y-0.5 text-left w-full sm:w-auto">
              <p className="text-xs font-medium text-foreground">
                {readiness.isReady
                  ? "All required fields complete. Ready for administrator review."
                  : `${readiness.missingFields.length} required field${readiness.missingFields.length === 1 ? "" : "s"} remaining before submission.`}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Verification requests are queued for administrator review and do not block normal platform access.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
              {!readiness.isReady ? (
                <Button asChild variant="outline" className="w-full sm:w-auto gap-2 font-semibold shadow-xs">
                  <Link href="/profile">
                    <Edit3 className="size-4" />
                    <span>Complete Profile First</span>
                  </Link>
                </Button>
              ) : null}

              <Button
                onClick={handleSubmit}
                disabled={isPending || !readiness.isReady}
                className={`w-full sm:w-auto gap-2 font-semibold shadow-xs ${
                  readiness.isReady ? "bg-primary text-primary-foreground" : "opacity-60 cursor-not-allowed"
                }`}
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4" />
                    <span>Request Student Verification</span>
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
