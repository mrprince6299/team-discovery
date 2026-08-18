"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Users,
  Calendar,
  ShieldCheck,
  Crown,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { MembershipRole } from "@prisma/client"

interface WorkspaceHeaderProps {
  team: {
    id: string
    name: string
    description: string
    status: string
    event?: {
      id: string
      name: string
      startDate?: Date | null
      endDate?: Date | null
    } | null
  }
  currentMember: {
    membershipRole: MembershipRole
    assignedRoleName: string | null
  }
  memberCount: number
}

export function WorkspaceHeader({
  team,
  currentMember,
  memberCount,
}: WorkspaceHeaderProps) {
  const getRoleBadgeVariant = (role: MembershipRole) => {
    switch (role) {
      case "LEADER":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
      case "CO_LEADER":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
      default:
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
    }
  }

  const getRoleIcon = (role: MembershipRole) => {
    switch (role) {
      case "LEADER":
        return <Crown className="mr-1 h-3 w-3 text-amber-500" />
      case "CO_LEADER":
        return <ShieldCheck className="mr-1 h-3 w-3 text-purple-500" />
      default:
        return <Users className="mr-1 h-3 w-3 text-emerald-500" />
    }
  }

  return (
    <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-10 px-4 sm:px-6 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Team Info & Back Link */}
        <div className="flex items-start sm:items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-foreground"
          >
            <Link
              href={`/teams/${team.id}`}
              aria-label="Back to Team Overview"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                {team.name}
              </h1>
              <Badge
                variant="outline"
                className={
                  team.status === "ACTIVE"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-muted text-muted-foreground"
                }
              >
                {team.status === "ACTIVE" ? "Active Squad" : team.status}
              </Badge>
              {team.event && (
                <Badge
                  variant="outline"
                  className="border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center gap-1"
                >
                  <Calendar className="h-3 w-3" />
                  {team.event.name}
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 max-w-2xl">
              {team.description}
            </p>
          </div>
        </div>

        {/* Right: User Role in Squad & Team Quick Stats */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 pl-11 sm:pl-0">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border/50">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span>
              <strong className="text-foreground">{memberCount}</strong> active {memberCount === 1 ? "member" : "members"}
            </span>
          </div>

          <Badge
            variant="outline"
            className={`flex items-center text-xs py-1 px-2.5 ${getRoleBadgeVariant(
              currentMember.membershipRole
            )}`}
          >
            {getRoleIcon(currentMember.membershipRole)}
            <span>Your Role: {currentMember.membershipRole}</span>
            {currentMember.assignedRoleName && (
              <span className="ml-1 opacity-80">({currentMember.assignedRoleName})</span>
            )}
          </Badge>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 text-xs font-medium border-primary/30 hover:bg-primary/5"
          >
            <Link href={`/teams/${team.id}`}>
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />
              Team Roster
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
