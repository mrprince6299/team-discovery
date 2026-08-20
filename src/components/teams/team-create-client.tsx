"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Users,
  PlusCircle,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Briefcase,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createTeamWithRoles } from "@/app/actions/teams"
import { toast } from "sonner"
import type { SkillLevel, PreferredExperience } from "@prisma/client"
import { RoleCombobox } from "@/components/common/role-combobox"
import { SearchableSkillSelector } from "@/components/common/searchable-skill-selector"
import { EXPERIENCE_LEVEL_OPTIONS } from "@/lib/constants/options"

interface RoleDraft {
  id: string
  name: string
  seatsRequired: number
  preferredLevel?: SkillLevel
  preferredExperience?: PreferredExperience
  expiryDays: number
  requiredSkillIds: string[]
  preferredSkillIds: string[]
  recommendedSkills?: string[]
}

interface TeamCreateClientProps {
  events: Array<{ id: string; name: string; description: string }>
  availableSkills: Array<{ id: string; name: string }>
}

export function TeamCreateClient({ events, availableSkills }: TeamCreateClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Team Details
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedEventId, setSelectedEventId] = useState<string>("NONE")

  // Roles Drafts — Starts empty; leader explicitly chooses roles to add
  const [roles, setRoles] = useState<RoleDraft[]>([])

  const handleAddRole = () => {
    setRoles((prev) => [
      ...prev,
      {
        id: `role-${Date.now()}`,
        name: "",
        seatsRequired: 1,
        preferredLevel: "INTERMEDIATE",
        preferredExperience: "ANY",
        expiryDays: 7,
        requiredSkillIds: [],
        preferredSkillIds: [],
        recommendedSkills: [],
      },
    ])
  }

  const handleRemoveRole = (roleId: string) => {
    setRoles((prev) => prev.filter((r) => r.id !== roleId))
  }

  const handleUpdateRole = (roleId: string, updates: Partial<RoleDraft>) => {
    setRoles((prev) => prev.map((r) => (r.id === roleId ? { ...r, ...updates } : r)))
  }

  const handleAddSuggestedSkill = (roleId: string, skillName: string, isRequired: boolean = true) => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== roleId) return r
        if (isRequired) {
          if (r.requiredSkillIds.includes(skillName)) return r
          return { ...r, requiredSkillIds: [...r.requiredSkillIds, skillName] }
        } else {
          if (r.preferredSkillIds.includes(skillName)) return r
          return { ...r, preferredSkillIds: [...r.preferredSkillIds, skillName] }
        }
      })
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!name.trim()) {
      setErrorMessage("Please enter a team name.")
      return
    }

    if (!description.trim()) {
      setErrorMessage("Please provide a team description or mission statement.")
      return
    }

    if (roles.length === 0) {
      setErrorMessage("Please add at least one recruitment role for your team.")
      return
    }

    for (const r of roles) {
      if (!r.name.trim()) {
        setErrorMessage("All recruitment roles must have a role title.")
        return
      }
      if (r.requiredSkillIds.length === 0) {
        setErrorMessage(`Role "${r.name}" must have at least ONE required skill selected.`)
        return
      }
      if (r.seatsRequired < 1) {
        setErrorMessage(`Role "${r.name}" seats required must be at least 1.`)
        return
      }
    }

    startTransition(async () => {
      const formattedRoles = roles.map((r) => {
        const expiry = new Date()
        expiry.setDate(expiry.getDate() + r.expiryDays)
        return {
          name: r.name.trim(),
          seatsRequired: r.seatsRequired,
          preferredLevel: r.preferredLevel || "INTERMEDIATE",
          preferredExperience: r.preferredExperience || "ANY",
          expiry,
          requiredSkillIds: r.requiredSkillIds,
          preferredSkillIds: r.preferredSkillIds,
        }
      })

      const res = await createTeamWithRoles({
        name: name.trim(),
        description: description.trim(),
        eventId: selectedEventId === "NONE" ? undefined : selectedEventId,
        roles: formattedRoles,
      })

      if (res.error) {
        setErrorMessage(res.error)
      } else if (res.teamId) {
        toast.success("Team created successfully with recruitment roles!")
        router.push(`/teams/${res.teamId}`)
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <Link href="/teams">
            <ArrowLeft className="size-3.5" />
            <span>Back to Teams</span>
          </Link>
        </Button>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Create New Squad
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Form a hackathon team, define the specific roles you need, and recruit peers with deterministic skill-matching.
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive"
        >
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Team Details */}
        <Card className="border-border/80 bg-card shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="size-5 text-primary" />
              <span>Squad Identity &amp; Target Event</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Give your squad a memorable name and describe the problem you aim to solve.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="team-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Team Name *
              </label>
              <Input
                id="team-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Neural Pioneers, Quantum Builders, DevDynasty"
                required
                disabled={isPending}
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="team-desc" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Team Mission &amp; Description *
              </label>
              <Textarea
                id="team-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your hackathon idea, project goals, and what kind of collaborators you are looking for..."
                rows={3}
                required
                disabled={isPending}
                className="rounded-xl"
              />
            </div>

            {/* Event Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-primary" />
                <span>Associated Event (Optional)</span>
              </label>
              <Select
                value={selectedEventId}
                onValueChange={setSelectedEventId}
                disabled={isPending}
              >
                <SelectTrigger className="w-full h-10 rounded-xl">
                  <SelectValue placeholder="Select an active hackathon event..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">General / Independent Project (No Event)</SelectItem>
                  {events.map((ev) => (
                    <SelectItem key={ev.id} value={ev.id}>
                      {ev.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Open Recruitment Roles */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <Briefcase className="size-5 text-primary" />
                <span>Recruitment Roles ({roles.length})</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Add the specific roles and required skills your squad needs to fill.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleAddRole}
              disabled={isPending}
              variant="outline"
              size="sm"
              className="gap-1.5 font-semibold shadow-2xs rounded-xl self-start sm:self-auto border-primary/30 hover:bg-primary/10 text-primary"
            >
              <PlusCircle className="size-4" />
              <span>Add Role</span>
            </Button>
          </div>

          {roles.length === 0 ? (
            <Card className="border-2 border-dashed border-border/70 rounded-2xl bg-muted/20 text-center py-10">
              <CardContent className="space-y-3">
                <Briefcase className="size-10 text-muted-foreground mx-auto opacity-50" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">No roles added yet</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Click &quot;Add Role&quot; above to select standard disciplines like Frontend, Backend, AI/ML, or Design.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleAddRole}
                  className="gap-1.5 font-semibold shadow-xs"
                >
                  <Plus className="size-4" />
                  <span>Add First Role</span>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {roles.map((role, idx) => (
                <Card key={role.id} className="border-border/80 bg-card shadow-sm rounded-2xl relative overflow-hidden">
                  <div className="p-4 bg-muted/30 border-b border-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-lg bg-primary/15 text-primary font-bold text-xs">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-sm text-foreground">
                        {role.name ? role.name : "New Recruitment Role"}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRole(role.id)}
                      disabled={isPending}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-2 text-xs"
                    >
                      <Trash2 className="size-3.5 mr-1" />
                      <span>Remove</span>
                    </Button>
                  </div>

                  <CardContent className="p-5 space-y-4">
                    {/* Role Title with Authoritative Suggestions */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Role Title *
                      </label>
                      <RoleCombobox
                        value={role.name}
                        onChange={(roleName, suggestedSkills) => {
                          handleUpdateRole(role.id, {
                            name: roleName,
                            recommendedSkills: suggestedSkills || [],
                          })
                        }}
                        disabled={isPending}
                        placeholder="Select a standard role or enter custom title..."
                      />
                    </div>

                    {/* Recommended Skills (Suggestive Chips) */}
                    {role.recommendedSkills && role.recommendedSkills.length > 0 && (
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1.5">
                        <div className="text-[11px] font-semibold text-primary flex items-center gap-1.5">
                          <Sparkles className="size-3.5" />
                          <span>Recommended skills for {role.name} (click to add):</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {role.recommendedSkills.map((skillName) => {
                            const isAdded =
                              role.requiredSkillIds.includes(skillName) ||
                              role.preferredSkillIds.includes(skillName)
                            return (
                              <button
                                key={skillName}
                                type="button"
                                disabled={isAdded}
                                onClick={() => handleAddSuggestedSkill(role.id, skillName, true)}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Seats Needed
                        </label>
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          value={role.seatsRequired}
                          onChange={(e) =>
                            handleUpdateRole(role.id, {
                              seatsRequired: parseInt(e.target.value, 10) || 1,
                            })
                          }
                          disabled={isPending}
                          className="h-10 rounded-xl"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Experience Level Preference
                        </label>
                        <Select
                          value={role.preferredExperience || "ANY"}
                          onValueChange={(val) =>
                            handleUpdateRole(role.id, {
                              preferredExperience: val as PreferredExperience,
                            })
                          }
                          disabled={isPending}
                        >
                          <SelectTrigger className="w-full h-10 rounded-xl">
                            <SelectValue placeholder="Select experience..." />
                          </SelectTrigger>
                          <SelectContent>
                            {EXPERIENCE_LEVEL_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Required Skills (Multi-Select) */}
                    <div className="space-y-1.5 pt-2 border-t border-border/60">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                          <Layers className="size-3.5 text-primary" />
                          <span>Required Skills * (Exact Match Filter)</span>
                        </label>
                        <span className="text-[11px] text-muted-foreground">
                          {role.requiredSkillIds.length} selected
                        </span>
                      </div>
                      <SearchableSkillSelector
                        isMultiSelect
                        selectedSkills={role.requiredSkillIds}
                        onSelectedSkillsChange={(skills) =>
                          handleUpdateRole(role.id, { requiredSkillIds: skills })
                        }
                        availableSkills={availableSkills}
                        placeholder="Add required technical skills for this role..."
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
                          {role.preferredSkillIds.length} selected
                        </span>
                      </div>
                      <SearchableSkillSelector
                        isMultiSelect
                        selectedSkills={role.preferredSkillIds}
                        onSelectedSkillsChange={(skills) =>
                          handleUpdateRole(role.id, { preferredSkillIds: skills })
                        }
                        excludeSkills={role.requiredSkillIds}
                        availableSkills={availableSkills}
                        placeholder="Add preferred bonus skills (e.g. GraphQL, Tailwind)..."
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
          <Button asChild variant="outline" className="h-10 px-5 rounded-xl">
            <Link href="/teams">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={isPending || roles.length === 0}
            className="h-10 px-6 gap-2 font-semibold shadow-xs rounded-xl"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Creating Squad...</span>
              </>
            ) : (
              <>
                <Users className="size-4" />
                <span>Create Squad &amp; Open Roles</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
