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
import { Loader2, Trash2, Sparkles, Layers } from "lucide-react"
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
    role?.requiredSkills.map((s) => s.name) || []
  )
  const [preferredSkillNames, setPreferredSkillNames] = useState<string[]>(
    role?.preferredSkills.map((s) => s.name) || []
  )
  const [recommendedSkills, setRecommendedSkills] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isVacant = isEditing && role && role.remainingSeats === role.seatsRequired

  const handleAddSuggestedSkill = (skillName: string, isReq: boolean = true) => {
    if (isReq) {
      if (!requiredSkillNames.includes(skillName)) {
        setRequiredSkillNames([...requiredSkillNames, skillName])
      }
    } else {
      if (!preferredSkillNames.includes(skillName)) {
        setPreferredSkillNames([...preferredSkillNames, skillName])
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Please enter a role name.")
      return
    }

    if (requiredSkillNames.length === 0) {
      toast.error("At least one REQUIRED skill is mandatory for candidate matching.")
      return
    }

    setIsSubmitting(true)
    try {
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + expiryDays)

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
            onChange={(val, suggested) => {
              setName(val)
              setRecommendedSkills(suggested || [])
            }}
            disabled={isSubmitting}
            placeholder="e.g. Lead Frontend Engineer, AI / ML Specialist..."
          />
        </div>

        {/* Recommended Skills (Suggestive, Not Forced) */}
        {recommendedSkills.length > 0 && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1.5">
            <div className="text-[11px] font-semibold text-primary flex items-center gap-1.5">
              <Sparkles className="size-3.5" />
              <span>Recommended skills for {name} (click to add):</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {recommendedSkills.map((skillName) => {
                const isAdded =
                  requiredSkillNames.includes(skillName) ||
                  preferredSkillNames.includes(skillName)
                return (
                  <button
                    key={skillName}
                    type="button"
                    disabled={isAdded}
                    onClick={() => handleAddSuggestedSkill(skillName, true)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      isAdded
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 opacity-60 cursor-default"
                        : "border-primary/30 bg-background hover:bg-primary/10 text-foreground hover:border-primary shadow-2xs"
                    }`}
                  >
                    {isAdded ? `✓ ${skillName}` : `+ ${skillName}`}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Seats & Experience */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Seats Needed</label>
            <Input
              type="number"
              min={1}
              max={10}
              value={seatsRequired}
              onChange={(e) => setSeatsRequired(parseInt(e.target.value, 10) || 1)}
              disabled={isSubmitting}
              className="h-10 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Preferred Experience</label>
            <select
              value={preferredExperience}
              onChange={(e) => setPreferredExperience(e.target.value as PreferredExperience)}
              disabled={isSubmitting}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              {EXPERIENCE_LEVEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Expiry */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold">Listing Duration</label>
          <select
            value={expiryDays}
            onChange={(e) => setExpiryDays(parseInt(e.target.value, 10))}
            disabled={isSubmitting}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
        </div>

        {/* Required Skills (Multi-Select) */}
        <div className="space-y-1.5 pt-2 border-t border-border/60">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Layers className="size-3.5 text-primary" />
              <span>Required Skills (Exact Match) <span className="text-destructive">*</span></span>
            </label>
            <span className="text-[11px] text-muted-foreground">
              {requiredSkillNames.length} selected
            </span>
          </div>
          <SearchableSkillSelector
            isMultiSelect
            selectedSkills={requiredSkillNames}
            onSelectedSkillsChange={setRequiredSkillNames}
            availableSkills={availableSkills}
            placeholder="Search and select required skills..."
          />
        </div>

        {/* Preferred Skills */}
        <div className="space-y-1.5 pt-2 border-t border-border/60">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-amber-500" />
              <span>Preferred / Bonus Skills (Optional)</span>
            </label>
            <span className="text-[11px] text-muted-foreground">
              {preferredSkillNames.length} selected
            </span>
          </div>
          <SearchableSkillSelector
            isMultiSelect
            selectedSkills={preferredSkillNames}
            onSelectedSkillsChange={setPreferredSkillNames}
            excludeSkills={requiredSkillNames}
            availableSkills={availableSkills}
            placeholder="Search and select preferred bonus skills..."
          />
        </div>

        {/* Footer Actions */}
        <DialogFooter className="flex items-center justify-between pt-4 border-t border-border/60">
          {isEditing && isVacant ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isSubmitting}
              className="gap-1.5"
            >
              <Trash2 className="size-3.5" />
              <span>Delete Vacant Role</span>
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || requiredSkillNames.length === 0}
              className="gap-1.5 font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? "Save Role" : "Create Role"}</span>
              )}
            </Button>
          </div>
        </DialogFooter>
      </form>

      {/* Delete Confirmation Dialog */}
      {isEditing && role && (
        <DeleteRoleDialog
          roleId={role.id}
          roleName={role.name}
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onSuccess={() => {
            onOpenChange(false)
            if (onSuccess) onSuccess()
            router.refresh()
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
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {role ? "Edit Recruitment Role" : "Add Recruitment Role"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {role
              ? "Update role requirements and skill criteria for matching candidates."
              : "Define the position and required skill set to recruit suitable teammates."}
          </DialogDescription>
        </DialogHeader>

        <RoleManagementForm
          teamId={teamId}
          role={role}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
          availableSkills={availableSkills}
        />
      </DialogContent>
    </Dialog>
  )
}
