"use client"

import * as React from "react"
import Link from "next/link"
import { Users, Calendar, ArrowRight, UserCheck, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookmarkButton } from "@/components/bookmarks/bookmark-button"

export interface DiscoverableTeam {
  id: string
  name: string
  description: string
  status: string
  event?: {
    id: string
    name: string
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
  activeMemberCount: number
  totalRolesCount: number
  activeRolesCount: number
  totalSeatsRemaining: number
  totalSeatsRequired: number
  openRoles: Array<{
    id: string
    name: string
    seatsRequired: number
    remainingSeats: number
    status: string
    requiredSkills: Array<{ id: string; name: string }>
  }>
  skillTags: Array<{ id: string; name: string }>
}

interface TeamCardProps {
  team: DiscoverableTeam
}

export function TeamCard({ team }: TeamCardProps) {
  const isFull = team.status === "FULL" || team.totalSeatsRemaining === 0
  const leaderInitials = team.leader
    ? team.leader.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "TL"

  return (
    <Card className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card shadow-xs hover:shadow-md transition-all duration-200">
      <CardHeader className="p-5 pb-3 space-y-3">
        {/* Event Banner / Badge & Status */}
        <div className="flex items-center justify-between gap-2">
          {team.event ? (
            <Badge variant="outline" className="text-xs font-semibold text-primary truncate max-w-[200px]">
              <Calendar className="size-3 mr-1 shrink-0" />
              <span className="truncate">{team.event.name}</span>
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[11px]">
              General Hackathon Team
            </Badge>
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            <Badge
              variant={isFull ? "secondary" : "exact"}
              className="text-[10px] uppercase font-bold tracking-wider"
            >
              {isFull ? "Team Full" : `${team.totalSeatsRemaining} Seat${team.totalSeatsRemaining !== 1 ? "s" : ""} Open`}
            </Badge>
            <BookmarkButton
              targetType="TEAM"
              targetId={team.id}
              size="icon"
              className="size-7"
            />
          </div>
        </div>

        {/* Team Title & Description */}
        <div className="space-y-1">
          <h3 className="font-extrabold text-lg text-foreground tracking-tight line-clamp-1">
            {team.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {team.description}
          </p>
        </div>

        {/* Leader & Member Counter */}
        <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground border-t border-border/50">
          {team.leader && (
            <div className="flex items-center gap-2">
              <Avatar className="size-6 rounded-md border border-border">
                <AvatarImage src={team.leader.profilePhoto || undefined} alt={team.leader.name} />
                <AvatarFallback className="text-[10px] font-bold bg-muted">{leaderInitials}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground truncate max-w-[130px]">
                {team.leader.name}
              </span>
              <ShieldCheck className="size-3.5 text-primary shrink-0" />
            </div>
          )}

          <div className="flex items-center gap-1 font-semibold text-foreground ml-auto">
            <Users className="size-3.5 text-muted-foreground" />
            <span>
              {team.activeMemberCount} member{team.activeMemberCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 py-2 space-y-3 flex-1">
        {/* Open Recruitment Roles Preview */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Open Roles ({team.openRoles.length})</span>
            {team.openRoles.length > 0 && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                Recruiting Now
              </span>
            )}
          </div>

          {team.openRoles.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {team.openRoles.map((role) => (
                <div
                  key={role.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-medium text-emerald-800 dark:text-emerald-300"
                >
                  <UserCheck className="size-3 shrink-0" />
                  <span>{role.name}</span>
                  <span className="text-[10px] text-muted-foreground">({role.remainingSeats})</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No open recruitment roles.</p>
          )}
        </div>

        {/* Skill Tags */}
        {team.skillTags.length > 0 && (
          <div className="space-y-1 pt-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Required Stack
            </div>
            <div className="flex flex-wrap gap-1">
              {team.skillTags.slice(0, 5).map((skill) => (
                <Badge key={skill.id} variant="outline" className="text-[10px] px-1.5 py-0">
                  {skill.name}
                </Badge>
              ))}
              {team.skillTags.length > 5 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  +{team.skillTags.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-5 pt-3 border-t border-border/60 bg-muted/10 rounded-b-2xl">
        <Button asChild size="sm" className="w-full gap-1.5 text-xs font-semibold shadow-xs">
          <Link href={`/teams/${team.id}`}>
            <span>View Team & Apply</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
