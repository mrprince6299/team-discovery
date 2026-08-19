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
import { AlertCircle, Trash2, Loader2, ShieldAlert } from "lucide-react"
import { deleteTeamRole } from "@/app/actions/roles"
import { toast } from "sonner"

interface DeleteRoleDialogProps {
  roleId: string
  roleName: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteRoleDialog({
  roleId,
  roleName,
  isOpen,
  onOpenChange,
  onSuccess,
}: DeleteRoleDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleDelete = () => {
    setError(null)
    startTransition(async () => {
      try {
        const res = await deleteTeamRole({ roleId })
        if ("error" in res && res.error) {
          setError(res.error)
          return
        }

        toast.success(`Role "${roleName}" has been successfully deleted.`)
        onOpenChange(false)
        if (onSuccess) {
          onSuccess()
        }
        router.refresh()
      } catch (err: any) {
        setError(err.message || "Failed to delete team role.")
      }
    })
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isPending) {
          setError(null)
          onOpenChange(open)
        }
      }}
    >
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader className="space-y-2">
          <div className="size-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-1">
            <Trash2 className="size-5" />
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            Delete Recruitment Role &quot;{roleName}&quot;?
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to permanently delete this recruitment role from your squad?
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

        <div className="space-y-2 py-1 text-xs">
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-destructive/5 border border-destructive/20">
            <ShieldAlert className="size-4 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Permanent Role Removal</p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                This will remove the recruitment position, auto-close all pending applications, and expire any outstanding invitations for this role.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="w-full sm:w-auto text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
            className="w-full sm:w-auto text-xs gap-1.5 font-semibold"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Deleting Role...</span>
              </>
            ) : (
              <>
                <Trash2 className="size-3.5" />
                <span>Confirm &amp; Delete Role</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
