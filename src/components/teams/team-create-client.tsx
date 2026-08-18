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
  CheckCircle2,
  HelpCircle,
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
import { Badge } from "@/components/ui/badge"
import { createTeamWithRoles } from "@/app/actions/teams"
import { toast } from "sonner"
import type { SkillLevel, PreferredExperience } from "@prisma/client"

interface RoleDraft {
  id: string
  name: string
  seatsRequired: number
  preferredLevel?: SkillLevel
  preferredExperience?: PreferredExperience
  expiryDays: number
  requiredSkillIds: string[]
  preferredSkillIds: string[]
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

  // Roles Drafts
  const [roles, setRoles] = useState<RoleDraft[]>([
    {
      id: "role-1",
      name: "Frontend Developer",
      seatsRequired: 1,
      preferredLevel: "INTERMEDIATE",
      preferredExperience: "SOME_EXPERIENCE",
      expiryDays: 7,
      requiredSkillIds: [],
      preferredSkillIds: [],
    },
  ])

  const handleAddRole = () => {
    setRoles((prev) => [
      ...prev,
      {
        id: `role-${Date.now()}`,
        name: "Backend Developer",
        seatsRequired: 1,
        preferredLevel: "INTERMEDIATE",
        preferredExperience: "ANY",
        expiryDays: 7,
        requiredSkillIds: [],
        preferredSkillIds: [],
      },
    ])
  }

  const handleRemoveRole = (roleId: string) => {
    if (roles.length <= 1) {
      toast.error("A team must have at least one recruitment role.")
      return
    }
    setRoles((prev) => prev.filter((r) => r.id !== roleId))
  }

  const handleUpdateRole = (roleId: string, updates: Partial<RoleDraft>) => {
    setRoles((prev) => prev.map((r) => (r.id === roleId ? { ...r, ...updates } : r)))
  }

  const handleToggleRequiredSkill = (roleId: string, skillId: string) => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== roleId) return r
        const isSelected = r.requiredSkillIds.includes(skillId)
        const updated = isSelected
          ? r.requiredSkillIds.filter((id) => id !== skillId)
          : [...r.requiredSkillIds, skillId]
        return { ...r, requiredSkillIds: updated }
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
          seatsRequired: Number(r.seatsRequired),
          preferredLevel: r.preferredLevel,
          preferredExperience: r.preferredExperience,
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
        toast.error(res.error)
      } else if (res.teamId) {
        toast.success("Team created successfully with recruitment roles!")
        router.push(`/teams/${res.teamId}`)
      }
    })
  }

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Back Link */}
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
          <Link href="/teams">
            <ArrowLeft className="size-3.5" />
            <span>Back to Teams</span>
          </Link>
        </Button>
      </div>

      <div className="space-y-1 border-b border-border/60 pb-4">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5" />
          <span>Team Builder Studio</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Create a New Team
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Establish your squad, associate with an upcoming hackathon, and publish recruitment roles with verified skill requirements.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: TEAM DETAILS */}
        <Card className="border-border/80 bg-card rounded-2xl shadow-xs">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <span>Team Profile & Event</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Basic team information visible to candidates browsing the catalog.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 pt-2 space-y-4">
            {/* Team Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Team Name *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Neural Builders, FinTech Pioneers..."
                className="h-10 text-sm font-medium"
                required
                disabled={isPending}
              />
            </div>

            {/* Event Association */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Calendar className="size-3.5 text-primary" />
                <span>Associated Event / Hackathon (Optional)</span>
              </label>
              <Select
                value={selectedEventId}
                onValueChange={setSelectedEventId}
                disabled={isPending}
              >
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="Select Event..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Independent / General Project</SelectItem>
                  {events.map((evt) => (
                    <SelectItem key={evt.id} value={evt.id}>
                      {evt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Team Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Team Mission & Project Idea *</span>
                <span className="text-[10px] text-muted-foreground font-normal">{description.length}/500</span>
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                placeholder="Briefly describe what your team aims to build, target problem, and work style..."
                className="min-h-[100px] text-xs resize-none"
                required
                disabled={isPending}
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: ROLE BUILDER */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Layers className="size-4 text-emerald-500" />
                <span>Initial Recruitment Roles</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Define the specific skills and seats required. Each role must specify at least one required skill.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRole}
              disabled={isPending}
              className="gap-1.5 text-xs font-semibold shadow-xs"
            >
              <PlusCircle className="size-3.5" />
              <span>Add Another Role</span>
            </Button>
          </div>

          <div className="space-y-4">
            {roles.map((role, index) => (
              <Card key={role.id} className="border-border/80 bg-card rounded-2xl shadow-xs overflow-hidden">
                <div className="p-4 bg-muted/20 border-b border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="exact" className="text-[10px] font-bold">
                      Role #{index + 1}
                    </Badge>
                    <span className="font-bold text-sm text-foreground">{role.name || "Untitled Role"}</span>
                  </div>

                  {roles.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRole(role.id)}
                      disabled={isPending}
                      className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 gap-1"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Remove</span>
                    </Button>
                  )}
                </div>

                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Role Title */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Role Title *
                      </label>
                      <Input
                        value={role.name}
                        onChange={(e) => handleUpdateRole(role.id, { name: e.target.value })}
                        placeholder="e.g. Lead Frontend Engineer, AI Researcher..."
                        className="h-9 text-xs"
                        required
                        disabled={isPending}
                      />
                    </div>

                    {/* Seats Required */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Seats Required *
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={role.seatsRequired}
                        onChange={(e) =>
                          handleUpdateRole(role.id, { seatsRequired: Math.max(1, parseInt(e.target.value) || 1) })
                        }
                        className="h-9 text-xs font-semibold"
                        required
                        disabled={isPending}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/50">
                    {/* Preferred Level */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Preferred Skill Level
                      </label>
                      <Select
                        value={role.preferredLevel || "INTERMEDIATE"}
                        onValueChange={(val: SkillLevel) => handleUpdateRole(role.id, { preferredLevel: val })}
                        disabled={isPending}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BEGINNER">Beginner</SelectItem>
                          <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                          <SelectItem value="ADVANCED">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Preferred Experience */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Preferred Experience
                      </label>
                      <Select
                        value={role.preferredExperience || "ANY"}
                        onValueChange={(val: PreferredExperience) =>
                          handleUpdateRole(role.id, { preferredExperience: val })
                        }
                        disabled={isPending}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ANY">Any Experience Level</SelectItem>
                          <SelectItem value="BEGINNER">Beginner (0 Projects)</SelectItem>
                          <SelectItem value="SOME_EXPERIENCE">Some Experience (1+ Projects)</SelectItem>
                          <SelectItem value="EXPERIENCED">Experienced (2+ Projects)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Required Skill Tag Selector */}
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <span>Select Required Skills *</span>
                        <span className="text-[10px] font-normal">
                          ({role.requiredSkillIds.length} selected)
                        </span>
                      </label>
                      {role.requiredSkillIds.length === 0 && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                          At least 1 skill required
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl border border-border/80 bg-muted/20">
                      {availableSkills.map((skill) => {
                        const isSelected = role.requiredSkillIds.includes(skill.id)
                        return (
                          <button
                            key={skill.id}
                            type="button"
                            onClick={() => handleToggleRequiredSkill(role.id, skill.id)}
                            disabled={isPending}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold"
                                : "border-border bg-card text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />}
                            <span>{skill.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-semibold"
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/60">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <HelpCircle className="size-3.5 text-muted-foreground shrink-0" />
            <span>You will automatically become the active Team Leader upon creation.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button asChild variant="outline" size="default" disabled={isPending} className="w-full sm:w-auto">
              <Link href="/teams">Cancel</Link>
            </Button>
            <Button type="submit" size="default" disabled={isPending} className="gap-2 font-bold shadow-xs w-full sm:w-auto">
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Publishing Team...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="size-4" />
                  <span>Create Team & Open Recruitment</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
