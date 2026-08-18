"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import { Send, Loader2, AlertCircle, ShieldCheck } from "lucide-react"
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
import { createApplication } from "@/app/actions/applications"
import { toast } from "sonner"
import type { TeamRoleDetails } from "./role-card"

interface ApplyModalProps {
  isOpen: boolean
  onClose: () => void
  team: {
    id: string
    name: string
    eventName?: string | null
  } | null
  role: TeamRoleDetails | null
  onApplicationSubmitted?: () => void
}

export function ApplyModal({
  isOpen,
  onClose,
  team,
  role,
  onApplicationSubmitted,
}: ApplyModalProps) {
  const [message, setMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!team || !role) return null

  const handleApply = () => {
    setErrorMessage(null)

    startTransition(async () => {
      const res = await createApplication({
        teamId: team.id,
        roleId: role.id,
        message: message.trim() || undefined,
      })

      if (res.error) {
        setErrorMessage(res.error)
        toast.error(res.error)
      } else {
        toast.success(`Application submitted for ${role.name}!`)
        if (onApplicationSubmitted) onApplicationSubmitted()
        setMessage("")
        onClose()
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Send className="size-5 text-primary" />
            <span>Apply to Team Role</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Submit your application to the team leadership. You will be notified once they review your verified profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Target Team & Role Context */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-2.5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Team
                </span>
                <span className="font-extrabold text-sm text-foreground">{team.name}</span>
                {team.eventName && (
                  <span className="text-[11px] text-muted-foreground block">
                    Event: {team.eventName}
                  </span>
                )}
              </div>

              <div className="text-right">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Target Role
                </span>
                <Badge variant="exact" className="text-xs font-bold">
                  {role.name}
                </Badge>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Required Skills
              </span>
              <div className="flex flex-wrap gap-1">
                {role.requiredSkills.map((s) => (
                  <Badge key={s.id} variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
                    {s.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Statement / Pitch Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Why are you a good fit? (Optional Pitch)</span>
              <span className="text-[10px] font-normal text-muted-foreground">{message.length}/400</span>
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={400}
              placeholder="Tell the team leader about your relevant experience, project links, or what you'd like to build together..."
              className="min-h-[90px] text-xs resize-none"
              disabled={isPending}
            />
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive font-medium"
            >
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-card p-2 rounded-lg border border-border/50">
            <ShieldCheck className="size-3.5 text-primary shrink-0" />
            <span>The team leader will review your public verified skills and portfolio.</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={isPending}
            className="gap-2 font-semibold shadow-xs"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Submitting Application...</span>
              </>
            ) : (
              <>
                <Send className="size-3.5" />
                <span>Submit Application</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
