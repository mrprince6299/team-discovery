"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import {
  Users,
  Calendar,
  Layers,
  ArrowLeft,
  Crown,
  Star,
  ExternalLink,
  Compass,
  CheckCircle2,
  MessageSquare,
  PlusCircle,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookmarkButton } from "@/components/bookmarks/bookmark-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RoleCard, type TeamRoleDetails } from "./role-card"
import { ApplyModal } from "./apply-modal"
import { RoleManagementDialog } from "./role-management-dialog"
import { LeaveTeamDialog } from "./leave-team-dialog"
import { TransferLeadershipDialog, type EligibleMember } from "./transfer-leadership-dialog"

interface TeamMemberDetails {
  id: string
  userId: string
  membershipRole: string
  assignedRoleName?: string | null
  joinedAt: Date
  user: {
    id: string
    name: string
    username: string
    profilePhoto?: string | null
    year?: number | null
    bio?: string | null
    department?: { id: string; name: string } | null
    avgRating?: number | null
    ratingsCount: number
    topSkills: Array<{ id: string; name: string; level: string }>
  }
}

interface TeamDetailsClientProps {
  team: {
    id: string
    name: string
    description: string
    status: string
    event?: {
      id: string
      name: string
      description?: string | null
      bannerUrl?: string | null
      registrationDeadline?: Date | null
      status?: string
    } | null
    leader?: {
      id: string
      name: string
      username: string
      profilePhoto?: string | null
      department?: { id: string; name: string } | null
    } | null
    isCurrentLeader: boolean
    isCurrentMember: boolean
    hasPendingApplication: boolean
    userActiveInOtherEventTeam: boolean
    members: TeamMemberDetails[]
    roles: TeamRoleDetails[]
  }
}

export function TeamDetailsClient({ team }: TeamDetailsClientProps) {
  const [selectedRoleForApply, setSelectedRoleForApply] = useState<TeamRoleDetails | null>(null)
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false)
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [transferTargetMemberId, setTransferTargetMemberId] = useState<string | undefined>(undefined)
  const [hasAppliedLocally, setHasAppliedLocally] = useState(false)

  const eligibleMembers: EligibleMember[] = team.members
    .filter((m) => m.membershipRole !== "LEADER")
    .map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      username: m.user.username,
      membershipRole: m.membershipRole,
      profilePhoto: m.user.profilePhoto,
    }))

  const activeRoles = team.roles.filter(
    (r) => ["ACTIVE", "PARTIALLY_FILLED"].includes(r.status) && !r.isExpired
  )

  const isFull = team.status === "FULL" || activeRoles.length === 0
  const isPendingApp = team.hasPendingApplication || hasAppliedLocally

  const handleOpenApply = (role: TeamRoleDetails) => {
    setSelectedRoleForApply(role)
    setIsApplyModalOpen(true)
  }

  const handleApplicationSubmitted = () => {
    setHasAppliedLocally(true)
  }

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
          <Link href="/teams">
            <ArrowLeft className="size-3.5" />
            <span>Back to Teams Catalog</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2 flex-wrap">
          {(team.isCurrentMember || team.isCurrentLeader) && (
            <Button asChild size="sm" variant="outline" className="gap-1.5 font-semibold border-primary/40 text-primary hover:bg-primary/10">
              <Link href={`/teams/${team.id}/workspace`}>
                <MessageSquare className="size-3.5" />
                <span>Open Collaboration Workspace</span>
              </Link>
            </Button>
          )}

          {team.isCurrentLeader && activeRoles.length > 0 && (
            <Button asChild size="sm" className="gap-1.5 font-bold shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              <Link href={`/discover?role=${activeRoles[0].id}`}>
                <Compass className="size-3.5" />
                <span>Find Teammates via Discovery</span>
              </Link>
            </Button>
          )}

          <BookmarkButton
            targetType="TEAM"
            targetId={team.id}
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 font-medium border-border/80"
            showLabel
          />
        </div>
      </div>

      {/* Team Header Profile Card */}
      <Card className="rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card to-muted/20 shadow-xs overflow-hidden">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                {team.event ? (
                  <Badge variant="outline" className="text-xs font-semibold text-primary">
                    <Calendar className="size-3 mr-1" />
                    <span>{team.event.name}</span>
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    General Hackathon Team
                  </Badge>
                )}

                <Badge
                  variant={isFull ? "secondary" : "exact"}
                  className="text-xs font-bold uppercase tracking-wider"
                >
                  {isFull ? "Team Full" : `${activeRoles.length} Open Role${activeRoles.length !== 1 ? "s" : ""}`}
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {team.name}
              </h1>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {team.description}
              </p>
            </div>

            {/* Quick Status Stats */}
            <div className="flex flex-row md:flex-col items-center md:items-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/60">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold text-foreground shadow-2xs">
                <Users className="size-3.5 text-primary" />
                <span>{team.members.length} Active Member{team.members.length !== 1 ? "s" : ""}</span>
              </div>

              {team.isCurrentMember && (
                <div className="flex items-center gap-2">
                  <Badge variant="exact" className="text-xs font-bold gap-1">
                    <CheckCircle2 className="size-3" />
                    <span>{team.isCurrentLeader ? "Team Leader" : "Active Member"}</span>
                  </Badge>
                  {!team.isCurrentLeader && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsLeaveDialogOpen(true)}
                      className="h-6 px-2 text-[11px] font-semibold text-destructive hover:bg-destructive/10 border-destructive/30 hover:border-destructive/50 gap-1 shadow-2xs"
                    >
                      <LogOut className="size-2.5" />
                      <span>Leave Squad</span>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid: Left: Open Roles, Right: Team Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Open Recruitment Roles */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="space-y-0.5">
              <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <Layers className="size-5 text-primary" />
                <span>Open Recruitment Roles</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Apply to join this team. Applications are evaluated based on verified skills and portfolio.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {team.roles.length} total role{team.roles.length !== 1 ? "s" : ""}
              </Badge>
              {team.isCurrentLeader && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setIsCreateRoleModalOpen(true)}
                  className="h-8 text-xs font-semibold gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                >
                  <PlusCircle className="size-3.5" />
                  <span>Add Role</span>
                </Button>
              )}
            </div>
          </div>

          {team.roles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {team.roles.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  teamId={team.id}
                  onApplyClick={handleOpenApply}
                  isCurrentMember={team.isCurrentMember}
                  isCurrentLeader={team.isCurrentLeader}
                  hasPendingApplication={isPendingApp}
                  userActiveInOtherEventTeam={team.userActiveInOtherEventTeam}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-foreground">No recruitment roles currently open</p>
              <p className="text-xs text-muted-foreground">Check back later as new positions may open.</p>
            </div>
          )}
        </div>

        {/* Right 1 Col: Active Team Roster */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="space-y-0.5">
              <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <Users className="size-5 text-emerald-500" />
                <span>Team Roster</span>
              </h2>
              <p className="text-xs text-muted-foreground">Active members and leaders.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {team.members.length}
              </Badge>
              {team.isCurrentLeader && eligibleMembers.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTransferTargetMemberId(undefined)
                    setIsTransferModalOpen(true)
                  }}
                  className="h-7 text-xs font-semibold gap-1 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                >
                  <Crown className="size-3 text-amber-500" />
                  <span>Transfer Leadership</span>
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {team.members.map((member) => {
              const isLeader = member.membershipRole === "LEADER"
              const initials = member.user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)

              return (
                <Card key={member.id} className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
                  <div className="flex items-start gap-3">
                    <Avatar className="size-11 rounded-xl border border-border shadow-2xs shrink-0">
                      <AvatarImage src={member.user.profilePhoto || undefined} alt={member.user.name} />
                      <AvatarFallback className="font-bold text-xs bg-muted">{initials}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-sm text-foreground truncate">{member.user.name}</h4>
                        {isLeader ? (
                          <Badge variant="exact" className="text-[10px] font-bold px-1.5 py-0 gap-1">
                            <Crown className="size-2.5" />
                            <span>Leader</span>
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {member.assignedRoleName || "Member"}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground truncate">
                        @{member.user.username} {member.user.department ? `· ${member.user.department.name}` : ""}
                      </p>

                      {member.user.avgRating && (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-foreground pt-0.5">
                          <Star className="size-3 fill-amber-400 text-amber-500" />
                          <span>{member.user.avgRating}</span>
                          <span className="text-[10px] text-muted-foreground">
                            ({member.user.ratingsCount} reviews)
                          </span>
                        </div>
                      )}

                      {/* Top Skills Preview */}
                      {member.user.topSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {member.user.topSkills.slice(0, 3).map((s) => (
                            <Badge key={s.id} variant="outline" className="text-[9px] px-1.5 py-0">
                              {s.name}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="pt-2 flex items-center gap-2 flex-wrap">
                        <Button asChild variant="ghost" size="sm" className="h-6 px-2 text-[11px] gap-1 text-primary hover:text-primary">
                          <Link href={`/users/${member.user.id}`}>
                            <span>View Profile</span>
                            <ExternalLink className="size-2.5" />
                          </Link>
                        </Button>
                        {team.isCurrentLeader && !isLeader && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setTransferTargetMemberId(member.user.id)
                              setIsTransferModalOpen(true)
                            }}
                            className="h-6 px-2 text-[11px] gap-1 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                          >
                            <Crown className="size-2.5 text-amber-500" />
                            <span>Make Leader</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      {/* Apply to Role Modal */}
      {selectedRoleForApply && (
        <ApplyModal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          team={{
            id: team.id,
            name: team.name,
            eventName: team.event?.name,
          }}
          role={selectedRoleForApply}
          onApplicationSubmitted={handleApplicationSubmitted}
        />
      )}

      {/* Create Role Modal for Leaders */}
      {team.isCurrentLeader && (
        <RoleManagementDialog
          teamId={team.id}
          isOpen={isCreateRoleModalOpen}
          onOpenChange={setIsCreateRoleModalOpen}
        />
      )}

      {/* Leave Squad Modal for Non-Leader Active Members */}
      {team.isCurrentMember && !team.isCurrentLeader && (
        <LeaveTeamDialog
          isOpen={isLeaveDialogOpen}
          onOpenChange={setIsLeaveDialogOpen}
          teamId={team.id}
          teamName={team.name}
          redirectTo="/teams"
        />
      )}

      {/* Transfer Leadership Modal for Leaders */}
      {team.isCurrentLeader && (
        <TransferLeadershipDialog
          isOpen={isTransferModalOpen}
          onOpenChange={setIsTransferModalOpen}
          teamId={team.id}
          teamName={team.name}
          eligibleMembers={eligibleMembers}
          initialSelectedMemberId={transferTargetMemberId}
        />
      )}
    </div>
  )
}
