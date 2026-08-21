"use client"

import * as React from "react"
import {
  Filter,
  RotateCcw,
  Search,
  X,
  ShieldCheck,
  Building,
  GraduationCap,
  Clock,
  Briefcase,
  SlidersHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  ACADEMIC_YEAR_OPTIONS,
  AVAILABILITY_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  AUTHORITATIVE_DEPARTMENTS,
} from "@/lib/constants/options"

export interface FilterState {
  searchQuery: string
  departmentId: string
  year: string
  availability: string
  minExperience: string
  verificationOnly: boolean
}

interface DiscoveryFiltersProps {
  filters: FilterState
  departments: Array<{ id: string; name: string }>
  onFilterChange: (key: keyof FilterState, value: any) => void
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
  const [isMobileOpen, setIsMobileOpen] = React.useState(false)

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

  const activeCount = React.useMemo(() => {
    let count = 0
    if (filters.searchQuery.trim().length > 0) count++
    if (filters.departmentId !== "ALL" && filters.departmentId !== "") count++
    if (filters.year !== "ALL" && filters.year !== "") count++
    if (filters.availability !== "ALL" && filters.availability !== "") count++
    if (filters.minExperience !== "ALL" && filters.minExperience !== "") count++
    if (filters.verificationOnly) count++
    return count
  }, [filters])

  const selectedDepartmentName = React.useMemo(() => {
    if (filters.departmentId === "ALL") return null
    const found = allDepartments.find((d) => d.id === filters.departmentId)
    return found ? found.name : filters.departmentId
  }, [filters.departmentId, allDepartments])

  const selectedAvailabilityLabel = React.useMemo(() => {
    if (filters.availability === "ALL") return null
    const found = AVAILABILITY_OPTIONS.find((o) => o.value === filters.availability)
    return found ? found.label : filters.availability
  }, [filters.availability])

  const selectedExpLabel = React.useMemo(() => {
    if (filters.minExperience === "ALL") return null
    const found = EXPERIENCE_LEVEL_OPTIONS.find((o) => o.value === filters.minExperience)
    return found ? found.label : filters.minExperience
  }, [filters.minExperience])

  const filterControls = (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          placeholder="Filter by name, @username, skill, or bio keyword..."
          value={filters.searchQuery}
          onChange={(e) => onFilterChange("searchQuery", e.target.value)}
          className="pl-8.5 pr-8 h-9 text-xs rounded-xl bg-background border-border/80"
        />
        {filters.searchQuery && (
          <button
            type="button"
            onClick={() => onFilterChange("searchQuery", "")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Department Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Building className="size-3 text-primary" />
            <span>Department / Major</span>
          </label>
          <Select
            value={filters.departmentId}
            onValueChange={(val) => onFilterChange("departmentId", val)}
          >
            <SelectTrigger className="h-9 text-xs rounded-xl bg-background">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent className="max-h-60 rounded-xl">
              <SelectItem value="ALL">All Departments</SelectItem>
              {allDepartments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id} className="text-xs">
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Academic Year Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <GraduationCap className="size-3 text-primary" />
            <span>Academic Year</span>
          </label>
          <Select
            value={filters.year}
            onValueChange={(val) => onFilterChange("year", val)}
          >
            <SelectTrigger className="h-9 text-xs rounded-xl bg-background">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="ALL">All Years</SelectItem>
              {ACADEMIC_YEAR_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Availability Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Clock className="size-3 text-emerald-500" />
            <span>Availability</span>
          </label>
          <Select
            value={filters.availability}
            onValueChange={(val) => onFilterChange("availability", val)}
          >
            <SelectTrigger className="h-9 text-xs rounded-xl bg-background">
              <SelectValue placeholder="Any Availability" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="ALL">Any Availability</SelectItem>
              {AVAILABILITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Minimum Experience Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Briefcase className="size-3 text-primary" />
            <span>Min Experience</span>
          </label>
          <Select
            value={filters.minExperience}
            onValueChange={(val) => onFilterChange("minExperience", val)}
          >
            <SelectTrigger className="h-9 text-xs rounded-xl bg-background">
              <SelectValue placeholder="Any Experience" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="ALL">Any Experience</SelectItem>
              {EXPERIENCE_LEVEL_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Verification Filter Pill */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => onFilterChange("verificationOnly", !filters.verificationOnly)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            filters.verificationOnly
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30"
              : "bg-muted/40 border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <ShieldCheck className={`size-4 ${filters.verificationOnly ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`} />
          <span>Verified Students Only</span>
          {filters.verificationOnly && (
            <Badge variant="success" className="text-[9px] py-0 px-1 ml-1 uppercase">Active</Badge>
          )}
        </button>
      </div>
    </div>
  )

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
      {/* Filter Header & Mobile Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Candidate Filters</span>
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-bold">
              {activeCount} active
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-xs text-muted-foreground">
            Showing <strong className="text-foreground">{totalResultsCount}</strong> qualified candidates
          </span>

          {/* Mobile Filter Drawer Trigger */}
          <div className="sm:hidden">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <SlidersHorizontal className="size-3.5" />
                  <span>Filters {activeCount > 0 ? `(${activeCount})` : ""}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
                <SheetHeader className="pb-3 text-left">
                  <SheetTitle className="text-base font-bold flex items-center gap-2">
                    <Filter className="size-4 text-primary" />
                    <span>Filter Candidates</span>
                  </SheetTitle>
                  <SheetDescription className="text-xs">
                    Narrow down candidates by academic department, year, availability, or verification status.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-2">{filterControls}</div>
                <div className="pt-4 flex items-center gap-2">
                  <Button onClick={() => setIsMobileOpen(false)} className="w-full text-xs font-semibold">
                    Apply Filters
                  </Button>
                  {activeCount > 0 && (
                    <Button variant="ghost" onClick={onResetFilters} className="text-xs">
                      Reset
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 hidden sm:inline-flex"
            >
              <RotateCcw className="size-3" />
              <span>Clear All</span>
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Filter Controls */}
      <div className="hidden sm:block pt-1">{filterControls}</div>

      {/* ACTIVE FILTER CHIPS ROW */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/60">
          <span className="text-[11px] font-semibold text-muted-foreground mr-1">Active:</span>

          {filters.searchQuery && (
            <Badge variant="outline" className="text-[11px] gap-1 px-2 py-0.5 rounded-lg border-primary/30 bg-primary/5">
              <span>Query: &ldquo;{filters.searchQuery}&rdquo;</span>
              <button
                type="button"
                onClick={() => onFilterChange("searchQuery", "")}
                className="hover:text-destructive p-0.5 cursor-pointer"
                aria-label="Remove query filter"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {selectedDepartmentName && (
            <Badge variant="outline" className="text-[11px] gap-1 px-2 py-0.5 rounded-lg border-border/80 bg-muted/30">
              <Building className="size-3 text-primary" />
              <span className="truncate max-w-[160px]">{selectedDepartmentName}</span>
              <button
                type="button"
                onClick={() => onFilterChange("departmentId", "ALL")}
                className="hover:text-destructive p-0.5 cursor-pointer"
                aria-label="Remove department filter"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {filters.year !== "ALL" && (
            <Badge variant="outline" className="text-[11px] gap-1 px-2 py-0.5 rounded-lg border-border/80 bg-muted/30">
              <GraduationCap className="size-3 text-primary" />
              <span>Year {filters.year}</span>
              <button
                type="button"
                onClick={() => onFilterChange("year", "ALL")}
                className="hover:text-destructive p-0.5 cursor-pointer"
                aria-label="Remove year filter"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {selectedAvailabilityLabel && (
            <Badge variant="outline" className="text-[11px] gap-1 px-2 py-0.5 rounded-lg border-border/80 bg-muted/30">
              <Clock className="size-3 text-emerald-500" />
              <span>{selectedAvailabilityLabel}</span>
              <button
                type="button"
                onClick={() => onFilterChange("availability", "ALL")}
                className="hover:text-destructive p-0.5 cursor-pointer"
                aria-label="Remove availability filter"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {selectedExpLabel && (
            <Badge variant="outline" className="text-[11px] gap-1 px-2 py-0.5 rounded-lg border-border/80 bg-muted/30">
              <Briefcase className="size-3 text-primary" />
              <span>{selectedExpLabel}</span>
              <button
                type="button"
                onClick={() => onFilterChange("minExperience", "ALL")}
                className="hover:text-destructive p-0.5 cursor-pointer"
                aria-label="Remove experience filter"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {filters.verificationOnly && (
            <Badge variant="success" className="text-[11px] gap-1 px-2 py-0.5 rounded-lg">
              <ShieldCheck className="size-3" />
              <span>Verified Only</span>
              <button
                type="button"
                onClick={() => onFilterChange("verificationOnly", false)}
                className="hover:text-destructive p-0.5 cursor-pointer"
                aria-label="Remove verified only filter"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-6 px-2 text-[11px] text-muted-foreground hover:text-destructive"
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  )
}
