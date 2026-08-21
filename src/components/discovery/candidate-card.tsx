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
  ShieldCheck,
  Check,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookmarkButton } from "@/components/bookmarks/bookmark-button"
import { MatchBadge } from "./match-badge"

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
  verificationStatus?: string
  skills?: Array<{ id: string; level: string; skill: { id: string; name: string } }>
  matchedRequiredSkills: Array<{ id: string; name: string; level: string }>
  matchedRelatedSkills: Array<{ id: string; name: string; level: string; relatedToRequired?: string }>
  matchedInterests: Array<{ id: string; name: string }>
  matchMetrics: {
    requiredCoverage: number
    requiredTotal: number
    levelFit: number
    expFit: number
    availFit: number
    projectCount: number
    avgRating: number
    totalRatings: number
  }
}

interface CandidateCardProps {
  candidate: Candidate
  activeRoleId?: string
  roleRequiredSkills?: Array<{ id: string; name: string }>
  rolePreferredSkills?: Array<{ id: string; name: string }>
  onInviteClick: (candidate: Candidate) => void
  isAlreadyInvited?: boolean
}

export function CandidateCard({
  candidate,
  activeRoleId,
  roleRequiredSkills = [],
  rolePreferredSkills: _rolePreferredSkills = [],
  onInviteClick,
  isAlreadyInvited = false,
}: CandidateCardProps) {
  const initials = candidate.name
    ? candidate.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U"

  const isExact = candidate.matchCategory === "EXACT"
  const isRelated = candidate.matchCategory === "RELATED"
  const isInterest = candidate.matchCategory === "INTEREST_ONLY"
  const isVerified = candidate.verificationStatus === "APPROVED"

  // Missing required skills
  const missingRequiredSkills = React.useMemo(() => {
    if (!roleRequiredSkills || roleRequiredSkills.length === 0) return []
    const matchedIds = new Set(candidate.matchedRequiredSkills.map((s) => s.id))
    return roleRequiredSkills.filter((rs) => !matchedIds.has(rs.id))
  }, [roleRequiredSkills, candidate.matchedRequiredSkills])


  // Generate deterministic "Why This Match?" explanation points
  const matchExplanations = React.useMemo(() => {
    const points: string[] = []

    if (isExact) {
      const cov = candidate.matchMetrics.requiredCoverage
      const tot = candidate.matchMetrics.requiredTotal
      points.push(`${cov}/${tot} required skills matched (${candidate.matchedRequiredSkills.map((s) => s.name).join(", ")})`)
      if (candidate.matchedRequiredSkills.some((s) => s.level === "ADVANCED")) {
        points.push("Advanced proficiency in key role requirements")
      } else if (candidate.matchedRequiredSkills.some((s) => s.level === "INTERMEDIATE")) {
        points.push("Solid intermediate proficiency in core stack")
      }
      if (candidate.matchMetrics.projectCount > 0) {
        points.push(`${candidate.matchMetrics.projectCount} project${candidate.matchMetrics.projectCount > 1 ? "s" : ""} demonstrating technical stack`)
      }
      if (candidate.availability === "AVAILABLE") {
        points.push("Immediately available for squad commitment")
      }
    } else if (isRelated) {
      const relNames = candidate.matchedRelatedSkills.map((s) => s.name).join(", ")
      points.push(`Transferable skills: ${relNames}`)
      const mappings = candidate.matchedRelatedSkills
        .filter((s) => s.relatedToRequired)
        .map((s) => `${s.name} ~ ${s.relatedToRequired}`)
      if (mappings.length > 0) {
        points.push(`Semantic match to required: ${mappings.join(", ")}`)
      }
      points.push(`${candidate.experienceLevel.replace(/_/g, " ")} experience level`)
    } else if (isInterest) {
      const intNames = candidate.matchedInterests.map((i) => i.name).join(", ")
      points.push(`Declared domain interest: ${intNames}`)
      points.push("Eager to build and develop in this technical stack")
    }

    if (isVerified) {
      points.push("Verified institutional student trust badge")
    }

    return points
  }, [isExact, isRelated, isInterest, isVerified, candidate])

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
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <Avatar className="size-12 rounded-xl border border-border shadow-2xs">
                <AvatarImage src={candidate.profilePhoto || undefined} alt={candidate.name} />
                <AvatarFallback className="font-bold text-sm bg-muted">{initials}</AvatarFallback>
              </Avatar>
              <span
                className={`absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-card ${
                  candidate.availability === "AVAILABLE"
                    ? "bg-emerald-500"
                    : candidate.availability === "LIMITED"
                    ? "bg-amber-500"
                    : "bg-muted-foreground"
                }`}
                title={`Availability: ${candidate.availability.replace(/_/g, " ")}`}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-base text-foreground leading-tight truncate">{candidate.name}</h3>
                {isVerified && (
                  <Badge variant="success" className="text-[9px] uppercase font-semibold py-0 px-1.5 gap-0.5 shrink-0">
                    <ShieldCheck className="size-2.5" />
                    <span>Verified</span>
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-medium truncate">@{candidate.username}</p>
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
              <Building className="size-3.5 text-primary shrink-0" />
              <span className="truncate max-w-[180px]">{candidate.department.name}</span>
            </span>
          )}
          {candidate.year && (
            <span className="inline-flex items-center gap-1 font-medium">
              · Year {candidate.year}
            </span>
          )}
          <span className="inline-flex items-center gap-1 font-medium">
            · <Clock className="size-3 text-emerald-500 shrink-0" />
            <span>{candidate.availability.replace(/_/g, " ")}</span>
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-5 py-2 space-y-4 flex-1">
        {/* ROLE FIT & SKILLS MATRIX */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Role Skill Breakdown</span>
            {isExact && (
              <span className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                {candidate.matchMetrics.requiredCoverage}/{candidate.matchMetrics.requiredTotal} Matched
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {/* Matched Required Skills */}
            {candidate.matchedRequiredSkills.map((skill) => (
              <div
                key={skill.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
              >
                <Check className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{skill.name}</span>
                <span className="text-[9px] uppercase opacity-75 font-normal">({skill.level})</span>
              </div>
            ))}

            {/* Matched Related Skills */}
            {candidate.matchedRelatedSkills.map((skill) => (
              <div
                key={skill.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30"
              >
                <Sparkles className="size-3 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>{skill.name}</span>
                {skill.relatedToRequired && (
                  <span className="text-[9px] text-muted-foreground font-normal">(~{skill.relatedToRequired})</span>
                )}
              </div>
            ))}

            {/* Missing Required Skills for full transparency */}
            {missingRequiredSkills.map((missing) => (
              <div
                key={missing.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs text-muted-foreground border border-dashed border-border/80 bg-muted/20"
                title="Required for role, but not yet declared by candidate"
              >
                <span className="size-1.5 rounded-full bg-muted-foreground/60" />
                <span>{missing.name}</span>
                <span className="text-[9px] uppercase opacity-60">Missing</span>
              </div>
            ))}

            {/* Matched Interests */}
            {isInterest &&
              candidate.matchedInterests.map((interest) => (
                <Badge key={interest.id} variant="interest" className="text-xs px-2 py-0.5">
                  {interest.name}
                </Badge>
              ))}
          </div>
        </div>

        {/* "WHY THIS MATCH?" EXPLAINABILITY SECTION */}
        <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground uppercase tracking-wider">
            <Sparkles className="size-3.5 text-primary shrink-0" />
            <span>Why this match?</span>
          </div>

          <ul className="space-y-1 text-xs text-muted-foreground">
            {matchExplanations.map((exp, idx) => (
              <li key={idx} className="flex items-start gap-1.5 leading-snug">
                <Check className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{exp}</span>
              </li>
            ))}
          </ul>
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
              <Briefcase className="size-3 text-primary shrink-0" />
              <span>{candidate.experienceLevel.replace(/_/g, " ")}</span>
              <span className="text-[10px] text-muted-foreground">
                ({candidate.matchMetrics.projectCount} proj)
              </span>
            </span>
          </div>

          <div>
            <span className="text-muted-foreground text-[10px] uppercase font-semibold block">
              Peer Trust Score
            </span>
            <span className="font-semibold text-foreground mt-0.5 inline-flex items-center gap-1">
              <Star className="size-3 fill-amber-400 text-amber-500 shrink-0" />
              {candidate.matchMetrics.totalRatings > 0 ? (
                <span>
                  <strong>{candidate.matchMetrics.avgRating}</strong>{" "}
                  <span className="text-[10px] text-muted-foreground">
                    ({candidate.matchMetrics.totalRatings} rtg)
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground text-[11px]">New Candidate</span>
              )}
            </span>
          </div>
        </div>
      </CardContent>

      {/* Card Actions */}
      <CardFooter className="p-5 pt-3 border-t border-border/60 flex items-center justify-between gap-2 bg-muted/10 rounded-b-2xl">
        <Button asChild variant="ghost" size="sm" className="h-8 text-xs gap-1">
          <Link href={activeRoleId ? `/users/${candidate.id}?roleId=${activeRoleId}` : `/users/${candidate.id}`}>
            <User className="size-3.5" />
            <span>View Profile</span>
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
