"use client"

import * as React from "react"
import { Filter, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  ACADEMIC_YEAR_OPTIONS,
  AVAILABILITY_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  AUTHORITATIVE_DEPARTMENTS,
} from "@/lib/constants/options"

export interface FilterState {
  departmentId: string
  year: string
  availability: string
  minExperience: string
}

interface DiscoveryFiltersProps {
  filters: FilterState
  departments: Array<{ id: string; name: string }>
  onFilterChange: (key: keyof FilterState, value: string) => void
  onResetFilters: () => void
  totalResultsCount: number
}

export function DiscoveryFilters({
  filters,
  departments,
  onFilterChange,
  onResetFilters,
  totalResultsCount,
}: DiscoveryFiltersProps) {
  const activeCount = Object.values(filters).filter((v) => v !== "ALL" && v !== "").length

  // Merge database departments with authoritative department list for comprehensive coverage
  const allDepartments = React.useMemo(() => {
    const list = [...departments]
    const existingNames = new Set(list.map((d) => d.name.toLowerCase()))

    AUTHORITATIVE_DEPARTMENTS.forEach((authDept) => {
      if (!existingNames.has(authDept.name.toLowerCase())) {
        list.push({
          id: authDept.code,
          name: authDept.name,
        })
      }
    })
    return list
  }, [departments])

  return (
    <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Filter Candidates</span>
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {activeCount} active
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Showing <strong>{totalResultsCount}</strong> candidates
          </span>
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <RotateCcw className="size-3" />
              <span>Clear</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {/* Department Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Department / Major
          </label>
          <Select
            value={filters.departmentId}
            onValueChange={(val) => onFilterChange("departmentId", val)}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="ALL">All Departments</SelectItem>
              {allDepartments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Academic Year Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Academic Year
          </label>
          <Select
            value={filters.year}
            onValueChange={(val) => onFilterChange("year", val)}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Years</SelectItem>
              {ACADEMIC_YEAR_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Availability Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Availability
          </label>
          <Select
            value={filters.availability}
            onValueChange={(val) => onFilterChange("availability", val)}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Any Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Any Availability</SelectItem>
              {AVAILABILITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Minimum Experience Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Min Experience Level
          </label>
          <Select
            value={filters.minExperience}
            onValueChange={(val) => onFilterChange("minExperience", val)}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Any Experience" />
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
    </div>
  )
}
