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
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Check } from "lucide-react"
import type { PreferredExperience } from "@prisma/client"

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
  const [skillInput, setSkillInput] = useState("")
  const [isPreferred, setIsPreferred] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = skillInput.trim()
    if (!trimmed) return

    if (isPreferred) {
      if (!preferredSkillNames.includes(trimmed)) {
        setPreferredSkillNames([...preferredSkillNames, trimmed])
      }
    } else {
      if (!requiredSkillNames.includes(trimmed)) {
        setRequiredSkillNames([...requiredSkillNames, trimmed])
      }
    }
    setSkillInput("")
  }

  const handleRemoveSkill = (skillName: string, isReq: boolean) => {
    if (isReq) {
      setRequiredSkillNames(requiredSkillNames.filter((s) => s !== skillName))
    } else {
      setPreferredSkillNames(preferredSkillNames.filter((s) => s !== skillName))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Please enter a role title.")
      return
    }

    if (requiredSkillNames.length === 0) {
      toast.error("At least one REQUIRED skill is required.")
      return
    }

    setIsSubmitting(true)

    try {
      const requiredSkillIds = requiredSkillNames.map(
        (name) => availableSkills.find((s) => s.name.toLowerCase() === name.toLowerCase())?.id || name
      )
      const preferredSkillIds = preferredSkillNames.map(
        (name) => availableSkills.find((s) => s.name.toLowerCase() === name.toLowerCase())?.id || name
      )

      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + expiryDays)

      if (isEditing && role) {
        const res = await updateTeamRole({
          roleId: role.id,
          name: name.trim(),
          seatsRequired: Number(seatsRequired),
          preferredExperience,
          expiry: expiryDate,
          requiredSkillIds: requiredSkillIds.filter((id) => id.includes("-")),
          preferredSkillIds: preferredSkillIds.filter((id) => id.includes("-")),
        })

        if (res.error) {
          toast.error(res.error)
          return
        }

        toast.success(`Role "${name}" updated successfully.`)
      } else {
        const res = await createTeamRole({
          teamId,
          name: name.trim(),
          seatsRequired: Number(seatsRequired),
          preferredExperience,
          expiry: expiryDate,
          requiredSkillIds: requiredSkillIds.filter((id) => id.includes("-")),
          preferredSkillIds: preferredSkillIds.filter((id) => id.includes("-")),
        })

        if (res.error) {
          toast.error(res.error)
          return
        }

        toast.success(`Role "${name}" created successfully.`)
      }

      onOpenChange(false)
      if (onSuccess) onSuccess()
      router.refresh()
    } catch {
      toast.error("Failed to save team role.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {/* Role Name */}
      <div className="space-y-1.5">
        <label htmlFor="role-name" className="text-xs font-semibold">
          Role Title <span className="text-destructive">*</span>
        </label>
        <Input
          id="role-name"
          placeholder="e.g. Lead Frontend Architect, ML Researcher"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 text-xs"
          required
        />
      </div>

      {/* Seats & Experience */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="seats-required" className="text-xs font-semibold">
            Seats Required <span className="text-destructive">*</span>
          </label>
          <Input
            id="seats-required"
            type="number"
            min={1}
            max={10}
            value={seatsRequired}
            onChange={(e) => setSeatsRequired(Number(e.target.value))}
            className="h-9 text-xs"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="preferred-exp" className="text-xs font-semibold">
            Experience Level
          </label>
          <select
            id="preferred-exp"
            value={preferredExperience}
            onChange={(e) => setPreferredExperience(e.target.value as PreferredExperience)}
            aria-label="Experience Level"
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="ANY">Any Experience Level</option>
            <option value="BEGINNER">Beginner (1st/2nd Year)</option>
            <option value="INTERMEDIATE">Intermediate (3rd Year)</option>
            <option value="ADVANCED">Advanced (4th Year / Postgrad)</option>
            <option value="EXPERT">Expert (Production Builds)</option>
          </select>
        </div>
      </div>

      {/* Expiry Duration */}
      <div className="space-y-1.5">
        <label htmlFor="expiry-days" className="text-xs font-semibold">
          Application Window (Days from today)
        </label>
        <Input
          id="expiry-days"
          type="number"
          min={1}
          max={90}
          value={expiryDays}
          onChange={(e) => setExpiryDays(Number(e.target.value))}
          className="h-9 text-xs"
        />
      </div>

      {/* Skills Management */}
      <div className="space-y-2 pt-1 border-t border-border/60">
        <label className="text-xs font-semibold">Required &amp; Preferred Skills</label>
        <div className="flex gap-2">
          <Input
            placeholder="Type skill name and press Enter..."
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            className="h-8 text-xs flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddSkill(e)
              }
            }}
          />
          <select
            value={isPreferred ? "PREFERRED" : "REQUIRED"}
            onChange={(e) => setIsPreferred(e.target.value === "PREFERRED")}
            aria-label="Skill Requirement Type"
            className="h-8 rounded-md border border-input bg-background px-2 text-[11px] shadow-2xs"
          >
            <option value="REQUIRED">Required</option>
            <option value="PREFERRED">Preferred</option>
          </select>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleAddSkill}
            className="h-8 px-2.5 text-xs"
          >
            <Plus className="size-3.5 mr-1" />
            Add
          </Button>
        </div>

        {/* Required Skills Chips */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Required Skills ({requiredSkillNames.length})
          </span>
          <div className="flex flex-wrap gap-1.5 min-h-[28px]">
            {requiredSkillNames.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-medium"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill, true)}
                  className="text-muted-foreground hover:text-foreground ml-0.5"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Preferred Skills Chips */}
        {preferredSkillNames.length > 0 && (
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Preferred Skills ({preferredSkillNames.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {preferredSkillNames.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border text-xs font-medium"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill, false)}
                    className="text-muted-foreground hover:text-foreground ml-0.5"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <DialogFooter className="pt-3 border-t border-border/60">
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
      </DialogFooter>
    </form>
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
