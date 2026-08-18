"use client"

import * as React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, Lock, Loader2 } from "lucide-react"
import { closeTeamRole } from "@/app/actions/roles"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface CloseRoleDialogProps {
  roleId: string
  roleName: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CloseRoleDialog({
  roleId,
  roleName,
  isOpen,
  onOpenChange,
  onSuccess,
}: CloseRoleDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleCloseRole = async () => {
    setIsSubmitting(true)
    try {
      const res = await closeTeamRole({ roleId })
      if (res.error) {
        toast.error(res.error)
        return
      }

      toast.success(`Role "${roleName}" has been successfully closed.`)
      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred while closing the role.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader className="space-y-2">
          <div className="size-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-1">
            <Lock className="size-5" />
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            Close Recruitment for &quot;{roleName}&quot;?
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Closing this recruitment role will immediately:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2 text-xs">
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/30 border border-border/80">
            <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Auto-close Pending Applications</p>
              <p className="text-muted-foreground">
                All candidates with pending applications will be notified that the role is closed.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/30 border border-border/80">
            <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Expire Pending Invitations</p>
              <p className="text-muted-foreground">
                Sent invitations awaiting candidate responses for this role will be marked expired.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleCloseRole}
            disabled={isSubmitting}
            className="text-xs gap-1.5 font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Closing Role...</span>
              </>
            ) : (
              <>
                <Lock className="size-3.5" />
                <span>Confirm &amp; Close Role</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
