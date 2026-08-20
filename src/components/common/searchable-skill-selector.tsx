"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import {
  Search,
  Check,
  Plus,
  X,
  Layers,
  Sparkles,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AUTHORITATIVE_SKILLS,
  type SkillCategory,
} from "@/lib/constants/options"
import { TechIcon } from "./tech-icon"

interface SearchableSkillSelectorProps {
  /** Single-select mode value */
  value?: string
  /** Single-select onChange callback */
  onChange?: (skillIdOrName: string) => void
  /** Multi-select mode enabled */
  isMultiSelect?: boolean
  /** Multi-select selected skill names */
  selectedSkills?: string[]
  /** Multi-select onChange callback */
  onSelectedSkillsChange?: (skills: string[]) => void
  /** Exclude these skills from selectable list */
  excludeSkills?: string[]
  /** Available database skills (for UUID resolution) */
  availableSkills?: Array<{ id: string; name: string }>
  /** Custom placeholder */
  placeholder?: string
  /** Disable interactions */
  disabled?: boolean
  /** Maximum number of skills that can be selected in multi-select mode */
  maxSelection?: number
}

const CATEGORIES: Array<"All" | SkillCategory> = [
  "All",
  "Frontend",
  "Backend",
  "Mobile",
  "Databases",
  "Cloud & DevOps",
  "AI & Data",
  "Cybersecurity",
  "Hardware & Systems",
  "Design & Product",
]

export function SearchableSkillSelector({
  value = "",
  onChange,
  isMultiSelect = false,
  selectedSkills = [],
  onSelectedSkillsChange,
  excludeSkills = [],
  availableSkills = [],
  placeholder = "Search 80+ technical skills (e.g. React, Python, Docker)...",
  disabled = false,
  maxSelection = 15,
}: SearchableSkillSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<"All" | SkillCategory>("All")

  // Excluded set in lower-case
  const excludedSet = useMemo(
    () => new Set(excludeSkills.map((s) => s.toLowerCase())),
    [excludeSkills]
  )

  // Multi-selected set in lower-case
  const selectedSet = useMemo(
    () => new Set(selectedSkills.map((s) => s.toLowerCase())),
    [selectedSkills]
  )

  // Merged catalog: Authoritative list + any custom skills from database
  const catalog = useMemo(() => {
    const list = [...AUTHORITATIVE_SKILLS]
    const authNames = new Set(list.map((s) => s.name.toLowerCase()))

    for (const dbSkill of availableSkills) {
      if (!authNames.has(dbSkill.name.toLowerCase())) {
        list.push({
          name: dbSkill.name,
          category: "Backend",
          aliases: [],
        })
      }
    }
    return list
  }, [availableSkills])

  // Filtered skills based on category and search query
  const filteredSkills = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return catalog.filter((skill) => {
      // Category filter
      if (activeCategory !== "All" && skill.category !== activeCategory) {
        return false
      }

      // Search query filter
      if (!query) return true

      const nameMatch = skill.name.toLowerCase().includes(query)
      const aliasMatch = skill.aliases?.some((a) => a.toLowerCase().includes(query))
      return nameMatch || aliasMatch
    })
  }, [catalog, activeCategory, searchQuery])

  // Check if query is an exact match in catalog
  const isExactMatch = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return true
    return catalog.some((s) => s.name.toLowerCase() === query)
  }, [catalog, searchQuery])

  // Toggle skill selection in multi-select mode
  const handleToggleSkill = (skillName: string) => {
    if (disabled) return

    if (!isMultiSelect) {
      // Single select mode
      if (onChange) {
        const dbMatch = availableSkills.find(
          (s) => s.name.toLowerCase() === skillName.toLowerCase()
        )
        onChange(dbMatch ? dbMatch.id : skillName)
      }
      return
    }

    if (!onSelectedSkillsChange) return

    const lower = skillName.toLowerCase()
    if (selectedSet.has(lower)) {
      onSelectedSkillsChange(
        selectedSkills.filter((s) => s.toLowerCase() !== lower)
      )
    } else {
      if (selectedSkills.length >= maxSelection) {
        return
      }
      onSelectedSkillsChange([...selectedSkills, skillName])
    }
  }

  // Add custom skill
  const handleAddCustom = () => {
    const trimmed = searchQuery.trim()
    if (!trimmed) return
    handleToggleSkill(trimmed)
    setSearchQuery("")
  }

  // Remove single skill in multi-select tray
  const handleRemoveSelected = (skillName: string) => {
    if (!onSelectedSkillsChange) return
    onSelectedSkillsChange(
      selectedSkills.filter((s) => s.toLowerCase() !== skillName.toLowerCase())
    )
  }

  return (
    <div className="space-y-3.5">
      {/* 1. Multi-Select Selected Tray */}
      {isMultiSelect && selectedSkills.length > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
            <span className="flex items-center gap-1.5 text-primary">
              <Sparkles className="size-3.5" />
              <span>Selected Skills ({selectedSkills.length}{maxSelection ? `/${maxSelection}` : ""})</span>
            </span>
            <button
              type="button"
              onClick={() => onSelectedSkillsChange && onSelectedSkillsChange([])}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors font-normal cursor-pointer"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
            {selectedSkills.map((skillName) => (
              <Badge
                key={skillName}
                variant="default"
                className="gap-1.5 pl-2 pr-1.5 py-1 text-xs font-medium bg-primary text-primary-foreground shadow-xs animate-in fade-in"
              >
                <TechIcon name={skillName} className="size-3 text-primary-foreground" />
                <span>{skillName}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSelected(skillName)}
                  className="rounded-full p-0.5 hover:bg-black/20 dark:hover:bg-white/20 transition-colors ml-0.5 cursor-pointer"
                  aria-label={`Remove ${skillName}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 2. Search Bar */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 size-4 text-muted-foreground" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="h-10 pl-9 pr-8 text-xs sm:text-sm rounded-xl border-border/80 bg-background shadow-xs focus-visible:ring-primary"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 p-1 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* 3. Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 4. Skill Cards Grid (Scrollable) */}
      <div className="rounded-xl border border-border/70 bg-card p-2.5 max-h-64 sm:max-h-72 overflow-y-auto space-y-2">
        {filteredSkills.length === 0 && (
          <div className="text-center py-8 space-y-2">
            <Layers className="size-8 text-muted-foreground mx-auto opacity-50" />
            <p className="text-xs text-muted-foreground">
              No matching skills found for &quot;{searchQuery}&quot;.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {filteredSkills.map((skill) => {
            const isSelected = isMultiSelect
              ? selectedSet.has(skill.name.toLowerCase())
              : value.toLowerCase() === skill.name.toLowerCase()
            const isExcluded = excludedSet.has(skill.name.toLowerCase())

            return (
              <button
                key={skill.name}
                type="button"
                onClick={() => handleToggleSkill(skill.name)}
                disabled={disabled || isExcluded}
                className={`flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary shadow-xs font-semibold"
                    : isExcluded
                    ? "opacity-40 border-dashed border-border bg-muted/40 cursor-not-allowed text-muted-foreground"
                    : "border-border/60 bg-muted/20 hover:bg-muted/60 hover:border-border text-foreground"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  <div className="size-6 rounded-lg bg-background border border-border/60 flex items-center justify-center shrink-0 shadow-2xs">
                    <TechIcon name={skill.name} className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs truncate block">{skill.name}</span>
                    <span className="text-[9px] text-muted-foreground block leading-none truncate">
                      {skill.category}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  {isSelected ? (
                    <div className="size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="size-2.5 stroke-[3]" />
                    </div>
                  ) : isExcluded ? (
                    <span className="text-[9px] text-muted-foreground uppercase">Added</span>
                  ) : (
                    <Plus className="size-3.5 text-muted-foreground opacity-60" />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* 5. Custom Skill Fallback */}
        {searchQuery.trim().length > 1 && !isExactMatch && (
          <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Don&apos;t see &quot;{searchQuery}&quot;?
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCustom}
              className="h-7 text-xs gap-1 border-primary/40 hover:bg-primary/10 text-primary font-semibold"
            >
              <Plus className="size-3" />
              <span>Add &quot;{searchQuery.trim()}&quot; as Custom Skill</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
