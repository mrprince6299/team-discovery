"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import Link from "next/link"
import {
  Search,
  Briefcase,
  GraduationCap,
  Building,
  Tag,
  PlusCircle,
  ArrowUpRight,
  Trash2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { TechIcon } from "@/components/common/tech-icon"
import {
  createAdminSkill,
  promoteCustomSkillToCanonical,
  deleteAdminSkill,
} from "@/app/actions/admin"

export interface TaxonomyData {
  categories: Record<string, string[]>
  canonicalSkills: Array<{ id?: string; name: string; category: string; studentCount: number; squadDemandCount: number }>
  customSkills: Array<{ id: string; name: string; isCustom: boolean; studentCount: number; squadDemandCount: number }>
  canonicalRoles: Array<{ name: string; category: string; description: string; defaultSkills: string[] }>
  canonicalPrograms: Array<{ code: string; name: string; branches: string[] }>
  canonicalDepartments: Array<{ code: string; name: string; program: string; branch: string }>
  totalSkillsCount: number
  customSkillsCount: number
}

const SKILL_CATEGORIES = [
  "Frontend",
  "Backend",
  "Mobile",
  "Databases",
  "Cloud & DevOps",
  "AI & Data",
  "Cybersecurity",
  "Hardware & Systems",
  "Design & Product",
  "Other",
]

export function AdminTaxonomyClient({ data }: { data: TaxonomyData }) {
  const [activeTab, setActiveTab] = useState("SKILLS")
  const [searchQuery, setSearchQuery] = useState("")
  const [isPending, startTransition] = useTransition()

  // Dynamic state
  const [canonicalSkills, setCanonicalSkills] = useState(data.canonicalSkills)
  const [customSkills, setCustomSkills] = useState(data.customSkills)
  const [canonicalRoles, setCanonicalRoles] = useState(data.canonicalRoles)
  const [categories, setCategories] = useState(data.categories)

  // Modals state
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false)
  const [newSkillName, setNewSkillName] = useState("")
  const [newSkillCategory, setNewSkillCategory] = useState("AI & Data")

  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState("")
  const [newRoleCategory, setNewRoleCategory] = useState("Data & AI")
  const [newRoleDesc, setNewRoleDesc] = useState("")
  const [newRoleSkills, setNewRoleSkills] = useState("")

  const filteredCanonicalSkills = canonicalSkills.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  )

  const filteredCustomSkills = customSkills.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  )

  const filteredRoles = canonicalRoles.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      r.defaultSkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase().trim()))
  )

  const handleCreateSkill = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSkillName.trim()) {
      toast.error("Please enter a skill name.")
      return
    }

    startTransition(async () => {
      const res = await createAdminSkill({
        name: newSkillName.trim(),
        category: newSkillCategory,
        isCustom: false,
      })

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Canonical skill "${newSkillName.trim()}" added and live!`)
        const createdName = newSkillName.trim()
        setCanonicalSkills((prev) => [
          {
            id: res.skill?.id,
            name: createdName,
            category: newSkillCategory,
            studentCount: 0,
            squadDemandCount: 0,
          },
          ...prev,
        ])
        setCategories((prev) => {
          const catList = prev[newSkillCategory] ? [...prev[newSkillCategory]] : []
          if (!catList.includes(createdName)) catList.push(createdName)
          return { ...prev, [newSkillCategory]: catList }
        })
        setIsAddSkillOpen(false)
        setNewSkillName("")
      }
    })
  }

  const handlePromoteSkill = (skill: { id: string; name: string }) => {
    startTransition(async () => {
      const res = await promoteCustomSkillToCanonical(skill.id)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Custom skill "${skill.name}" promoted to canonical!`)
        setCustomSkills((prev) => prev.filter((s) => s.id !== skill.id))
        setCanonicalSkills((prev) => [
          {
            id: skill.id,
            name: skill.name,
            category: "Other",
            studentCount: 1,
            squadDemandCount: 0,
          },
          ...prev,
        ])
        setCategories((prev) => {
          const catList = prev["Other"] ? [...prev["Other"]] : []
          if (!catList.includes(skill.name)) catList.push(skill.name)
          return { ...prev, Other: catList }
        })
      }
    })
  }

  const handleDeleteSkill = (skillId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove skill "${name}"?`)) return

    startTransition(async () => {
      const res = await deleteAdminSkill(skillId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Skill "${name}" removed.`)
        setCanonicalSkills((prev) => prev.filter((s) => s.id !== skillId))
        setCustomSkills((prev) => prev.filter((s) => s.id !== skillId))
      }
    })
  }

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoleName.trim()) {
      toast.error("Please enter a role template name.")
      return
    }

    const defaultSkills = newRoleSkills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    const newTemplate = {
      name: newRoleName.trim(),
      category: newRoleCategory,
      description: newRoleDesc.trim() || `Standard ${newRoleName.trim()} position.`,
      defaultSkills,
    }

    setCanonicalRoles((prev) => [newTemplate, ...prev])
    toast.success(`Role template "${newRoleName.trim()}" added!`)
    setIsAddRoleOpen(false)
    setNewRoleName("")
    setNewRoleDesc("")
    setNewRoleSkills("")
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/admin" className="hover:text-foreground">Admin Console</Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Taxonomy Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Skill &amp; Role Taxonomy
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Authoritative skill catalog, role definitions, academic programs, and user-generated custom skills.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "SKILLS" && (
            <Button onClick={() => setIsAddSkillOpen(true)} size="sm" className="gap-1.5 font-semibold text-xs shadow-xs">
              <PlusCircle className="size-3.5" />
              <span>Add Skill</span>
            </Button>
          )}
          {activeTab === "ROLES" && (
            <Button onClick={() => setIsAddRoleOpen(true)} size="sm" className="gap-1.5 font-semibold text-xs shadow-xs">
              <PlusCircle className="size-3.5" />
              <span>Add Role Template</span>
            </Button>
          )}
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
            <Link href="/admin">
              <span>Admin Overview</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-2xl border border-border/80">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-4 bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="SKILLS" className="text-xs font-semibold rounded-lg">
              Skills ({canonicalSkills.length})
            </TabsTrigger>
            <TabsTrigger value="CUSTOM" className="text-xs font-semibold rounded-lg">
              Custom Skills ({customSkills.length})
            </TabsTrigger>
            <TabsTrigger value="ROLES" className="text-xs font-semibold rounded-lg">
              Roles ({canonicalRoles.length})
            </TabsTrigger>
            <TabsTrigger value="ACADEMICS" className="text-xs font-semibold rounded-lg">
              Academic Degrees
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search taxonomy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8.5 h-9 text-xs rounded-xl bg-background border-border/80"
          />
        </div>
      </div>

      {/* TAB 1: CANONICAL SKILLS */}
      {activeTab === "SKILLS" && (
        <div className="space-y-6">
          {Object.entries(categories).map(([categoryName, skillNames]) => {
            const categorySkills = filteredCanonicalSkills.filter(
              (s) => s.category === categoryName || skillNames.includes(s.name)
            )
            if (categorySkills.length === 0) return null

            return (
              <div key={categoryName} className="space-y-3">
                <h3 className="font-bold text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Tag className="size-3.5 text-primary" />
                  <span>{categoryName}</span>
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                    {categorySkills.length}
                  </Badge>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categorySkills.map((skill) => (
                    <Card key={skill.name} className="p-3.5 border-border/80 bg-card rounded-xl">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <TechIcon name={skill.name} className="size-4 shrink-0" />
                          <span className="font-semibold text-xs text-foreground truncate">{skill.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono text-muted-foreground">
                          <span title="Declared by Students">{skill.studentCount} users</span>
                          <span>·</span>
                          <span title="Required by Squads">{skill.squadDemandCount} roles</span>
                          {skill.id && skill.studentCount === 0 && skill.squadDemandCount === 0 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSkill(skill.id!, skill.name)}
                              className="text-muted-foreground hover:text-destructive p-0.5"
                              title="Delete Unused Skill"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* TAB 2: CUSTOM USER SKILLS */}
      {activeTab === "CUSTOM" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border/80 bg-muted/20 text-xs text-muted-foreground flex items-center justify-between gap-3">
            <span>
              These skills were added by students that were not in the global catalog. Promoting a custom skill makes it canonical and preserves all existing student profiles.
            </span>
          </div>

          {filteredCustomSkills.length === 0 ? (
            <Card className="border-border/80 rounded-2xl p-12 text-center text-xs text-muted-foreground">
              No custom skills recorded.
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCustomSkills.map((skill) => (
                <Card key={skill.id} className="p-3.5 border-border/80 bg-card rounded-xl">
                  <div className="flex items-center justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <span className="font-semibold text-xs text-foreground truncate block">{skill.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {skill.studentCount} students
                      </span>
                    </div>

                    <Button
                      onClick={() => handlePromoteSkill(skill)}
                      disabled={isPending}
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] gap-1 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    >
                      <ArrowUpRight className="size-3" />
                      <span>Promote</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CANONICAL ROLES */}
      {activeTab === "ROLES" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredRoles.map((role) => (
            <Card key={role.name} className="p-5 border-border/80 bg-card rounded-2xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-foreground">{role.name}</h3>
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    {role.category}
                  </span>
                </div>
                <Briefcase className="size-4 text-primary shrink-0" />
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">{role.description}</p>

              <div className="space-y-1 pt-1">
                <span className="text-[11px] text-muted-foreground block font-medium">Recommended Skills</span>
                <div className="flex flex-wrap gap-1">
                  {role.defaultSkills.map((s) => (
                    <Badge key={s} variant="secondary" className="text-[10px] py-0 px-1.5">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 4: ACADEMIC DEGREES */}
      {activeTab === "ACADEMICS" && (
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="size-3.5 text-primary" />
              <span>Authoritative Degree Programs</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.canonicalPrograms.map((prog) => (
                <Card key={prog.code} className="p-4 border-border/80 bg-card rounded-xl">
                  <span className="font-bold text-sm text-foreground block">{prog.name}</span>
                  <span className="text-xs text-muted-foreground font-mono">{prog.branches.length} Specializations</span>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
              <Building className="size-3.5 text-primary" />
              <span>Branches &amp; Specializations</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.canonicalDepartments.slice(0, 18).map((dept) => (
                <Card key={dept.name} className="p-3.5 border-border/80 bg-card rounded-xl">
                  <span className="font-semibold text-xs text-foreground block truncate">{dept.branch}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Degree: {dept.program}
                  </span>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADD CANONICAL SKILL MODAL */}
      <Dialog open={isAddSkillOpen} onOpenChange={setIsAddSkillOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <PlusCircle className="size-4 text-primary" />
              <span>Add Canonical Skill</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Add a new skill to the global catalog. It will immediately appear across student profiles, team roles, and discovery filters.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSkill} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Skill Name *</label>
              <Input
                placeholder="e.g. LangGraph, Solana, Zig, TailwindCSS"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Category *</label>
              <select
                value={newSkillCategory}
                onChange={(e) => setNewSkillCategory(e.target.value)}
                className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {SKILL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsAddSkillOpen(false)} size="sm">
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} size="sm" className="font-semibold">
                {isPending ? "Adding..." : "Add Skill"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ADD ROLE TEMPLATE MODAL */}
      <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Briefcase className="size-4 text-primary" />
              <span>Add Role Template</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Define a standardized role recommendation with bundled skills for student team creators.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRole} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Role Title *</label>
              <Input
                placeholder="e.g. AI Agent Engineer, Growth Lead"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Category *</label>
              <Input
                placeholder="e.g. Data & AI, Engineering, Product"
                value={newRoleCategory}
                onChange={(e) => setNewRoleCategory(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Description</label>
              <textarea
                placeholder="Brief description of the role's core responsibilities..."
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-input bg-background p-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Recommended Skills (Comma separated)</label>
              <Input
                placeholder="e.g. Python, LangChain, OpenAI API, FastAPI"
                value={newRoleSkills}
                onChange={(e) => setNewRoleSkills(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsAddRoleOpen(false)} size="sm">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="font-semibold">
                Add Role Template
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
