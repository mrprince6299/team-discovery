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
import { AlertCircle, Loader2, LogOut, ShieldAlert } from "lucide-react"
import { leaveTeam } from "@/app/actions/teams"

interface LeaveTeamDialogProps {
  teamId: string
  teamName: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  redirectTo?: string
}

export function LeaveTeamDialog({
  teamId,
  teamName,
  isOpen,
  onOpenChange,
  onSuccess,
  redirectTo = "/dashboard",
}: LeaveTeamDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleLeave = () => {
    setError(null)
    startTransition(async () => {
      try {
        const res = await leaveTeam({ teamId })
        if ('error' in res && res.error) {
          setError(res.error)
          return
        }

        onOpenChange(false)
        if (onSuccess) {
          onSuccess()
        } else if (redirectTo) {
          router.push(redirectTo)
          router.refresh()
        } else {
          router.refresh()
        }
      } catch (err: any) {
        setError(err.message || "Failed to leave team.")
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isPending) {
        setError(null)
        onOpenChange(open)
      }
    }}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader className="space-y-2">
          <div className="size-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-1">
            <LogOut className="size-5" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Leave {teamName}?
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to leave this squad? You will surrender your role seat and lose access to the private workspace. If this team is registered for a competition, your roster spot will be released.
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

        <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-1 text-xs text-muted-foreground">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <ShieldAlert className="size-3.5 text-amber-500" />
            <span>Voluntary Withdrawal</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            You can re-apply to open roles on this team in the future if seats are available.
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
            onClick={handleLeave}
            disabled={isPending}
            className="w-full sm:w-auto h-9 text-xs font-semibold gap-1.5 shadow-xs"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Leaving Squad...</span>
              </>
            ) : (
              <>
                <LogOut className="size-3.5" />
                <span>Confirm &amp; Leave Squad</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
