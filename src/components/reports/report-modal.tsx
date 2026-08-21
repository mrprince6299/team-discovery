"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import Link from "next/link"
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Flag,
  ArrowRight,
  Info,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { submitReport } from "@/app/actions/reports"
import { ReportReason, ReportTargetType } from "@prisma/client"
import { toast } from "sonner"

export interface ReportModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  targetType: ReportTargetType
  targetId: string
  targetName: string
  targetContext?: string
}

const REPORT_REASONS: Array<{ value: ReportReason; label: string; description: string }> = [
  {
    value: "HARASSMENT",
    label: "Harassment or Bullying",
    description: "Abusive messages, intimidation, hate speech, or targeted hostility.",
  },
  {
    value: "SPAM",
    label: "Spam or Advertising",
    description: "Unsolicited promotional content, bot spam, or repeated automated messages.",
  },
  {
    value: "INAPPROPRIATE_CONTENT",
    label: "Inappropriate Content",
    description: "Explicit, offensive, or disruptive material violating community guidelines.",
  },
  {
    value: "FAKE_PROFILE",
    label: "Fake Profile / Impersonation",
    description: "Falsified student credentials, impersonating another person or entity.",
  },
  {
    value: "MISLEADING_INFO",
    label: "Misleading Information",
    description: "Fabricated skills, fraudulent project claims, or deceptive team info.",
  },
  {
    value: "SUSPICIOUS_ACTIVITY",
    label: "Suspicious Activity or Scam",
    description: "Phishing links, malicious files, or unauthorized external solicitation.",
  },
  {
    value: "OTHER",
    label: "Other Violation",
    description: "Other behavior violating student safety or platform integrity standards.",
  },
]

export function ReportModal({
  isOpen,
  onOpenChange,
  targetType,
  targetId,
  targetName,
  targetContext,
}: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | "">("")
  const [description, setDescription] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setReason("")
      setDescription("")
      setErrorMessage(null)
      setIsSuccess(false)
    }
    onOpenChange(open)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason) {
      setErrorMessage("Please select a valid reason for this report.")
      return
    }

    setErrorMessage(null)
    startTransition(async () => {
      const res = await submitReport({
        targetType,
        targetId,
        reason: reason as ReportReason,
        description: description.trim() || undefined,
      })

      if (res.error) {
        setErrorMessage(res.error)
        toast.error(res.error)
      } else {
        setIsSuccess(true)
        toast.success("Report submitted to moderation queue.")
      }
    })
  }

  const getTargetTypeLabel = (type: ReportTargetType) => {
    switch (type) {
      case "USER":
        return "Student Candidate"
      case "TEAM":
        return "Team Squad"
      case "MESSAGE":
        return "Workspace Message"
      case "FILE":
        return "Shared File"
      case "LINK":
        return "Shared Link"
      default:
        return type
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-6 overflow-hidden">
        {isSuccess ? (
          <div className="py-6 space-y-6 text-center">
            <div className="size-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="size-7" />
            </div>

            <div className="space-y-2">
              <DialogTitle className="text-xl font-extrabold text-foreground">
                Report Submitted
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                Thank you for helping us keep Team Discovery safe. Our trust &amp; safety moderators will review this report.
              </DialogDescription>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border/70 text-xs text-left space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Info className="size-4 text-primary shrink-0" />
                <span>What happens next?</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                You can track the live triage status of all your submitted reports from your private Reports dashboard.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <Button
                asChild
                className="w-full sm:w-auto gap-1.5 font-semibold"
                onClick={() => handleOpenChange(false)}
              >
                <Link href="/reports">
                  <span>View My Reports</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => handleOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <DialogHeader className="space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center">
                  <Flag className="size-4" />
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                  Trust &amp; Safety
                </Badge>
              </div>
              <DialogTitle className="text-xl font-extrabold text-foreground">
                Report {getTargetTypeLabel(targetType)}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Help us keep Team Discovery safe, collaborative, and inclusive.
              </DialogDescription>
            </DialogHeader>

            {/* Target Card Preview */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 space-y-1 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Target Entity
                </span>
                <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                  {targetType}
                </Badge>
              </div>
              <p className="font-bold text-foreground truncate">{targetName}</p>
              {targetContext && (
                <p className="text-muted-foreground text-[11px] italic line-clamp-2 pt-0.5 border-t border-border/40">
                  &ldquo;{targetContext}&rdquo;
                </p>
              )}
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-2.5 text-xs text-destructive">
                <AlertTriangle className="size-4 shrink-0" />
                <p className="leading-snug">{errorMessage}</p>
              </div>
            )}

            {/* Reason Selector */}
            <div className="space-y-1.5">
              <label htmlFor="report-reason" className="text-xs font-bold text-foreground">
                Reason for report <span className="text-destructive">*</span>
              </label>
              <Select
                value={reason}
                onValueChange={(val) => setReason(val as ReportReason)}
              >
                <SelectTrigger id="report-reason" className="w-full text-xs h-10">
                  <SelectValue placeholder="Select primary violation reason..." />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {REPORT_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value} className="text-xs py-2">
                      <div className="flex flex-col text-left">
                        <span className="font-semibold text-foreground">{r.label}</span>
                        <span className="text-[11px] text-muted-foreground">{r.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="report-description" className="text-xs font-bold text-foreground">
                  Additional Details <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {description.length}/2000
                </span>
              </div>
              <Textarea
                id="report-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide relevant context, timestamps, or details to help moderators review..."
                maxLength={2000}
                rows={3}
                className="text-xs resize-none"
              />
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={!reason || isPending}
                className="gap-1.5 font-semibold shadow-xs"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="size-3.5" />
                    <span>Submit Report</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
