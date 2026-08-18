"use client"

import * as React from "react"
import Link from "next/link"
import {
  Star,
  Clock,
  Briefcase,
  Building,
  User,
  Mail,
  CheckCircle2,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookmarkButton } from "@/components/bookmarks/bookmark-button"
import { MatchBadge } from "./match-badge"
import { SkillChip } from "./skill-chip"

export interface Candidate {
  id: string
  name: string
  username: string
  profilePhoto?: string | null
  bio?: string | null
  year?: number | null
  availability: string
  department?: { id: string; name: string } | null
  college?: { id: string; name: string } | null
  matchCategory: "EXACT" | "RELATED" | "INTEREST_ONLY"
  experienceLevel: "BEGINNER" | "SOME_EXPERIENCE" | "EXPERIENCED" | string
  matchedRequiredSkills: Array<{ id: string; name: string; level: string }>
  matchedRelatedSkills: Array<{ id: string; name: string; level: string; relatedToRequired?: string }>
  matchedInterests: Array<{ id: string; name: string }>
  matchMetrics: {
    requiredCoverage: number
    requiredTotal: number
    projectCount: number
    avgRating: number
    totalRatings: number
  }
}

interface CandidateCardProps {
  candidate: Candidate
  onInviteClick: (candidate: Candidate) => void
  isAlreadyInvited?: boolean
}

export function CandidateCard({
  candidate,
  onInviteClick,
  isAlreadyInvited = false,
}: CandidateCardProps) {
  const initials = candidate.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const isExact = candidate.matchCategory === "EXACT"
  const isRelated = candidate.matchCategory === "RELATED"

  return (
    <Card
      className={`relative flex flex-col justify-between rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md ${
        isExact
          ? "border-emerald-500/50 bg-gradient-to-b from-emerald-500/5 to-card"
          : isRelated
          ? "border-blue-500/40 bg-gradient-to-b from-blue-500/5 to-card"
          : "border-border/80 bg-card"
      }`}
    >
      <CardHeader className="p-5 pb-3 space-y-3">
        {/* Top Row: Avatar, Identity, Match Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="size-12 rounded-xl border border-border shadow-2xs">
              <AvatarImage src={candidate.profilePhoto || undefined} alt={candidate.name} />
              <AvatarFallback className="font-bold text-sm bg-muted">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-base text-foreground leading-tight">{candidate.name}</h3>
              <p className="text-xs text-muted-foreground font-medium">@{candidate.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <MatchBadge
              category={candidate.matchCategory}
              coverage={
                isExact
                  ? {
                      matched: candidate.matchMetrics.requiredCoverage,
                      total: candidate.matchMetrics.requiredTotal,
                    }
                  : undefined
              }
            />
            <BookmarkButton
              targetType="USER"
              targetId={candidate.id}
              size="icon"
              className="size-7"
            />
          </div>
        </div>

        {/* Academic & Availability Subheader */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground pt-0.5">
          {candidate.department && (
            <span className="inline-flex items-center gap-1">
              <Building className="size-3.5 text-primary" />
              <span>{candidate.department.name}</span>
            </span>
          )}
          {candidate.year && (
            <span className="inline-flex items-center gap-1 font-medium">
              · Year {candidate.year}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5 text-emerald-500" />
            <span className="font-medium">{candidate.availability.replace(/_/g, " ")}</span>
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-5 py-2 space-y-3.5 flex-1">
        {/* SKILL / MATCH EVIDENCE */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {isExact
              ? `Matched Required Skills (${candidate.matchMetrics.requiredCoverage}/${candidate.matchMetrics.requiredTotal})`
              : isRelated
              ? "Semantic Skill Mapping"
              : "Declared Domain Interests"}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {isExact &&
              candidate.matchedRequiredSkills.map((skill) => (
                <SkillChip
                  key={skill.id}
                  name={skill.name}
                  level={skill.level}
                  isMatched
                  isRequired
                />
              ))}

            {isRelated &&
              candidate.matchedRelatedSkills.map((skill) => (
                <SkillChip
                  key={skill.id}
                  name={skill.name}
                  level={skill.level}
                  relatedToRequired={skill.relatedToRequired}
                />
              ))}

            {!isExact &&
              !isRelated &&
              candidate.matchedInterests.map((interest) => (
                <Badge key={interest.id} variant="interest" className="text-xs px-2 py-0.5">
                  {interest.name}
                </Badge>
              ))}
          </div>
        </div>

        {/* Bio Snippet */}
        {candidate.bio && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed italic">
            &ldquo;{candidate.bio}&rdquo;
          </p>
        )}

        {/* Secondary Evaluation Metrics */}
        <div className="pt-2 border-t border-border/60 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground text-[10px] uppercase font-semibold block">
              Experience Fit
            </span>
            <span className="font-semibold text-foreground mt-0.5 inline-flex items-center gap-1">
              <Briefcase className="size-3 text-muted-foreground" />
              <span>{candidate.experienceLevel.replace(/_/g, " ")}</span>
              <span className="text-[10px] text-muted-foreground">
                ({candidate.matchMetrics.projectCount} projects)
              </span>
            </span>
          </div>

          <div>
            <span className="text-muted-foreground text-[10px] uppercase font-semibold block">
              Peer Trust Score
            </span>
            <span className="font-semibold text-foreground mt-0.5 inline-flex items-center gap-1">
              <Star className="size-3 fill-amber-400 text-amber-500" />
              {candidate.matchMetrics.totalRatings > 0 ? (
                <span>
                  <strong>{candidate.matchMetrics.avgRating}</strong>{" "}
                  <span className="text-[10px] text-muted-foreground">
                    ({candidate.matchMetrics.totalRatings} ratings)
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground text-[11px]">No ratings yet</span>
              )}
            </span>
          </div>
        </div>
      </CardContent>

      {/* Card Actions */}
      <CardFooter className="p-5 pt-3 border-t border-border/60 flex items-center justify-between gap-2 bg-muted/10 rounded-b-2xl">
        <Button asChild variant="ghost" size="sm" className="h-8 text-xs gap-1">
          <Link href={`/users/${candidate.id}`}>
            <User className="size-3.5" />
            <span>Profile</span>
            <ExternalLink className="size-3 text-muted-foreground" />
          </Link>
        </Button>

        <Button
          size="sm"
          onClick={() => onInviteClick(candidate)}
          disabled={isAlreadyInvited}
          className={`h-8 gap-1.5 text-xs font-semibold shadow-xs ${
            isAlreadyInvited ? "bg-muted text-muted-foreground" : ""
          }`}
        >
          {isAlreadyInvited ? (
            <>
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span>Invited</span>
            </>
          ) : (
            <>
              <Mail className="size-3.5" />
              <span>Invite to Role</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
