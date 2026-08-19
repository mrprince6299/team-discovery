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
import { Input } from "@/components/ui/input"
import { updateTeamRole, createTeamRole } from "@/app/actions/roles"
import { type TeamRoleDetails } from "./role-card"
import { DeleteRoleDialog } from "./delete-role-dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2, Check, Trash2 } from "lucide-react"
import type { PreferredExperience } from "@prisma/client"
import { RoleCombobox } from "@/components/common/role-combobox"
import { SearchableSkillSelector } from "@/components/common/searchable-skill-selector"
import { EXPERIENCE_LEVEL_OPTIONS } from "@/lib/constants/options"

interface RoleManagementDialogProps {
  teamId: string
  role?: TeamRoleDetails | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  availableSkills?: Array<{ id: string; name: string }>
}

function RoleManagementForm({
  teamId,
  role,
  onOpenChange,
  onSuccess,
  availableSkills = [],
}: {
  teamId: string
  role?: TeamRoleDetails | null
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  availableSkills?: Array<{ id: string; name: string }>
}) {
  const isEditing = !!role
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const [name, setName] = useState(role?.name || "")
  const [seatsRequired, setSeatsRequired] = useState(role?.seatsRequired || 1)
  const [preferredExperience, setPreferredExperience] = useState<PreferredExperience>(
    (role?.preferredExperience as PreferredExperience) || "ANY"
  )
  const [expiryDays, setExpiryDays] = useState(14)
  const [requiredSkillNames, setRequiredSkillNames] = useState<string[]>(
    role?.requiredSkills.map((s) => s.name) || ["TypeScript"]
  )
  const [preferredSkillNames, setPreferredSkillNames] = useState<string[]>(
    role?.preferredSkills.map((s) => s.name) || []
  )
  const [isPreferred, setIsPreferred] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isVacant = isEditing && role && role.remainingSeats === role.seatsRequired

  const handleRemoveSkill = (skillName: string, isPref: boolean) => {
    if (isPref) {
      setPreferredSkillNames(preferredSkillNames.filter((s) => s !== skillName))
    } else {
      if (requiredSkillNames.length <= 1) {
        toast.error("At least one REQUIRED skill is strictly mandatory for candidate matching.")
        return
      }
      setRequiredSkillNames(requiredSkillNames.filter((s) => s !== skillName))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Please enter a role name.")
      return
    }

    if (requiredSkillNames.length === 0) {
      toast.error("At least one REQUIRED skill is mandatory.")
      return
    }

    setIsSubmitting(true)
    try {
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + expiryDays)

      // Map skill names to available IDs or pass them directly
      const requiredSkillIds = requiredSkillNames.map((sName) => {
        const found = availableSkills.find(
          (s) => s.name.toLowerCase() === sName.toLowerCase()
        )
        return found ? found.id : sName
      })

      const preferredSkillIds = preferredSkillNames.map((sName) => {
        const found = availableSkills.find(
          (s) => s.name.toLowerCase() === sName.toLowerCase()
        )
        return found ? found.id : sName
      })

      if (isEditing && role) {
        const res = await updateTeamRole({
          roleId: role.id,
          name: name.trim(),
          seatsRequired,
          preferredExperience,
          expiry: expiryDate,
          requiredSkillIds,
          preferredSkillIds,
        })

        if (res.error) {
          toast.error(res.error)
          return
        }

        toast.success("Recruitment role updated successfully.")
      } else {
        const res = await createTeamRole({
          teamId,
          name: name.trim(),
          seatsRequired,
          preferredExperience,
          expiry: expiryDate,
          requiredSkillIds,
          preferredSkillIds,
        })

        if (res.error) {
          toast.error(res.error)
          return
        }

        toast.success("New recruitment role created successfully.")
      }

      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-foreground">
        {/* Role Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold">
            Role Title <span className="text-destructive">*</span>
          </label>
          <RoleCombobox
            value={name}
            onChange={(val, suggestedSkills) => {
              setName(val)
              if (suggestedSkills && suggestedSkills.length > 0) {
                setRequiredSkillNames((prev) => Array.from(new Set([...prev, ...suggestedSkills])))
              }
            }}
            disabled={isSubmitting}
            placeholder="e.g. Lead Frontend Engineer, AI / ML Specialist..."
          />
        </div>

        {/* Capacity & Experience */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Seats Required (Capacity)</label>
            <Input
              type="number"
              min={1}
              max={10}
              value={seatsRequired}
              onChange={(e) => setSeatsRequired(parseInt(e.target.value) || 1)}
              className="text-xs h-9"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Preferred Experience</label>
            <select
              value={preferredExperience}
              onChange={(e) => setPreferredExperience(e.target.value as PreferredExperience)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
              disabled={isSubmitting}
            >
              {EXPERIENCE_LEVEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Recruitment Expiry Days */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold">Application Window (Days from today)</label>
          <Input
            type="number"
            min={1}
            max={60}
            value={expiryDays}
            onChange={(e) => setExpiryDays(parseInt(e.target.value) || 14)}
            className="text-xs h-9"
            required
            disabled={isSubmitting}
          />
          <p className="text-[11px] text-muted-foreground">
            Role will automatically expire and auto-close pending applications when this window ends.
          </p>
        </div>

        {/* Skills Configuration */}
        <div className="space-y-3 pt-1 border-t border-border/60">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold">Candidate Matching Skills *</label>
            <span className="text-[11px] text-muted-foreground">
              {requiredSkillNames.length} Required · {preferredSkillNames.length} Preferred
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setIsPreferred(false)}
              className={`px-3 py-1 rounded-lg border font-semibold transition-colors cursor-pointer ${
                !isPreferred
                  ? "bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300"
                  : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              Required Skills ({requiredSkillNames.length})
            </button>
            <button
              type="button"
              onClick={() => setIsPreferred(true)}
              className={`px-3 py-1 rounded-lg border font-semibold transition-colors cursor-pointer ${
                isPreferred
                  ? "bg-primary/15 border-primary text-primary font-bold"
                  : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              Preferred Skills ({preferredSkillNames.length})
            </button>
          </div>

          {/* Searchable Skill Selector */}
          <SearchableSkillSelector
            availableSkills={availableSkills}
            selectedSkillIds={isPreferred ? preferredSkillNames : requiredSkillNames}
            onSelectSkill={(skill) => {
              if (isPreferred) {
                if (!preferredSkillNames.includes(skill.name) && !requiredSkillNames.includes(skill.name)) {
                  setPreferredSkillNames([...preferredSkillNames, skill.name])
                }
              } else {
                if (!requiredSkillNames.includes(skill.name) && !preferredSkillNames.includes(skill.name)) {
                  setRequiredSkillNames([...requiredSkillNames, skill.name])
                }
              }
            }}
            onRemoveSkill={(id) => {
              const skillName = availableSkills.find((s) => s.id === id)?.name || id
              handleRemoveSkill(skillName, isPreferred)
            }}
            onAddCustomSkill={(customName) => {
              if (isPreferred) {
                if (!preferredSkillNames.includes(customName)) {
                  setPreferredSkillNames([...preferredSkillNames, customName])
                }
              } else {
                if (!requiredSkillNames.includes(customName)) {
                  setRequiredSkillNames([...requiredSkillNames, customName])
                }
              }
            }}
            placeholder={
              isPreferred
                ? "Search preferred skills (nice-to-have)..."
                : "Search required skills (strictly enforced for exact matching)..."
            }
          />

          {/* Required Skills Chips */}
          <div className="space-y-1">
            <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              Required Skills (Exact Match Enforced):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {requiredSkillNames.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                >
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(s, false)}
                    className="hover:text-destructive hover:bg-destructive/10 rounded-xs p-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Preferred Skills Chips */}
          {preferredSkillNames.length > 0 && (
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-primary">
                Preferred Skills (Bonus Weight):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {preferredSkillNames.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                  >
                    <span>{s}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s, true)}
                      className="hover:text-destructive hover:bg-destructive/10 rounded-xs p-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t border-border/60 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
          {isVacant && role ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isSubmitting}
              className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 self-start"
            >
              <Trash2 className="size-3.5" />
              <span>Delete Role</span>
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 self-end">
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
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs gap-1.5 font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="size-3.5" />
                  <span>{isEditing ? "Update Role" : "Create Role"}</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </form>

      {isVacant && role && (
        <DeleteRoleDialog
          roleId={role.id}
          roleName={role.name}
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onSuccess={() => {
            onOpenChange(false)
            if (onSuccess) {
              onSuccess()
            }
          }}
        />
      )}
    </>
  )
}

export function RoleManagementDialog({
  teamId,
  role,
  isOpen,
  onOpenChange,
  onSuccess,
  availableSkills = [],
}: RoleManagementDialogProps) {
  const isEditing = !!role

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            {isEditing ? `Edit Recruitment Role` : `Create Recruitment Role`}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure seat capacity, requirements, and discovery parameters for this position.
          </DialogDescription>
        </DialogHeader>

        {isOpen && (
          <RoleManagementForm
            key={role?.id || "new"}
            teamId={teamId}
            role={role}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
            availableSkills={availableSkills}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
