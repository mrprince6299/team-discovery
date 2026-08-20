"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Layers,
  Search,
  Users,
  ExternalLink,
  Eye,
  Crown,
  UserCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TeamItem {
  id: string
  name: string
  description: string
  status: string
  eventName: string
  eventId: string | null
  leader: {
    id: string
    name: string
    username: string
    avatarUrl: string | null
    isVerified: boolean
  } | null
  memberCount: number
  totalSeats: number
  members: Array<{
    id: string
    name: string
    username: string
    avatarUrl: string | null
    roleName: string
    membershipRole: string
    isVerified: boolean
  }>
  roles: Array<{
    id: string
    name: string
    status: string
    seatsRequired: number
    filledSeats: number
    skills: string[]
  }>
  pendingApplicationsCount: number
  pendingInvitationsCount: number
}

interface AdminTeamsClientProps {
  initialTeams: TeamItem[]
  initialCounts: {
    total: number
    active: number
    full: number
    closed: number
    draft: number
  }
}

export function AdminTeamsClient({ initialTeams, initialCounts }: AdminTeamsClientProps) {
  const [teams] = useState<TeamItem[]>(initialTeams)
  const [counts] = useState(initialCounts)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [selectedTeam, setSelectedTeam] = useState<TeamItem | null>(null)

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = t.name.toLowerCase().includes(q)
        const matchDesc = t.description.toLowerCase().includes(q)
        const matchEvent = t.eventName.toLowerCase().includes(q)
        const matchLeader = t.leader?.name.toLowerCase().includes(q) || false
        if (!matchName && !matchDesc && !matchEvent && !matchLeader) {
          return false
        }
      }
      return true
    })
  }, [teams, statusFilter, searchQuery])

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/admin" className="hover:text-foreground">Admin Console</Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Squad Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Team &amp; Squad Management
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Monitor squad compositions, leadership, recruitment roles, and event participation.
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card
          onClick={() => setStatusFilter("ALL")}
          className={`cursor-pointer border transition-all rounded-xl p-4 space-y-1 ${
            statusFilter === "ALL" ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border/80 bg-card hover:bg-muted/20"
          }`}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total Squads
          </span>
          <div className="text-2xl font-extrabold text-foreground font-mono">{counts.total}</div>
        </Card>

        <Card
          onClick={() => setStatusFilter("ACTIVE")}
          className={`cursor-pointer border transition-all rounded-xl p-4 space-y-1 ${
            statusFilter === "ACTIVE" ? "border-sky-500 bg-sky-500/10 ring-1 ring-sky-500/30" : "border-border/80 bg-card hover:bg-muted/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Active / Forming
            </span>
            <Layers className="size-3.5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold text-foreground font-mono">{counts.active}</div>
        </Card>

        <Card
          onClick={() => setStatusFilter("FULL")}
          className={`cursor-pointer border transition-all rounded-xl p-4 space-y-1 ${
            statusFilter === "FULL" ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30" : "border-border/80 bg-card hover:bg-muted/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Full Squads
            </span>
            <UserCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-foreground font-mono">{counts.full}</div>
        </Card>

        <Card
          onClick={() => setStatusFilter("CLOSED")}
          className={`cursor-pointer border transition-all rounded-xl p-4 space-y-1 ${
            statusFilter === "CLOSED" ? "border-muted-foreground bg-muted/40 ring-1 ring-border" : "border-border/80 bg-card hover:bg-muted/20"
          }`}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Closed / Completed
          </span>
          <div className="text-2xl font-extrabold text-foreground font-mono">{counts.closed}</div>
        </Card>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-2xl border border-border/80">
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-4 bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="ALL" className="text-xs font-semibold rounded-lg">
              All ({counts.total})
            </TabsTrigger>
            <TabsTrigger value="ACTIVE" className="text-xs font-semibold rounded-lg">
              Active ({counts.active})
            </TabsTrigger>
            <TabsTrigger value="FULL" className="text-xs font-semibold rounded-lg">
              Full ({counts.full})
            </TabsTrigger>
            <TabsTrigger value="CLOSED" className="text-xs font-semibold rounded-lg">
              Closed ({counts.closed})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search squad name, event, leader..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8.5 h-9 text-xs rounded-xl bg-background border-border/80"
          />
        </div>
      </div>

      {/* Teams List */}
      {filteredTeams.length === 0 ? (
        <Card className="border-border/80 rounded-2xl p-12 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="size-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Layers className="size-6" />
            </div>
            <h3 className="font-bold text-base text-foreground">No squads found</h3>
            <p className="text-xs text-muted-foreground">
              {searchQuery ? `No squad matches "${searchQuery}".` : "No teams in this category."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTeams.map((team) => (
            <Card
              key={team.id}
              className="border-border/80 bg-card rounded-2xl shadow-sm hover:border-primary/40 transition-colors"
            >
              <CardContent className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Info */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-foreground truncate">{team.name}</span>
                    <Badge
                      variant={
                        team.status === "ACTIVE"
                          ? "default"
                          : team.status === "FULL"
                          ? "success"
                          : "outline"
                      }
                      className="text-[10px] uppercase font-semibold py-0 px-2"
                    >
                      {team.status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] py-0 px-2 text-muted-foreground">
                      {team.eventName}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-1 max-w-2xl">
                    {team.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                    {team.leader && (
                      <div className="flex items-center gap-1.5">
                        <Crown className="size-3 text-amber-500 shrink-0" />
                        <span className="font-medium text-foreground">{team.leader.name}</span>
                        <span className="text-[11px] font-mono text-muted-foreground">(@{team.leader.username})</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Users className="size-3 text-primary shrink-0" />
                      <span>{team.memberCount} / {team.totalSeats} members</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{team.roles.length} roles defined</span>
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center border-t lg:border-t-0 pt-3 lg:pt-0 w-full lg:w-auto justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTeam(team)}
                    className="gap-1.5 text-xs font-medium"
                  >
                    <Eye className="size-3.5" />
                    <span>Inspect Squad</span>
                  </Button>

                  <Button asChild variant="ghost" size="sm" className="h-8 px-2.5 text-xs text-primary">
                    <Link href={`/teams/${team.id}`} target="_blank">
                      <ExternalLink className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Team Inspect Modal */}
      <Dialog open={!!selectedTeam} onOpenChange={(open) => !open && setSelectedTeam(null)}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          {selectedTeam && (
            <div className="space-y-6">
              <DialogHeader className="pb-3 border-b border-border/60">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                      <span>{selectedTeam.name}</span>
                      <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                        {selectedTeam.status}
                      </Badge>
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      Affiliated Event: {selectedTeam.eventName}
                    </DialogDescription>
                  </div>

                  <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-primary">
                    <Link href={`/teams/${selectedTeam.id}`} target="_blank">
                      <span>Squad Page</span>
                      <ExternalLink className="size-3" />
                    </Link>
                  </Button>
                </div>
              </DialogHeader>

              {/* Detail Sections */}
              <div className="space-y-4 text-xs">
                {/* 1. Squad Overview */}
                <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-2">
                  <span className="font-bold text-foreground text-xs uppercase tracking-wider block">
                    Squad Overview
                  </span>
                  <p className="text-foreground leading-relaxed">{selectedTeam.description}</p>
                </div>

                {/* 2. Members */}
                <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-2">
                  <span className="font-bold text-foreground text-xs uppercase tracking-wider block">
                    Roster ({selectedTeam.members.length} Members)
                  </span>
                  <div className="divide-y divide-border/60">
                    {selectedTeam.members.map((member) => (
                      <div key={member.id} className="py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-7 rounded-lg border border-border">
                            <AvatarImage src={member.avatarUrl ?? undefined} alt={member.name} />
                            <AvatarFallback className="text-[10px] font-bold">
                              {member.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-semibold text-foreground">{member.name}</span>
                            <span className="text-muted-foreground font-mono text-[11px] ml-1.5">
                              @{member.username}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {member.roleName}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Recruitment Roles */}
                <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-2">
                  <span className="font-bold text-foreground text-xs uppercase tracking-wider block">
                    Recruitment Roles ({selectedTeam.roles.length})
                  </span>
                  <div className="space-y-2 pt-1">
                    {selectedTeam.roles.map((r) => (
                      <div key={r.id} className="p-3 rounded-lg bg-background border border-border/60 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">{r.name}</span>
                          <span className="text-muted-foreground font-mono text-[11px]">
                            {r.filledSeats} / {r.seatsRequired} seats filled
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {r.skills.map((s) => (
                            <Badge key={s} variant="secondary" className="text-[10px] py-0 px-1.5">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="flex justify-end pt-2 border-t border-border/60">
                <Button variant="outline" size="sm" onClick={() => setSelectedTeam(null)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
