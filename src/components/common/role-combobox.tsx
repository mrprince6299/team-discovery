"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { Briefcase, ChevronDown, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  AUTHORITATIVE_ROLES,
  type RoleTemplate,
} from "@/lib/constants/options"

interface RoleComboboxProps {
  value: string
  onChange: (roleName: string, suggestedSkills?: string[]) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function RoleCombobox({
  value,
  onChange,
  disabled = false,
  placeholder = "e.g. Lead Frontend Engineer, AI Researcher...",
  className = "",
}: RoleComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>("ALL")

  const categories = ["ALL", "Engineering", "Data & AI", "Design & Product", "Hardware & Security", "Leadership & Other"]

  const filteredRoles = useMemo(() => {
    return AUTHORITATIVE_ROLES.filter((r) => {
      if (activeCategory !== "ALL" && r.category !== activeCategory) {
        return false
      }
      if (value.trim()) {
        return r.name.toLowerCase().includes(value.toLowerCase().trim())
      }
      return true
    })
  }, [activeCategory, value])

  const handleSelectTemplate = (role: RoleTemplate) => {
    onChange(role.name, role.defaultSkills)
    setIsOpen(false)
  }

  return (
    <div className={`relative space-y-1.5 ${className}`}>
      <div className="relative flex items-center">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="h-10 text-xs sm:text-sm font-medium pr-10 rounded-xl"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute right-2.5 p-1 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
          aria-label="Toggle role suggestions"
        >
          <ChevronDown className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Dropdown Suggestions Panel */}
      {isOpen && !disabled && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-2xl border border-border/80 bg-card p-3 shadow-xl space-y-2.5 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Briefcase className="size-3.5 text-primary" />
                <span>Standard Role Templates</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Select to auto-populate skills</span>
            </div>

            {/* Categories */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 text-[11px]">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap transition-colors ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground font-bold"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Role List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
              {filteredRoles.map((role) => {
                const isSelected = value.toLowerCase() === role.name.toLowerCase()
                return (
                  <button
                    key={role.name}
                    type="button"
                    onClick={() => handleSelectTemplate(role)}
                    className={`flex flex-col items-start p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 border-primary text-foreground font-bold shadow-2xs"
                        : "bg-muted/20 border-border/60 hover:bg-muted/50 hover:border-border text-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-semibold">{role.name}</span>
                      {isSelected && <Check className="size-3 text-primary shrink-0" />}
                    </div>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[200px] mt-0.5">
                      Skills: {role.defaultSkills.join(", ")}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
