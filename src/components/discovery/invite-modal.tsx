"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import { createInvitation } from "@/app/actions/invitations"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertCircle, CheckCircle2, Loader2, Mail, Send } from "lucide-react"
import { toast } from "sonner"

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
  candidate: {
    id: string
    name: string
    username: string
    profilePhoto?: string | null
    matchCategory?: string
  } | null
  role: {
    id: string
    name: string
    teamId: string
    teamName: string
    remainingSeats: number
    requiredSkills: Array<{ id: string; name: string }>
  } | null
  onInviteSent?: (candidateId: string) => void
}

export function InviteModal({
  isOpen,
  onClose,
  candidate,
  role,
  onInviteSent,
}: InviteModalProps) {
  const [message, setMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!candidate || !role) return null

  const initials = candidate.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const handleSendInvitation = () => {
    setErrorMessage(null)

    startTransition(async () => {
      const res = await createInvitation({
        teamId: role.teamId,
        roleId: role.id,
        recipientId: candidate.id,
        message: message.trim() || undefined,
        expiryDays: 3,
      })

      if (res.error) {
        setErrorMessage(res.error)
        toast.error(res.error)
      } else {
        toast.success(`Invitation sent to ${candidate.name}!`)
        if (onInviteSent) onInviteSent(candidate.id)
        setMessage("")
        onClose()
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Mail className="size-5 text-primary" />
            <span>Invite Candidate to Team Role</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Send an official team role invitation. The candidate will receive a notification to accept or decline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Target Candidate Preview */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-muted/20">
            <div className="flex items-center gap-3">
              <Avatar className="size-10 rounded-xl border border-border">
                <AvatarImage src={candidate.profilePhoto || undefined} alt={candidate.name} />
                <AvatarFallback className="font-bold text-xs bg-muted">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-bold text-sm text-foreground">{candidate.name}</div>
                <div className="text-xs text-muted-foreground">@{candidate.username}</div>
              </div>
            </div>
            {candidate.matchCategory && (
              <Badge
                variant={
                  candidate.matchCategory === "EXACT"
                    ? "exact"
                    : candidate.matchCategory === "RELATED"
                    ? "related"
                    : "interest"
                }
                className="text-[10px]"
              >
                {candidate.matchCategory.replace(/_/g, " ")}
              </Badge>
            )}
          </div>

          {/* Target Role & Team Details */}
          <div className="rounded-xl border border-border/80 bg-card p-3 space-y-2 text-xs">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Team</span>
                <span className="font-bold text-foreground text-sm">{role.teamName}</span>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Target Role</span>
                <span className="font-bold text-primary text-sm">{role.name}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold mb-1">
                Required Skills
              </span>
              <div className="flex flex-wrap gap-1">
                {role.requiredSkills.map((skill) => (
                  <Badge key={skill.id} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {skill.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Invitation Message */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Personalized Invitation Note (Optional)</span>
              <span className="text-[10px] font-normal text-muted-foreground">{message.length}/300</span>
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={300}
              placeholder="Hi Alex, we were impressed by your React and PostgreSQL projects and would love for you to join our hackathon team..."
              className="min-h-[80px] text-xs resize-none"
              disabled={isPending}
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive font-medium"
            >
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Invitation expires automatically in 3 days if not accepted.</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSendInvitation}
            disabled={isPending}
            className="gap-2 font-semibold shadow-xs"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Sending Invitation...</span>
              </>
            ) : (
              <>
                <Send className="size-3.5" />
                <span>Send Invitation</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
