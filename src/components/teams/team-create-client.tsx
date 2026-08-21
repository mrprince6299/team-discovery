"use client"

import * as React from "react"
import { useState, useTransition, useMemo } from "react"
import Link from "next/link"
import {
  Users,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Briefcase,
  Plus,
  CheckCircle2,
  Copy,
  Clock,
  Compass,
  ArrowRight,
  ShieldAlert,
  Check,
  Trophy,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createTeamWithRoles } from "@/app/actions/teams"
import { toast } from "sonner"
import type { SkillLevel, PreferredExperience } from "@prisma/client"
import { RoleCombobox } from "@/components/common/role-combobox"
import { SearchableSkillSelector } from "@/components/common/searchable-skill-selector"
import { EXPERIENCE_LEVEL_OPTIONS } from "@/lib/constants/options"

export interface EventOption {
  id: string
  name: string
  description: string
  bannerUrl?: string | null
  startDate?: Date
  endDate?: Date
  teamSizeInfo?: string | null
  registrationDeadline?: Date
  status?: string
}

export interface RoleDraft {
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
  events: EventOption[]
  availableSkills: Array<{ id: string; name: string }>
  initialEventId?: string
}

export function TeamCreateClient({ events, availableSkills, initialEventId }: TeamCreateClientProps) {
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Success State for Post-Creation Handoff
  const [createdTeamInfo, setCreatedTeamInfo] = useState<{
    teamId: string
    teamName: string
    firstRoleId?: string
    rolesCount: number
    seatsCount: number
  } | null>(null)

  // Team Details
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    if (initialEventId && events.some((e) => e.id === initialEventId)) {
      return initialEventId
    }
    return "NONE"
  })

  // Selected Event Object
  const currentEvent = useMemo(() => {
    if (selectedEventId === "NONE") return null
    return events.find((e) => e.id === selectedEventId) || null
  }, [events, selectedEventId])

  // Roles Drafts — Starts empty (zero dummy roles)
  const [roles, setRoles] = useState<RoleDraft[]>([])

  const handleAddRole = () => {
    setRoles((prev) => [
      ...prev,
      {
        id: `role-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
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

  const handleDuplicateRole = (roleId: string) => {
    const target = roles.find((r) => r.id === roleId)
    if (!target) return
    setRoles((prev) => [
      ...prev,
      {
        ...target,
        id: `role-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: target.name ? `${target.name} (Copy)` : "",
      },
    ])
    toast.success("Role duplicated")
  }

  const handleRemoveRole = (roleId: string) => {
    setRoles((prev) => prev.filter((r) => r.id !== roleId))
  }

  const handleUpdateRole = (roleId: string, updates: Partial<RoleDraft>) => {
    setRoles((prev) => prev.map((r) => (r.id === roleId ? { ...r, ...updates } : r)))
  }

  const handleAddSuggestedSkill = (roleId: string, skillName: string, isRequired: boolean) => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== roleId) return r
        if (isRequired) {
          if (r.requiredSkillIds.includes(skillName)) return r
          return {
            ...r,
            requiredSkillIds: [...r.requiredSkillIds, skillName],
            preferredSkillIds: r.preferredSkillIds.filter((s) => s !== skillName),
          }
        } else {
          if (r.preferredSkillIds.includes(skillName)) return r
          return {
            ...r,
            preferredSkillIds: [...r.preferredSkillIds, skillName],
            requiredSkillIds: r.requiredSkillIds.filter((s) => s !== skillName),
          }
        }
      })
    )
  }

  // Summary Metrics
  const totalOpenSeats = useMemo(() => {
    return roles.reduce((acc, r) => acc + (r.seatsRequired || 1), 0)
  }, [roles])

  // Real-Time Readiness Checklist Checks
  const readinessChecks = useMemo(() => {
    const isNameValid = Boolean(name.trim().length >= 3)
    const isDescValid = Boolean(description.trim().length >= 10)
    const hasAtLeastOneRole = roles.length >= 1
    const allRolesNamed = roles.length > 0 && roles.every((r) => r.name.trim().length > 0)
    const allRolesHaveRequiredSkill = roles.length > 0 && roles.every((r) => r.requiredSkillIds.length >= 1)
    const allRolesValidSeats = roles.length > 0 && roles.every((r) => r.seatsRequired >= 1)

    return [
      {
        id: "name",
        label: "Squad Name (min 3 chars)",
        completed: isNameValid,
      },
      {
        id: "desc",
        label: "Project Description (min 10 chars)",
        completed: isDescValid,
      },
      {
        id: "roles_count",
        label: "At least 1 recruitment role defined",
        completed: hasAtLeastOneRole,
      },
      {
        id: "roles_named",
        label: "All roles have a designated title",
        completed: allRolesNamed,
      },
      {
        id: "roles_skills",
        label: "Each role has $\ge 1$ required skill configured",
        completed: allRolesHaveRequiredSkill,
      },
      {
        id: "roles_seats",
        label: "Each role has $\ge 1$ seat required",
        completed: allRolesValidSeats,
      },
    ]
  }, [name, description, roles])

  const isFormReady = readinessChecks.every((c) => c.completed)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!name.trim() || name.trim().length < 3) {
      setErrorMessage("Please enter a valid squad name (at least 3 characters).")
      return
    }

    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage("Please provide a meaningful team description or problem statement (at least 10 characters).")
      return
    }

    if (roles.length === 0) {
      setErrorMessage("Please define at least one initial recruitment role for your squad.")
      return
    }

    for (const r of roles) {
      if (!r.name.trim()) {
        setErrorMessage("All recruitment roles must have a role title.")
        return
      }
      if (r.requiredSkillIds.length === 0) {
        setErrorMessage(`Role "${r.name}" must have at least ONE required technical skill configured.`)
        return
      }
      if (r.seatsRequired < 1) {
        setErrorMessage(`Role "${r.name}" must have at least 1 seat needed.`)
        return
      }
    }

    startTransition(async () => {
      const formattedRoles = roles.map((r) => {
        const expiry = new Date()
        expiry.setDate(expiry.getDate() + (r.expiryDays || 7))
        return {
          name: r.name.trim(),
          seatsRequired: r.seatsRequired || 1,
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
        toast.error(res.error)
      } else if (res.teamId) {
        toast.success("Squad created successfully!")
        setCreatedTeamInfo({
          teamId: res.teamId,
          teamName: name.trim(),
          firstRoleId: (res as any).firstRoleId,
          rolesCount: roles.length,
          seatsCount: totalOpenSeats,
        })
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Back Link */}
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <Link href="/teams">
            <ArrowLeft className="size-3.5" />
            <span>Back to Teams</span>
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-xs font-semibold text-primary">
          <Briefcase className="size-3.5" />
          <span>Squad Formation Wizard</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Create New Squad &amp; Open Roles
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Form a competition team, define the specific roles and skills your squad requires, and recruit compatible peers with deterministic matching.
        </p>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive"
        >
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Event Context Card (Phase 2) */}
      {currentEvent && (
        <Card className="border-primary/30 bg-card rounded-2xl overflow-hidden shadow-xs">
          {currentEvent.bannerUrl ? (
            <div className="relative w-full h-32 bg-muted overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentEvent.bannerUrl}
                alt={currentEvent.name}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
            </div>
          ) : (
            <div className="h-16 bg-gradient-to-r from-primary/20 via-indigo-500/15 to-emerald-500/20" />
          )}

          <CardContent className="p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-primary block">
                  Target Competition
                </span>
                <h3 className="text-lg font-bold text-foreground">{currentEvent.name}</h3>
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] uppercase font-bold self-start sm:self-auto">
                Registration Open
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-border/60 text-xs">
              {currentEvent.startDate && currentEvent.endDate && (
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Timeline</span>
                  <span className="font-semibold text-foreground inline-flex items-center gap-1 mt-0.5">
                    <Calendar className="size-3 text-primary shrink-0" />
                    <span>
                      {new Date(currentEvent.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {new Date(currentEvent.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </span>
                </div>
              )}

              {currentEvent.teamSizeInfo && (
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Squad Size</span>
                  <span className="font-semibold text-foreground inline-flex items-center gap-1 mt-0.5">
                    <Users className="size-3 text-indigo-500 shrink-0" />
                    <span>{currentEvent.teamSizeInfo}</span>
                  </span>
                </div>
              )}

              {currentEvent.registrationDeadline && (
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Registration Deadline</span>
                  <span className="font-semibold text-foreground inline-flex items-center gap-1 mt-0.5">
                    <Clock className="size-3 text-amber-500 shrink-0" />
                    <span>{new Date(currentEvent.registrationDeadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Team Basics & Event Selection */}
        <Card className="border-border/80 bg-card shadow-sm rounded-2xl">
          <CardHeader className="pb-4 border-b border-border/60">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <Users className="size-4.5 text-primary" />
              <span>Step 1: Squad Basics &amp; Event Alignment</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Give your squad a memorable name and describe your project goals.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="team-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Squad Name *
              </label>
              <Input
                id="team-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Neural Pioneers, Quantum Builders, DevDynasty"
                required
                disabled={isPending}
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="team-desc" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Project Mission &amp; Problem Statement *
              </label>
              <Textarea
                id="team-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what your squad plans to build, problem statement, and what kind of collaborators you are looking for..."
                rows={3}
                required
                disabled={isPending}
                className="rounded-xl text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                A clear mission statement helps prospective teammates understand your project vision.
              </p>
            </div>

            {/* Event Selector */}
            <div className="space-y-1.5 pt-1 border-t border-border/60">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-primary" />
                <span>Associated Event / Hackathon</span>
              </label>
              <Select
                value={selectedEventId}
                onValueChange={setSelectedEventId}
                disabled={isPending}
              >
                <SelectTrigger className="w-full h-10 rounded-xl text-xs">
                  <SelectValue placeholder="Select an active hackathon event..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE" className="text-xs">General / Independent Project (No Event)</SelectItem>
                  {events.map((ev) => (
                    <SelectItem key={ev.id} value={ev.id} className="text-xs">
                      {ev.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Role Builder */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <Briefcase className="size-5 text-primary" />
                <span>Step 2: Recruitment Roles ({roles.length})</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Specify the technical disciplines and required skills needed on your roster.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleAddRole}
              disabled={isPending}
              size="sm"
              className="gap-1.5 font-semibold shadow-xs rounded-xl self-start sm:self-auto text-xs"
            >
              <Plus className="size-3.5" />
              <span>Add Role</span>
            </Button>
          </div>

          {roles.length === 0 ? (
            <Card className="border-2 border-dashed border-border/80 rounded-2xl bg-muted/20 text-center py-10">
              <CardContent className="space-y-3">
                <div className="size-12 mx-auto rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                  <Briefcase className="size-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">No recruitment roles added yet</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Click &ldquo;Add Role&rdquo; to define positions like Frontend Developer, Backend Developer, AI/ML Engineer, or UI/UX Designer.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleAddRole}
                  className="gap-1.5 font-semibold shadow-xs text-xs"
                >
                  <Plus className="size-3.5" />
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

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicateRole(role.id)}
                        disabled={isPending}
                        className="text-muted-foreground hover:text-foreground h-8 px-2 text-xs gap-1"
                      >
                        <Copy className="size-3" />
                        <span className="hidden sm:inline">Duplicate</span>
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRole(role.id)}
                        disabled={isPending}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-2 text-xs gap-1"
                      >
                        <Trash2 className="size-3.5" />
                        <span>Remove</span>
                      </Button>
                    </div>
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

                    {/* Recommended Skills (Suggestions only) */}
                    {role.recommendedSkills && role.recommendedSkills.length > 0 && (
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1.5">
                        <div className="text-[11px] font-semibold text-primary flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="size-3.5" />
                            <span>Recommended skills for {role.name} (Suggestions only):</span>
                          </span>
                          <span className="text-[10px] text-muted-foreground">Click to assign</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {role.recommendedSkills.map((skillName) => {
                            const isReq = role.requiredSkillIds.includes(skillName)
                            const isPref = role.preferredSkillIds.includes(skillName)
                            return (
                              <div
                                key={skillName}
                                className="inline-flex items-center rounded-lg border border-border/80 bg-background text-xs overflow-hidden shadow-2xs"
                              >
                                <span className="px-2 py-1 font-medium text-foreground text-[11px]">
                                  {skillName}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAddSuggestedSkill(role.id, skillName, true)}
                                  className={`px-1.5 py-1 text-[10px] font-semibold border-l border-border/60 transition-colors ${
                                    isReq
                                      ? "bg-primary text-primary-foreground"
                                      : "hover:bg-primary/10 text-primary"
                                  }`}
                                  title="Add as Required skill"
                                >
                                  {isReq ? "✓ Req" : "+ Req"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAddSuggestedSkill(role.id, skillName, false)}
                                  className={`px-1.5 py-1 text-[10px] font-semibold border-l border-border/60 transition-colors ${
                                    isPref
                                      ? "bg-amber-500 text-white"
                                      : "hover:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  }`}
                                  title="Add as Preferred skill"
                                >
                                  {isPref ? "✓ Pref" : "+ Pref"}
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Seats & Experience */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Seats Needed (Builders) *
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
                          className="h-10 rounded-xl text-xs"
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
                          <SelectTrigger className="w-full h-10 rounded-xl text-xs">
                            <SelectValue placeholder="Select experience..." />
                          </SelectTrigger>
                          <SelectContent>
                            {EXPERIENCE_LEVEL_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="text-xs">
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
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                          {role.requiredSkillIds.length} required
                        </Badge>
                      </div>
                      <SearchableSkillSelector
                        isMultiSelect
                        selectedSkills={role.requiredSkillIds}
                        onSelectedSkillsChange={(skills) =>
                          handleUpdateRole(role.id, { requiredSkillIds: skills })
                        }
                        availableSkills={availableSkills}
                        placeholder="Search & add required skills (e.g. React, Python)..."
                      />
                    </div>

                    {/* Preferred Skills */}
                    <div className="space-y-1.5 pt-2 border-t border-border/60">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Sparkles className="size-3.5 text-amber-500" />
                          <span>Preferred / Bonus Skills (Optional)</span>
                        </label>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border/80 text-muted-foreground">
                          {role.preferredSkillIds.length} preferred
                        </Badge>
                      </div>
                      <SearchableSkillSelector
                        isMultiSelect
                        selectedSkills={role.preferredSkillIds}
                        onSelectedSkillsChange={(skills) =>
                          handleUpdateRole(role.id, { preferredSkillIds: skills })
                        }
                        excludeSkills={role.requiredSkillIds}
                        availableSkills={availableSkills}
                        placeholder="Add preferred bonus skills (e.g. Docker, Tailwind)..."
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Step 3: Squad Recruitment Summary & Readiness Review */}
        {roles.length > 0 && (
          <Card className="border-border/80 bg-card shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 bg-muted/10 border-b border-border/40">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="size-4.5 text-emerald-500" />
                  <span>Step 3: Squad Recruitment Summary</span>
                </CardTitle>
                <Badge variant="secondary" className="text-xs font-mono font-bold">
                  {roles.length} {roles.length === 1 ? 'Role' : 'Roles'} • {totalOpenSeats} {totalOpenSeats === 1 ? 'Seat' : 'Seats'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roles.map((r, idx) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-foreground">
                        {idx + 1}. {r.name || "Untitled Role"}
                      </span>
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                        {r.seatsRequired} {r.seatsRequired === 1 ? 'seat' : 'seats'}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 flex-wrap">
                        <span className="font-semibold">Req:</span>
                        {r.requiredSkillIds.length > 0 ? (
                          r.requiredSkillIds.map((s) => (
                            <Badge key={s} variant="secondary" className="text-[9px] px-1 py-0">
                              {s}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-destructive font-semibold">None configured</span>
                        )}
                      </div>

                      {r.preferredSkillIds.length > 0 && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 flex-wrap">
                          <span className="font-semibold">Pref:</span>
                          {r.preferredSkillIds.map((s) => (
                            <Badge key={s} variant="outline" className="text-[9px] px-1 py-0">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pre-Creation Readiness Checklist */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-2 text-xs">
                <div className="font-bold text-foreground flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                  <Check className="size-3.5 text-primary" />
                  <span>Team Readiness Pre-Check</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {readinessChecks.map((check) => (
                    <div key={check.id} className="flex items-center gap-1.5">
                      {check.completed ? (
                        <Check className="size-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <ShieldAlert className="size-3.5 text-destructive shrink-0" />
                      )}
                      <span className={check.completed ? "text-muted-foreground" : "text-destructive font-semibold"}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
          <Button asChild variant="outline" className="h-10 px-5 rounded-xl text-xs font-semibold">
            <Link href="/teams">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={isPending || !isFormReady}
            className="h-10 px-6 gap-2 font-semibold shadow-xs rounded-xl text-xs"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Creating Squad &amp; Publishing Roles...</span>
              </>
            ) : (
              <>
                <Users className="size-4" />
                <span>Create Squad ({totalOpenSeats} Seats)</span>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Success Modal with Immediate Discovery Handoff (Phase 10 & 11) */}
      {createdTeamInfo && (
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md rounded-2xl p-6 text-center space-y-4">
            <div className="size-16 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Trophy className="size-8" />
            </div>

            <DialogHeader className="space-y-1 text-center">
              <DialogTitle className="text-xl font-extrabold text-foreground text-center">
                Squad Created Successfully!
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground text-center">
                &ldquo;{createdTeamInfo.teamName}&rdquo; is now live with {createdTeamInfo.rolesCount} recruitment roles and {createdTeamInfo.seatsCount} open seats.
              </DialogDescription>
            </DialogHeader>

            <div className="p-4 rounded-xl border border-border/80 bg-muted/20 text-xs space-y-2 text-left">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                <span>Next Recommended Actions</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Start discovering candidates matching your new role requirements, or open your squad workspace to coordinate.
              </p>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button asChild size="default" className="w-full sm:flex-1 text-xs font-semibold gap-1.5 shadow-xs bg-primary text-primary-foreground">
                <Link href={createdTeamInfo.firstRoleId ? `/discover?role=${createdTeamInfo.firstRoleId}` : "/discover"}>
                  <Compass className="size-4" />
                  <span>Find Teammates</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="default" className="w-full sm:flex-1 text-xs font-semibold">
                <Link href={`/teams/${createdTeamInfo.teamId}/workspace`}>
                  <span>Squad Workspace</span>
                  <ArrowRight className="size-3.5 ml-1" />
                </Link>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
