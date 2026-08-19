"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { Search, Plus, Check, X, Tag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  AUTHORITATIVE_SKILLS,
  SKILL_CATEGORIES,
  type SkillCategory,
} from "@/lib/constants/options"

export interface AvailableSkillItem {
  id: string
  name: string
  category?: string
}

interface SearchableSkillSelectorProps {
  availableSkills: AvailableSkillItem[]
  selectedSkillIds: string[]
  onSelectSkill: (skill: { id: string; name: string }) => void
  onRemoveSkill?: (skillId: string) => void
  onAddCustomSkill?: (customName: string) => void
  maxSelected?: number
  placeholder?: string
  className?: string
}

export function SearchableSkillSelector({
  availableSkills,
  selectedSkillIds,
  onSelectSkill,
  onRemoveSkill,
  onAddCustomSkill,
  maxSelected,
  placeholder = "Search 80+ engineering, design, and data skills...",
  className = "",
}: SearchableSkillSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | "ALL">("ALL")

  // Merge available database skills with authoritative taxonomy
  const mergedSkills = useMemo(() => {
    const map = new Map<string, AvailableSkillItem>()

    // 1. First add authoritative catalog
    AUTHORITATIVE_SKILLS.forEach((auth) => {
      const dbMatch = availableSkills.find(
        (s) => s.name.toLowerCase() === auth.name.toLowerCase()
      )
      map.set(auth.name.toLowerCase(), {
        id: dbMatch ? dbMatch.id : `auth-${auth.name}`,
        name: auth.name,
        category: auth.category,
      })
    })

    // 2. Add any additional database skills (custom or legacy)
    availableSkills.forEach((dbSkill) => {
      const lower = dbSkill.name.toLowerCase()
      if (!map.has(lower)) {
        map.set(lower, {
          id: dbSkill.id,
          name: dbSkill.name,
          category: dbSkill.category || "Other",
        })
      }
    })

    return Array.from(map.values())
  }, [availableSkills])

  // Filter skills by category and search query
  const filteredSkills = useMemo(() => {
    return mergedSkills.filter((skill) => {
      // Category filter
      if (selectedCategory !== "ALL" && skill.category !== selectedCategory) {
        return false
      }

      // Search query filter (matches name or aliases)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const authDef = AUTHORITATIVE_SKILLS.find(
          (a) => a.name.toLowerCase() === skill.name.toLowerCase()
        )
        const matchesName = skill.name.toLowerCase().includes(query)
        const matchesAlias = authDef?.aliases?.some((alias) =>
          alias.toLowerCase().includes(query)
        )
        if (!matchesName && !matchesAlias) {
          return false
        }
      }

      return true
    })
  }, [mergedSkills, selectedCategory, searchQuery])

  const isCustomCandidate = useMemo(() => {
    if (!searchQuery.trim()) return false
    const q = searchQuery.trim().toLowerCase()
    return !mergedSkills.some((s) => s.name.toLowerCase() === q)
  }, [searchQuery, mergedSkills])

  const handleCustomAdd = () => {
    if (!searchQuery.trim()) return
    const customName = searchQuery.trim()
    if (onAddCustomSkill) {
      onAddCustomSkill(customName)
    } else {
      onSelectSkill({ id: `custom-${customName}`, name: customName })
    }
    setSearchQuery("")
  }

  const reachedLimit = maxSelected !== undefined && selectedSkillIds.length >= maxSelected

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-8 h-10 text-xs sm:text-sm bg-background border-border/80 rounded-xl"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full"
            aria-label="Clear skill search"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Category Pills Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar text-xs">
        <button
          type="button"
          onClick={() => setSelectedCategory("ALL")}
          className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            selectedCategory === "ALL"
              ? "bg-primary text-primary-foreground border-primary shadow-2xs"
              : "bg-muted/40 text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted"
          }`}
        >
          All Categories ({mergedSkills.length})
        </button>
        {SKILL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                : "bg-muted/40 text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Skills Grid Selection */}
      <div className="rounded-xl border border-border/70 bg-muted/20 p-2.5 max-h-56 overflow-y-auto space-y-2">
        {filteredSkills.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {filteredSkills.map((skill) => {
              const isSelected = selectedSkillIds.includes(skill.id) || selectedSkillIds.includes(skill.name) || selectedSkillIds.some(
                (sid) => sid.toLowerCase() === skill.name.toLowerCase()
              )

              return (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      if (onRemoveSkill) onRemoveSkill(skill.id)
                    } else {
                      if (!reachedLimit) onSelectSkill(skill)
                    }
                  }}
                  disabled={!isSelected && reachedLimit}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs transition-all cursor-pointer select-none ${
                    isSelected
                      ? "bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold shadow-2xs"
                      : reachedLimit
                      ? "bg-muted/30 border-border/40 text-muted-foreground opacity-50 cursor-not-allowed"
                      : "bg-card border-border/80 text-foreground hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  {isSelected ? (
                    <Check className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <Plus className="size-3 text-muted-foreground shrink-0" />
                  )}
                  <span>{skill.name}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-muted-foreground space-y-2">
            <Tag className="size-6 mx-auto text-muted-foreground/60" />
            <p>No predefined skills matching &quot;{searchQuery}&quot;.</p>
          </div>
        )}

        {/* Custom Skill Option */}
        {isCustomCandidate && (
          <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground truncate">
              Add &quot;<strong>{searchQuery.trim()}</strong>&quot; as a custom skill?
            </span>
            <Button
              type="button"
              size="xs"
              onClick={handleCustomAdd}
              className="gap-1 text-xs shrink-0 font-semibold"
            >
              <Plus className="size-3" />
              <span>Add Custom</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
