"use client"

import * as React from "react"
import { useState, useTransition, useMemo, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Compass,
  Award,
  Layers,
  Flame,
  PlusCircle,
  Sparkles,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CandidateCard, type Candidate } from "./candidate-card"
import { DiscoveryFilters, type FilterState } from "./discovery-filters"
import { InviteModal } from "./invite-modal"
import { getMatchedCandidatesForRole } from "@/app/actions/matching"
import { toast } from "sonner"

export interface ActiveRole {
  id: string
  name: string
  seatsRequired: number
  remainingSeats: number
  status: string
  teamId: string
  teamName: string
  eventName: string
  requiredSkills: Array<{ id: string; name: string }>
  preferredSkills: Array<{ id: string; name: string }>
}

interface DiscoveryClientProps {
  initialRoles: ActiveRole[]
  departments: Array<{ id: string; name: string }>
  preselectedRoleId?: string
  preselectedCandidateId?: string
}

function CandidateCardSkeleton() {
  return (
    <Card className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl bg-muted" />
          <div className="space-y-1.5">
            <div className="h-4 w-28 bg-muted rounded" />
            <div className="h-3 w-16 bg-muted rounded" />
          </div>
        </div>
        <div className="h-6 w-24 bg-muted rounded-full" />
      </div>

      <div className="h-3 w-48 bg-muted rounded" />

      <div className="space-y-2 pt-2 border-t border-border/60">
        <div className="h-3 w-32 bg-muted rounded" />
        <div className="flex gap-1.5">
          <div className="h-6 w-16 bg-muted rounded-md" />
          <div className="h-6 w-20 bg-muted rounded-md" />
          <div className="h-6 w-14 bg-muted rounded-md" />
        </div>
      </div>

      <div className="h-16 bg-muted/60 rounded-xl" />

      <div className="flex justify-between pt-2 border-t border-border/60">
        <div className="h-8 w-20 bg-muted rounded" />
        <div className="h-8 w-28 bg-muted rounded" />
      </div>
    </Card>
  )
}

export function DiscoveryClient({
  initialRoles,
  departments,
  preselectedRoleId,
  preselectedCandidateId,
}: DiscoveryClientProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>(
    preselectedRoleId || (initialRoles.length > 0 ? initialRoles[0].id : "")
  )

  const [candidates, setCandidates] = useState<{
    EXACT: Candidate[]
    RELATED: Candidate[]
    INTEREST_ONLY: Candidate[]
  }>({
    EXACT: [],
    RELATED: [],
    INTEREST_ONLY: [],
  })

  const [isLoading, startTransition] = useTransition()
  const [invitedCandidateIds, setInvitedCandidateIds] = useState<Set<string>>(new Set())

  // Modal State
  const [selectedCandidateForInvite, setSelectedCandidateForInvite] = useState<Candidate | null>(null)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const hasTriggeredPreselectedRef = React.useRef(false)

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    departmentId: "ALL",
    year: "ALL",
    availability: "ALL",
    minExperience: "ALL",
    verificationOnly: false,
  })

  // Selected Role Object
  const selectedRole = useMemo(() => {
    return initialRoles.find((r) => r.id === selectedRoleId) || null
  }, [initialRoles, selectedRoleId])

  // Load Candidates when role changes
  React.useEffect(() => {
    if (!selectedRoleId) return

    startTransition(async () => {
      try {
        const res = await getMatchedCandidatesForRole(selectedRoleId)
        setCandidates({
          EXACT: res.EXACT || [],
          RELATED: res.RELATED || [],
          INTEREST_ONLY: res.INTEREST_ONLY || [],
        })
      } catch {
        toast.error("Failed to load candidates for role")
      }
    })
  }, [selectedRoleId])

  // Filter application without changing backend intra-tier order
  const applyFilters = useCallback(
    (list: Candidate[]) => {
      return list.filter((c) => {
        // Keyword Search Filter
        if (filters.searchQuery.trim().length > 0) {
          const q = filters.searchQuery.toLowerCase().trim()
          const matchName = c.name.toLowerCase().includes(q)
          const matchUsername = c.username.toLowerCase().includes(q)
          const matchBio = c.bio?.toLowerCase().includes(q)
          const matchDept = c.department?.name.toLowerCase().includes(q)
          const matchSkills = c.matchedRequiredSkills.some((s) => s.name.toLowerCase().includes(q)) ||
            c.matchedRelatedSkills.some((s) => s.name.toLowerCase().includes(q)) ||
            c.matchedInterests.some((i) => i.name.toLowerCase().includes(q))

          if (!matchName && !matchUsername && !matchBio && !matchDept && !matchSkills) {
            return false
          }
        }

        // Department Filter
        if (filters.departmentId !== "ALL" && c.department?.id !== filters.departmentId) {
          return false
        }

        // Academic Year Filter
        if (filters.year !== "ALL" && String(c.year) !== filters.year) {
          return false
        }

        // Availability Filter
        if (filters.availability !== "ALL" && c.availability !== filters.availability) {
          return false
        }

        // Minimum Experience Filter
        if (filters.minExperience !== "ALL") {
          const expRank: Record<string, number> = { BEGINNER: 1, SOME_EXPERIENCE: 2, EXPERIENCED: 3 }
          const candRank = expRank[c.experienceLevel] || 1
          const requiredRank = expRank[filters.minExperience] || 1
          if (candRank < requiredRank) return false
        }

        // Verification Only Filter
        if (filters.verificationOnly && c.verificationStatus !== "APPROVED") {
          return false
        }

        return true
      })
    },
    [filters]
  )

  const filteredExact = useMemo(() => applyFilters(candidates.EXACT), [candidates.EXACT, applyFilters])
  const filteredRelated = useMemo(() => applyFilters(candidates.RELATED), [candidates.RELATED, applyFilters])
  const filteredInterest = useMemo(
    () => applyFilters(candidates.INTEREST_ONLY),
    [candidates.INTEREST_ONLY, applyFilters]
  )

  const totalFilteredCount = filteredExact.length + filteredRelated.length + filteredInterest.length

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleResetFilters = () => {
    setFilters({
      searchQuery: "",
      departmentId: "ALL",
      year: "ALL",
      availability: "ALL",
      minExperience: "ALL",
      verificationOnly: false,
    })
  }

  const handleOpenInvite = (candidate: Candidate) => {
    setSelectedCandidateForInvite(candidate)
    setIsInviteModalOpen(true)
  }

  const handleInviteSent = (candidateId: string) => {
    setInvitedCandidateIds((prev) => new Set([...prev, candidateId]))
  }

  // Preselected Candidate Handling via timer callback
  React.useEffect(() => {
    if (!preselectedCandidateId || hasTriggeredPreselectedRef.current) return
    const allCandidates = [
      ...candidates.EXACT,
      ...candidates.RELATED,
      ...candidates.INTEREST_ONLY,
    ]
    const matched = allCandidates.find((c) => c.id === preselectedCandidateId)
    if (matched) {
      hasTriggeredPreselectedRef.current = true
      const timer = setTimeout(() => {
        setSelectedCandidateForInvite(matched)
        setIsInviteModalOpen(true)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [candidates, preselectedCandidateId])

  // NO ACTIVE ROLES EMPTY STATE
  if (initialRoles.length === 0) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-8">
        <Card className="border-border/80 bg-card shadow-xs rounded-2xl p-6 sm:p-10 text-center space-y-6">
          <div className="relative mx-auto w-full max-w-md aspect-4/3 rounded-2xl overflow-hidden border border-border/80 shadow-sm bg-muted">
            <Image
              src="/images/discovery-match.jpg"
              alt="Team skill matching and role recruitment"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 480px"
              priority
            />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Compass className="size-3.5" />
              <span>Role-Anchored Discovery</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              No Active Recruitment Roles
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Teammate Discovery matches candidates against your open team roles. Create a recruitment role specifying required skills, experience, and seat requirements to activate deterministic matching.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="default" className="gap-2 font-semibold shadow-xs w-full sm:w-auto">
              <Link href="/teams/create">
                <PlusCircle className="size-4" />
                <span>Create a Team</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="default" className="w-full sm:w-auto">
              <Link href="/teams">Browse Existing Teams</Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Header & Role Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" />
            <span>Deterministic Role Matching Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Find Teammates
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Browse qualified builders ranked by exact skill coverage, portfolio evidence, and institutional verification.
          </p>
        </div>

        {/* Role Selector Picker */}
        <div className="w-full sm:w-80 space-y-1.5 shrink-0">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Matching For Role:</span>
            <span className="text-primary font-mono lowercase">{initialRoles.length} active</span>
          </label>
          <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
            <SelectTrigger className="h-10 font-medium rounded-xl bg-card border-border/80">
              <SelectValue placeholder="Choose role..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {initialRoles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  <div className="text-left">
                    <span className="font-semibold text-foreground block">{role.name}</span>
                    <span className="text-muted-foreground text-[11px] block truncate">
                      {role.teamName} · {role.remainingSeats} seat{role.remainingSeats !== 1 ? "s" : ""} open
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selected Role Context Banner */}
      {selectedRole && (
        <Card className="border-border/80 bg-gradient-to-r from-muted/30 via-card to-primary/5 shadow-xs rounded-2xl">
          <CardContent className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-base text-foreground">{selectedRole.teamName}</span>
                <span className="text-muted-foreground">·</span>
                <Badge variant="outline" className="text-xs font-semibold text-primary">
                  {selectedRole.name}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {selectedRole.remainingSeats} of {selectedRole.seatsRequired} Seats Open
                </Badge>
                {selectedRole.eventName && (
                  <Badge variant="outline" className="text-[11px] text-muted-foreground">
                    Event: {selectedRole.eventName}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-foreground">Required Skills:</span>
                  {selectedRole.requiredSkills.map((s) => (
                    <Badge key={s.id} variant="exact" className="text-[10px] px-1.5 py-0">
                      {s.name}
                    </Badge>
                  ))}
                  {selectedRole.requiredSkills.length === 0 && (
                    <span className="italic text-muted-foreground">None specified</span>
                  )}
                </div>

                {selectedRole.preferredSkills.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-foreground">Preferred:</span>
                    {selectedRole.preferredSkills.map((s) => (
                      <Badge key={s.id} variant="outline" className="text-[10px] px-1.5 py-0">
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Match Count Badges */}
            <div className="flex items-center gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/60">
              <div className="text-center px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 min-w-[72px]">
                <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-300 font-mono">
                  {candidates.EXACT.length}
                </div>
                <div className="text-[10px] uppercase font-semibold text-emerald-800 dark:text-emerald-400">
                  Exact
                </div>
              </div>

              <div className="text-center px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 min-w-[72px]">
                <div className="text-base font-extrabold text-blue-700 dark:text-blue-300 font-mono">
                  {candidates.RELATED.length}
                </div>
                <div className="text-[10px] uppercase font-semibold text-blue-800 dark:text-blue-400">
                  Related
                </div>
              </div>

              <div className="text-center px-3 py-1.5 rounded-xl bg-slate-500/10 border border-slate-500/30 min-w-[72px]">
                <div className="text-base font-extrabold text-slate-700 dark:text-slate-300 font-mono">
                  {candidates.INTEREST_ONLY.length}
                </div>
                <div className="text-[10px] uppercase font-semibold text-slate-800 dark:text-slate-400">
                  Interest
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Toolbar */}
      <DiscoveryFilters
        filters={filters}
        departments={departments}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalResultsCount={totalFilteredCount}
      />

      {/* Loading State Skeletons */}
      {isLoading && (
        <div className="space-y-4">
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <CandidateCardSkeleton />
            <CandidateCardSkeleton />
            <CandidateCardSkeleton />
            <CandidateCardSkeleton />
            <CandidateCardSkeleton />
            <CandidateCardSkeleton />
          </div>
        </div>
      )}

      {/* Candidate Results Grid Grouped by Match Tier */}
      {!isLoading && (
        <div className="space-y-10">
          {totalFilteredCount === 0 ? (
            <div className="py-16 text-center border border-dashed border-border/80 rounded-2xl p-8 space-y-3 bg-card">
              <Search className="size-8 mx-auto text-muted-foreground/60" />
              <h3 className="text-base font-bold text-foreground">No Candidates Matched Your Filters</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No qualified teammates match the active filters for {selectedRole?.name}. Try clearing some filters or searching for related skills.
              </p>
              <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
                Reset All Filters
              </Button>
            </div>
          ) : (
            <>
              {/* TIER 1: EXACT MATCHES */}
              {filteredExact.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-emerald-500/30 pb-2">
                    <Award className="size-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Tier 1: Exact Matches</h2>
                      <p className="text-xs text-muted-foreground">
                        Candidates possessing required skills for this role, ranked by project experience and availability.
                      </p>
                    </div>
                    <Badge variant="exact" className="ml-auto text-xs">
                      {filteredExact.length} candidate{filteredExact.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredExact.map((candidate) => (
                      <CandidateCard
                        key={candidate.id}
                        candidate={candidate}
                        activeRoleId={selectedRole?.id}
                        roleRequiredSkills={selectedRole?.requiredSkills}
                        rolePreferredSkills={selectedRole?.preferredSkills}
                        onInviteClick={handleOpenInvite}
                        isAlreadyInvited={invitedCandidateIds.has(candidate.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* TIER 2: RELATED MATCHES */}
              {filteredRelated.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-blue-500/30 pb-2">
                    <Layers className="size-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Tier 2: Related Matches</h2>
                      <p className="text-xs text-muted-foreground">
                        Candidates with transferable taxonomy skills (e.g. PyTorch ~ TensorFlow).
                      </p>
                    </div>
                    <Badge variant="related" className="ml-auto text-xs">
                      {filteredRelated.length} candidate{filteredRelated.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredRelated.map((candidate) => (
                      <CandidateCard
                        key={candidate.id}
                        candidate={candidate}
                        activeRoleId={selectedRole?.id}
                        roleRequiredSkills={selectedRole?.requiredSkills}
                        rolePreferredSkills={selectedRole?.preferredSkills}
                        onInviteClick={handleOpenInvite}
                        isAlreadyInvited={invitedCandidateIds.has(candidate.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* TIER 3: INTEREST ONLY MATCHES */}
              {filteredInterest.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-500/30 pb-2">
                    <Flame className="size-5 text-slate-500" />
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Tier 3: Domain Interests</h2>
                      <p className="text-xs text-muted-foreground">
                        Candidates who have declared interest in this stack and are seeking hackathon growth opportunities.
                      </p>
                    </div>
                    <Badge variant="interest" className="ml-auto text-xs">
                      {filteredInterest.length} candidate{filteredInterest.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredInterest.map((candidate) => (
                      <CandidateCard
                        key={candidate.id}
                        candidate={candidate}
                        activeRoleId={selectedRole?.id}
                        roleRequiredSkills={selectedRole?.requiredSkills}
                        rolePreferredSkills={selectedRole?.preferredSkills}
                        onInviteClick={handleOpenInvite}
                        isAlreadyInvited={invitedCandidateIds.has(candidate.id)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {/* Invite Modal Dialog */}
      {selectedCandidateForInvite && selectedRole && (
        <InviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          candidate={selectedCandidateForInvite}
          role={selectedRole}
          onInviteSent={handleInviteSent}
        />
      )}
    </div>
  )
}
