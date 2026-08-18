"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Users,
  Search,
  Filter,
  PlusCircle,
  RotateCcw,
  Sparkles,
  Layers,
  Calendar,
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
import { TeamCard, type DiscoverableTeam } from "./team-card"

interface TeamsCatalogClientProps {
  initialTeams: DiscoverableTeam[]
  events: Array<{ id: string; name: string }>
  availableSkills: Array<{ id: string; name: string }>
}

export function TeamsCatalogClient({
  initialTeams,
  events,
  availableSkills,
}: TeamsCatalogClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEventId, setSelectedEventId] = useState<string>("ALL")
  const [selectedSkillId, setSelectedSkillId] = useState<string>("ALL")
  const [onlyOpenSeats, setOnlyOpenSeats] = useState<string>("ALL")

  const filteredTeams = useMemo(() => {
    return initialTeams.filter((team) => {
      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesName = team.name.toLowerCase().includes(query)
        const matchesDesc = team.description.toLowerCase().includes(query)
        const matchesSkill = team.skillTags.some((s) => s.name.toLowerCase().includes(query))
        const matchesRole = team.openRoles.some((r) => r.name.toLowerCase().includes(query))
        if (!matchesName && !matchesDesc && !matchesSkill && !matchesRole) {
          return false
        }
      }

      // Event Filter
      if (selectedEventId !== "ALL" && team.event?.id !== selectedEventId) {
        return false
      }

      // Skill Filter
      if (selectedSkillId !== "ALL" && !team.skillTags.some((s) => s.id === selectedSkillId)) {
        return false
      }

      // Open Seats Filter
      if (onlyOpenSeats === "OPEN_ONLY" && team.totalSeatsRemaining === 0) {
        return false
      }

      return true
    })
  }, [initialTeams, searchQuery, selectedEventId, selectedSkillId, onlyOpenSeats])

  const activeFilterCount =
    (searchQuery.trim() ? 1 : 0) +
    (selectedEventId !== "ALL" ? 1 : 0) +
    (selectedSkillId !== "ALL" ? 1 : 0) +
    (onlyOpenSeats !== "ALL" ? 1 : 0)

  const handleResetFilters = () => {
    setSearchQuery("")
    setSelectedEventId("ALL")
    setSelectedSkillId("ALL")
    setOnlyOpenSeats("ALL")
  }

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative rounded-3xl border border-border/80 bg-gradient-to-r from-card via-card to-emerald-500/5 p-6 sm:p-8 overflow-hidden shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Sparkles className="size-3.5" />
              <span>Explore Teams & Open Recruitment</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Find Your Next Team
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Discover hackathon teams actively recruiting members. Evaluate open role requirements, stack alignment, and submit your application in one click.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button asChild size="lg" className="gap-2 font-bold shadow-xs">
              <Link href="/teams/create">
                <PlusCircle className="size-4" />
                <span>Create a Team</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teams by name, skill, or role..."
              className="pl-9 h-10 text-xs"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Showing <strong>{filteredTeams.length}</strong> of {initialTeams.length} teams
            </span>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <RotateCcw className="size-3" />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-border/50">
          {/* Event Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Calendar className="size-3" />
              <span>Event</span>
            </label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Events</SelectItem>
                {events.map((evt) => (
                  <SelectItem key={evt.id} value={evt.id}>
                    {evt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Skill Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Layers className="size-3" />
              <span>Required Skill</span>
            </label>
            <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Skills" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Skills</SelectItem>
                {availableSkills.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seat Availability */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Filter className="size-3" />
              <span>Recruitment Status</span>
            </label>
            <Select value={onlyOpenSeats} onValueChange={setOnlyOpenSeats}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Teams</SelectItem>
                <SelectItem value="OPEN_ONLY">Actively Recruiting (Open Seats)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      {filteredTeams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      ) : initialTeams.length === 0 ? (
        <div className="rounded-3xl border border-border/80 bg-card p-10 text-center space-y-5 max-w-2xl mx-auto shadow-xs">
          <div className="relative mx-auto w-full max-w-sm aspect-16/9 rounded-2xl overflow-hidden border border-border bg-muted">
            <Image
              src="/images/team-collaboration.jpg"
              alt="Team Collaboration"
              fill
              className="object-cover"
              sizes="400px"
              priority
            />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">No Teams Created Yet</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Be the first to create a team, select an upcoming hackathon, and open recruitment roles to find teammates.
            </p>
          </div>
          <Button asChild size="default" className="gap-2 font-bold shadow-xs">
            <Link href="/teams/create">
              <PlusCircle className="size-4" />
              <span>Create the First Team</span>
            </Link>
          </Button>
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-border rounded-3xl p-8 space-y-3">
          <Users className="size-8 mx-auto text-muted-foreground/60" />
          <h3 className="text-base font-bold text-foreground">No Teams Match Filters</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search query, event, or skill filter to discover more teams.
          </p>
          <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  )
}
