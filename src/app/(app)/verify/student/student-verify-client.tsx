"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import Link from "next/link"
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Edit3,
  Building,
  GraduationCap,
  Briefcase,
  Layers,
  User,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { submitStudentVerificationRequest } from "@/app/actions/verification"
import { TechIcon } from "@/components/common/tech-icon"

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
    year: number | null
    primaryRole: string | null
    bio: string | null
    skills: Array<{ id: string; name: string; level: string }>
    completeness: {
      percentage: number
      breakdown: Array<{ label: string; completed: boolean; weight: number }>
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

  const isApproved = status === "APPROVED"
  const isPendingReview = status === "PENDING"
  const isRejected = status === "REJECTED"

  const handleSubmit = () => {
    startTransition(async () => {
      const res = await submitStudentVerificationRequest()
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(res.message || "Verification request submitted successfully!")
        setStatus("PENDING")
        setRequest((prev) => ({
          id: prev?.id || "new-req",
          status: "PENDING",
          rejectionReason: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          reviewerName: null,
        }))
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

      {/* Header Title */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Student Trust Verification
          </h1>
          <Badge variant="outline" className="text-xs uppercase font-semibold border-primary/30 text-primary bg-primary/10">
            Trust Signal
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Verify your student identity to receive a Verified Student badge and priority trust visibility in teammate discovery.
        </p>
      </div>

      {/* Important Policy Callout */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs">
        <Info className="size-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-foreground">Verification is optional for platform access</p>
          <p className="text-muted-foreground leading-relaxed">
            You already have full access to create teams, discover candidates, send invitations, and join hackathon squads. Verification exists purely to establish peer trust and boost your visibility. No documents or ID card uploads required.
          </p>
        </div>
      </div>

      {/* Current Status Card */}
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

            <div className="flex items-center gap-3 pt-2 border-t border-border/60">
              <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs">
                <Link href="/profile">
                  <Edit3 className="size-3.5" />
                  <span>Update Profile</span>
                </Link>
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={isPending}
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

      {/* Profile Snapshot Card */}
      <Card className="border-border/80 bg-card shadow-sm rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <User className="size-4 text-primary" />
              <span>Institutional &amp; Profile Summary</span>
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-primary">
              <Link href="/profile">
                <Edit3 className="size-3.5" />
                <span>Edit Profile</span>
              </Link>
            </Button>
          </div>
          <CardDescription className="text-xs">
            Review the details that administrators evaluate when validating student trust status.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Profile Completeness Meter */}
          <div className="space-y-2 p-4 rounded-xl bg-muted/30 border border-border/60">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                <span>Profile Completeness</span>
              </span>
              <span className="font-mono font-bold text-primary">
                {user.completeness.percentage}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${user.completeness.percentage}%` }}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] text-muted-foreground">
              {user.completeness.breakdown.map((item) => (
                <span key={item.label} className="inline-flex items-center gap-1">
                  {item.completed ? (
                    <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="size-3 text-muted-foreground shrink-0" />
                  )}
                  <span className={item.completed ? "text-foreground font-medium" : ""}>
                    {item.label}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1">
              <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider block">
                Full Name
              </span>
              <span className="font-bold text-foreground text-sm">{user.name}</span>
              <span className="text-muted-foreground block text-[11px]">@{user.username}</span>
            </div>

            <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1">
              <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider block">
                College / Institution
              </span>
              <div className="flex items-center gap-1.5">
                <Building className="size-3.5 text-primary shrink-0" />
                <span className="font-semibold text-foreground">
                  {user.college || "Not specified in profile"}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1">
              <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider block">
                Degree &amp; Specialization
              </span>
              <div className="flex items-center gap-1.5">
                <GraduationCap className="size-3.5 text-primary shrink-0" />
                <span className="font-semibold text-foreground">
                  {user.department || "Not specified"}
                </span>
                {user.year && (
                  <span className="text-muted-foreground">· Year {user.year}</span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1">
              <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider block">
                Primary Role
              </span>
              <div className="flex items-center gap-1.5">
                <Briefcase className="size-3.5 text-primary shrink-0" />
                <span className="font-semibold text-foreground">
                  {user.primaryRole || "Not specified"}
                </span>
              </div>
            </div>
          </div>

          {/* Technical Skills Listed */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="size-3.5 text-primary" />
                <span>Declared Skills ({user.skills.length})</span>
              </span>
              <Link href="/profile" className="text-primary text-[11px] hover:underline">
                Add skills in profile
              </Link>
            </div>

            {user.skills.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No technical skills added yet.</p>
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

        {!isApproved && !isPendingReview && (
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 p-6 border-t border-border/60 bg-muted/10 rounded-b-2xl">
            <p className="text-xs text-muted-foreground">
              By submitting, your profile details will be queued for administrator trust verification.
            </p>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              className="w-full sm:w-auto gap-2 font-semibold shadow-xs"
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
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
