"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Crown, AlertCircle, Loader2, ShieldAlert, Check } from "lucide-react"
import { transferLeadership } from "@/app/actions/teams"

export interface EligibleMember {
  userId: string
  name: string
  username: string
  membershipRole?: string
  profilePhoto?: string | null
}

interface TransferLeadershipDialogProps {
  teamId: string
  teamName: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  eligibleMembers: EligibleMember[]
  initialSelectedMemberId?: string
  onSuccess?: () => void
}

export function TransferLeadershipDialog({
  teamId,
  teamName,
  isOpen,
  onOpenChange,
  eligibleMembers,
  initialSelectedMemberId,
  onSuccess,
}: TransferLeadershipDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [customSelectedId, setCustomSelectedId] = useState<string | null>(null)

  const selectedMemberId =
    customSelectedId ??
    (initialSelectedMemberId &&
    eligibleMembers.some((m) => m.userId === initialSelectedMemberId)
      ? initialSelectedMemberId
      : eligibleMembers[0]?.userId ?? "")

  const handleTransfer = () => {
    if (!selectedMemberId) {
      setError("Please select an eligible member to transfer leadership to.")
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        const res = await transferLeadership({
          teamId,
          newLeaderId: selectedMemberId,
        })

        if ("error" in res && res.error) {
          setError(res.error)
          return
        }

        onOpenChange(false)
        setCustomSelectedId(null)
        if (onSuccess) {
          onSuccess()
        }
        router.refresh()
      } catch (err: any) {
        setError(err.message || "Failed to transfer leadership.")
      }
    })
  }

  const selectedMember = eligibleMembers.find((m) => m.userId === selectedMemberId)

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isPending) {
          setError(null)
          if (!open) {
            setCustomSelectedId(null)
          }
          onOpenChange(open)
        }
      }}
    >
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader className="space-y-2">
          <div className="size-10 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1 border border-amber-500/20">
            <Crown className="size-5" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Transfer Leadership of {teamName}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Select an active squad member to become the new Team Leader. You will forfeit ownership and become a standard squad member.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-medium"
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {eligibleMembers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-center space-y-2">
            <p className="text-xs font-semibold text-foreground">
              No Eligible Members Found
            </p>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              There are no other active members in this squad. You must invite candidates or accept applications before transferring leadership.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Choose New Team Leader</span>
              <span className="text-[11px] font-normal text-muted-foreground">
                {eligibleMembers.length} eligible {eligibleMembers.length === 1 ? "member" : "members"}
              </span>
            </label>

            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {eligibleMembers.map((member) => {
                const isSelected = member.userId === selectedMemberId
                const initials = member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)

                return (
                  <button
                    key={member.userId}
                    type="button"
                    onClick={() => setCustomSelectedId(member.userId)}
                    disabled={isPending}
                    className={`w-full text-left flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isSelected
                        ? "border-amber-500/60 bg-amber-500/10 shadow-2xs"
                        : "border-border bg-card/60 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="size-9 border border-border shrink-0">
                        <AvatarImage src={member.profilePhoto || undefined} alt={member.name} />
                        <AvatarFallback className="text-xs font-bold bg-muted">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-xs font-bold text-foreground truncate">
                          {member.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          @{member.username}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected ? (
                        <div className="size-5 rounded-full bg-amber-500 text-white flex items-center justify-center">
                          <Check className="size-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="size-5 rounded-full border border-border" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-1.5 text-xs text-muted-foreground">
          <div className="font-semibold text-foreground flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="size-3.5" />
            <span>Important Ownership Notice</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            {selectedMember ? (
              <>
                <strong>{selectedMember.name}</strong> will gain full administrative control over this squad, including adding/closing roles, accepting/rejecting candidates, and squad settings. This action is effective immediately and cannot be undone without the new leader transferring ownership back.
              </>
            ) : (
              <>
                Leadership transfer is permanent and immediately grants administrative authority to the selected member.
              </>
            )}
          </p>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="w-full sm:w-auto h-9 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleTransfer}
            disabled={isPending || eligibleMembers.length === 0 || !selectedMemberId}
            className="w-full sm:w-auto h-9 text-xs font-semibold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white border-none shadow-xs"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Transferring Leadership...</span>
              </>
            ) : (
              <>
                <Crown className="size-3.5" />
                <span>Confirm &amp; Transfer Leadership</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
