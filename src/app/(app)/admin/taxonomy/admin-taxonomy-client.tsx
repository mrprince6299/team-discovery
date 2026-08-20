"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import {
  Search,
  Briefcase,
  GraduationCap,
  Building,
  Tag,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TechIcon } from "@/components/common/tech-icon"

export interface TaxonomyData {
  categories: Record<string, string[]>
  canonicalSkills: Array<{ name: string; category: string; studentCount: number; squadDemandCount: number }>
  customSkills: Array<{ id: string; name: string; isCustom: boolean; studentCount: number; squadDemandCount: number }>
  canonicalRoles: Array<{ name: string; category: string; description: string; defaultSkills: string[] }>
  canonicalPrograms: Array<{ code: string; name: string; branches: string[] }>
  canonicalDepartments: Array<{ code: string; name: string; program: string; branch: string }>
  totalSkillsCount: number
  customSkillsCount: number
}

export function AdminTaxonomyClient({ data }: { data: TaxonomyData }) {
  const [activeTab, setActiveTab] = useState("SKILLS")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCanonicalSkills = data.canonicalSkills.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  )

  const filteredCustomSkills = data.customSkills.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  )

  const filteredRoles = data.canonicalRoles.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      r.defaultSkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase().trim()))
  )

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
              Skills ({data.canonicalSkills.length})
            </TabsTrigger>
            <TabsTrigger value="CUSTOM" className="text-xs font-semibold rounded-lg">
              Custom Skills ({data.customSkillsCount})
            </TabsTrigger>
            <TabsTrigger value="ROLES" className="text-xs font-semibold rounded-lg">
              Roles ({data.canonicalRoles.length})
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
          {Object.entries(data.categories).map(([categoryName, skillNames]) => {
            const categorySkills = filteredCanonicalSkills.filter((s) => skillNames.includes(s.name))
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
          <div className="p-4 rounded-xl border border-border/80 bg-muted/20 text-xs text-muted-foreground">
            These skills were added by students that were not in the global catalog. They are cleanly isolated to prevent corrupting canonical taxonomy.
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
                    <span className="font-semibold text-xs text-foreground truncate">{skill.name}</span>
                    <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/40">
                      {skill.studentCount} students
                    </Badge>
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
    </div>
  )
}
