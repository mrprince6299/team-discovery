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
            Department
          </label>
          <Select
            value={filters.departmentId}
            onValueChange={(val) => onFilterChange("departmentId", val)}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Departments</SelectItem>
              {departments.map((dept) => (
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
              <SelectItem value="1">Year 1 (Freshman)</SelectItem>
              <SelectItem value="2">Year 2 (Sophomore)</SelectItem>
              <SelectItem value="3">Year 3 (Junior)</SelectItem>
              <SelectItem value="4">Year 4 (Senior)</SelectItem>
              <SelectItem value="5">Year 5 / Graduate</SelectItem>
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
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="LOOKING_FOR_TEAM">Looking for Team</SelectItem>
              <SelectItem value="BUSY">Busy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Minimum Experience Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Min Experience
          </label>
          <Select
            value={filters.minExperience}
            onValueChange={(val) => onFilterChange("minExperience", val)}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Any Experience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Any Experience</SelectItem>
              <SelectItem value="BEGINNER">Beginner+</SelectItem>
              <SelectItem value="SOME_EXPERIENCE">Some Experience (1+ Projects)</SelectItem>
              <SelectItem value="EXPERIENCED">Experienced (2+ Projects)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
