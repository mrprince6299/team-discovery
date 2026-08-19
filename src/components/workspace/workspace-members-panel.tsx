"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import {
  Users,
  Crown,
  ShieldCheck,
  ExternalLink,
  GraduationCap,
  Sparkles,
  LogOut,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { WorkspaceMember } from "@/app/actions/workspace"
import type { MembershipRole } from "@prisma/client"
import { PeerReviewModal } from "@/components/ratings/peer-review-modal"
import { LeaveTeamDialog } from "@/components/teams/leave-team-dialog"
import { TransferLeadershipDialog, type EligibleMember } from "@/components/teams/transfer-leadership-dialog"

interface WorkspaceMembersPanelProps {
  members: WorkspaceMember[]
  currentUserId: string
  teamId?: string
  teamName?: string
}

export function WorkspaceMembersPanel({
  members,
  currentUserId,
  teamId,
  teamName = "Squad",
}: WorkspaceMembersPanelProps) {
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [transferTargetId, setTransferTargetId] = useState<string | undefined>(undefined)

  const myMembership = members.find((m) => m.userId === currentUserId)
  const isLeader = myMembership?.membershipRole === "LEADER"

  const eligibleMembers: EligibleMember[] = members
    .filter((m) => m.membershipRole !== "LEADER" && m.userId !== currentUserId)
    .map((m) => ({
      userId: m.userId,
      name: m.name,
      username: m.username,
      membershipRole: m.membershipRole,
      profilePhoto: m.avatarUrl,
    }))

  const getRoleBadge = (role: MembershipRole) => {
    switch (role) {
      case "LEADER":
        return (
          <Badge
            variant="outline"
            className="text-[10px] py-0 px-2 h-5 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1 font-semibold"
          >
            <Crown className="h-3 w-3" /> Team Leader
          </Badge>
        )
      case "CO_LEADER":
        return (
          <Badge
            variant="outline"
            className="text-[10px] py-0 px-2 h-5 border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center gap-1 font-semibold"
          >
            <ShieldCheck className="h-3 w-3" /> Co-Leader
          </Badge>
        )
      default:
        return (
          <Badge
            variant="outline"
            className="text-[10px] py-0 px-2 h-5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium"
          >
            <Users className="h-3 w-3" /> Member
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Active Squad Members
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {members.length} {members.length === 1 ? "member" : "members"}
          </Badge>
          {isLeader && eligibleMembers.length > 0 && teamId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setTransferTargetId(undefined)
                setIsTransferDialogOpen(true)
              }}
              className="h-7 px-2 text-xs font-semibold gap-1 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50"
            >
              <Crown className="size-3 text-amber-500" />
              <span>Transfer Leadership</span>
            </Button>
          )}
          {myMembership && !isLeader && teamId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsLeaveDialogOpen(true)}
              className="h-7 px-2 text-xs font-semibold gap-1 text-destructive hover:bg-destructive/10 border-destructive/30 hover:border-destructive/50"
            >
              <LogOut className="size-3" />
              <span>Leave Squad</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-2.5">
        {members.map((m) => {
          const isMe = m.userId === currentUserId
          const memberIsLeader = m.membershipRole === "LEADER"

          return (
            <div
              key={m.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-border bg-card/80 hover:bg-muted/40 transition-colors gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-10 w-10 border border-border shrink-0">
                  <AvatarImage src={m.avatarUrl || undefined} alt={m.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {m.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {m.name}
                    </span>
                    {isMe && (
                      <span className="text-[11px] font-medium text-primary bg-primary/10 px-1.5 py-0.2 rounded">
                        You
                      </span>
                    )}
                    {getRoleBadge(m.membershipRole)}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>@{m.username}</span>
                    {m.department && (
                      <>
                        <span>•</span>
                        <span className="truncate flex items-center gap-0.5">
                          <GraduationCap className="h-3 w-3 inline" />
                          {m.department}
                          {m.academicYear ? ` (Yr ${m.academicYear})` : ""}
                        </span>
                      </>
                    )}
                  </div>

                  {m.assignedRoleName && (
                    <div className="flex items-center gap-1 pt-0.5">
                      <Sparkles className="h-3 w-3 text-primary" />
                      <span className="text-xs font-medium text-primary">
                        {m.assignedRoleName}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions: Make Leader / Review Modal for peers / Leave Button for self / Profile Link */}
              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                {isMe && !memberIsLeader && teamId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsLeaveDialogOpen(true)}
                    className="h-8 px-2 text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                  >
                    <LogOut className="size-3.5" />
                    <span>Leave</span>
                  </Button>
                )}

                {!isMe && isLeader && teamId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTransferTargetId(m.userId)
                      setIsTransferDialogOpen(true)
                    }}
                    className="h-8 px-2 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 gap-1"
                  >
                    <Crown className="size-3.5 text-amber-500" />
                    <span>Make Leader</span>
                  </Button>
                )}

                {!isMe && teamId && (
                  <PeerReviewModal
                    teamId={teamId}
                    teamName={teamName}
                    rateeId={m.userId}
                    rateeName={m.name}
                  />
                )}

                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <Link
                    href={`/users/${m.userId}`}
                    aria-label={`View ${m.name}'s public profile`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {teamId && (
        <LeaveTeamDialog
          isOpen={isLeaveDialogOpen}
          onOpenChange={setIsLeaveDialogOpen}
          teamId={teamId}
          teamName={teamName}
          redirectTo="/dashboard"
        />
      )}

      {teamId && (
        <TransferLeadershipDialog
          isOpen={isTransferDialogOpen}
          onOpenChange={setIsTransferDialogOpen}
          teamId={teamId}
          teamName={teamName}
          eligibleMembers={eligibleMembers}
          initialSelectedMemberId={transferTargetId}
        />
      )}
    </div>
  )
}
