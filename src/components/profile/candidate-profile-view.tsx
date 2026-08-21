"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import {
  Star,
  ExternalLink,
  Code2,
  Globe,
  Trophy,
  Layers,
  Sparkles,
  ArrowLeft,
  Mail,
  Calendar,
  Building,
  Briefcase,
  Edit3,
  ShieldCheck,
  ShieldAlert,
  Check,
  X,
  Compass,
  GraduationCap,
  Flag,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookmarkButton } from "@/components/bookmarks/bookmark-button"
import { RatingBreakdownCard } from "@/components/ratings/rating-breakdown-card"
import { TechIcon } from "@/components/common/tech-icon"
import { InviteModal } from "@/components/discovery/invite-modal"
import { ReportModal } from "@/components/reports/report-modal"
import { parseProfileRole, SKILL_LEVEL_OPTIONS } from "@/lib/constants/options"
import { cn } from "@/lib/utils"
import type { SkillLevel } from "@prisma/client"

export interface PublicProfileData {
  id: string
  username: string
  name: string
  profilePhoto?: string | null
  bio?: string | null
  year?: number | null
  availability: string
  verificationStatus: string
  isSuspended?: boolean
  createdAt: Date
  college?: { name: string; domain: string } | null
  department?: { name: string } | null
  skills: Array<{ level: SkillLevel; skill: { id: string; name: string } }>
  interests: Array<{ skill: { id: string; name: string } }>
  projects: Array<{
    id: string
    title: string
    description: string
    role: string
    githubLink?: string | null
    figmaLink?: string | null
    demoLink?: string | null
    date: Date
    skills: Array<{ skill: { id: string; name: string } }>
  }>
  achievements: Array<{
    id: string
    title: string
    description: string
    date: Date
    link?: string | null
  }>
  ratingsReceived: Array<{
    id: string
    score: number
    feedback?: string | null
    createdAt: Date
    rater: { id: string; name: string; username: string; profilePhoto?: string | null }
    team?: { id: string; name: string } | null
  }>
  stats: {
    totalRatings: number
    avgRating: number
    projectsCount?: number
    skillsCount?: number
  }
}

export interface RoleFitData {
  role: {
    id: string
    name: string
    teamId: string
    teamName: string
    eventName?: string | null
    seatsRequired: number
  }
  requiredSkills: Array<{
    id: string
    name: string
    isMatched: boolean
    candidateLevel?: string | null
  }>
  preferredSkills: Array<{
    id: string
    name: string
    isMatched: boolean
    candidateLevel?: string | null
  }>
  matchedRequiredCount: number
  totalRequiredCount: number
  requiredCoverage: number
  isExact: boolean
}

export interface ActiveRoleOption {
  id: string
  name: string
  teamId: string
  teamName: string
  remainingSeats: number
  requiredSkills: Array<{ id: string; name: string }>
}

interface CandidateProfileViewProps {
  profile: PublicProfileData
  isOwner: boolean
  roleFit?: RoleFitData | null
  viewerActiveRoles?: ActiveRoleOption[]
}

function getAvailabilityMeta(status: string) {
  switch (status) {
    case "AVAILABLE":
      return {
        label: "Available for Teams",
        color: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30",
        dotColor: "bg-emerald-500",
      }
    case "LOOKING_FOR_TEAM":
      return {
        label: "Looking for Team",
        color: "text-blue-700 dark:text-blue-300 bg-blue-500/15 border-blue-500/30",
        dotColor: "bg-blue-500",
      }
    case "BUSY":
      return {
        label: "Busy / Limited",
        color: "text-amber-700 dark:text-amber-300 bg-amber-500/15 border-amber-500/30",
        dotColor: "bg-amber-500",
      }
    case "TEAM_FULL":
      return {
        label: "Team Full",
        color: "text-zinc-700 dark:text-zinc-300 bg-zinc-500/15 border-zinc-500/30",
        dotColor: "bg-zinc-500",
      }
    default:
      return {
        label: status.replace(/_/g, " "),
        color: "text-muted-foreground bg-muted border-border",
        dotColor: "bg-muted-foreground",
      }
  }
}

export function CandidateProfileView({
  profile,
  isOwner,
  roleFit,
  viewerActiveRoles = [],
}: CandidateProfileViewProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [selectedRoleForInvite, setSelectedRoleForInvite] = useState<ActiveRoleOption | null>(() => {
    if (roleFit && viewerActiveRoles.some((r) => r.id === roleFit.role.id)) {
      return viewerActiveRoles.find((r) => r.id === roleFit.role.id) || null
    }
    return viewerActiveRoles[0] || null
  })

  const { role: profileRole, cleanBio } = parseProfileRole(profile.bio)

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const isVerified = profile.verificationStatus === "APPROVED"
  const availMeta = getAvailabilityMeta(profile.availability)

  // Segregate Skills by proficiency
  const topSkills = profile.skills.filter((s) => s.level === "ADVANCED" || s.level === "INTERMEDIATE")
  const otherSkills = profile.skills.filter((s) => s.level !== "ADVANCED" && s.level !== "INTERMEDIATE")

  // Count project evidence per skill
  const skillProjectCountMap = React.useMemo(() => {
    const map = new Map<string, number>()
    profile.projects.forEach((p) => {
      p.skills.forEach((s) => {
        const id = s.skill.id
        map.set(id, (map.get(id) || 0) + 1)
      })
    })
    return map
  }, [profile.projects])

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <Link href="/discover">
            <ArrowLeft className="size-3.5" />
            <span>Back to Discovery</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          {isOwner ? (
            <>
              <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs font-semibold shadow-2xs">
                <Link href="/onboarding">
                  <Compass className="size-3.5 text-primary" />
                  <span>Guided Setup</span>
                </Link>
              </Button>
              <Button asChild size="sm" className="gap-1.5 text-xs font-semibold shadow-xs">
                <Link href="/profile">
                  <Edit3 className="size-3.5" />
                  <span>Edit Profile</span>
                </Link>
              </Button>
            </>
          ) : (
            <>
              {viewerActiveRoles.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="gap-1.5 text-xs font-semibold shadow-xs"
                >
                  <Mail className="size-3.5" />
                  <span>Invite to Squad</span>
                </Button>
              )}
              <BookmarkButton
                targetType="USER"
                targetId={profile.id}
                size="icon"
                variant="outline"
                className="size-8 rounded-xl shrink-0 border-border/80"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsReportModalOpen(true)}
                className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5 h-8 px-2.5 rounded-xl border border-border/80"
                title="Report Profile"
              >
                <Flag className="size-3.5" />
                <span className="hidden sm:inline">Report</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {!isOwner && (
        <ReportModal
          isOpen={isReportModalOpen}
          onOpenChange={setIsReportModalOpen}
          targetType="USER"
          targetId={profile.id}
          targetName={profile.name}
          targetContext={profile.bio || undefined}
        />
      )}

      {/* Account Suspended Notice */}
      {profile.isSuspended && (
        <div className="p-4 rounded-2xl border border-destructive/30 bg-destructive/10 flex items-center gap-3 text-destructive shadow-2xs">
          <ShieldAlert className="size-5 shrink-0 text-destructive" />
          <div className="text-xs">
            <span className="font-bold block text-sm text-destructive">Account Suspended</span>
            <span className="text-muted-foreground">
              This candidate account has been temporarily suspended by platform administrators.
            </span>
          </div>
        </div>
      )}

      {/* Hero Persona Header Card */}
      <Card className="border-border/80 bg-card shadow-sm rounded-2xl overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-indigo-500/15 to-emerald-500/20 relative">
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />
        </div>
        <CardContent className="relative px-6 pb-6 pt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-14">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <Avatar className="size-28 rounded-2xl border-4 border-card shadow-md bg-muted">
                <AvatarImage src={profile.profilePhoto || undefined} alt={profile.name} />
                <AvatarFallback className="rounded-2xl text-2xl font-bold bg-muted text-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                    {profile.name}
                  </h1>
                  {profileRole && (
                    <Badge className="text-xs font-semibold bg-primary text-primary-foreground gap-1 py-0.5 px-2.5 rounded-lg shadow-2xs">
                      <Briefcase className="size-3" />
                      <span>{profileRole}</span>
                    </Badge>
                  )}
                  {isVerified && (
                    <Badge
                      className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] uppercase font-bold gap-1 py-0.5 px-2 rounded-lg"
                    >
                      <ShieldCheck className="size-3 text-emerald-500" />
                      <span>Verified Student</span>
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-medium">
                  <span>@{profile.username}</span>
                  <span className="size-1 rounded-full bg-border" />
                  <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold", availMeta.color)}>
                    <span className={cn("size-1.5 rounded-full animate-pulse", availMeta.dotColor)} />
                    <span>{availMeta.label}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action CTA on Mobile/Desktop */}
            {!isOwner && viewerActiveRoles.length > 0 && (
              <div className="w-full sm:w-auto pt-2 sm:pt-0">
                <Button
                  size="default"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="w-full sm:w-auto gap-1.5 text-xs font-semibold shadow-xs"
                >
                  <Mail className="size-4" />
                  <span>Invite to Squad</span>
                </Button>
              </div>
            )}
          </div>

          {/* Academic & Platform Footprint Ribbon */}
          <div className="mt-6 pt-4 border-t border-border/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Institution</span>
              <span className="font-semibold text-foreground mt-0.5 inline-flex items-center gap-1 truncate max-w-[200px]">
                <Building className="size-3.5 text-primary shrink-0" />
                <span>{profile.college?.name || "Student College"}</span>
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Major &amp; Year</span>
              <span className="font-semibold text-foreground mt-0.5 inline-flex items-center gap-1 truncate max-w-[200px]">
                <GraduationCap className="size-3.5 text-indigo-500 shrink-0" />
                <span>
                  {profile.department?.name || "Degree Program"}
                  {profile.year ? ` · Yr ${profile.year}` : ""}
                </span>
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Peer Rating</span>
              <span className="font-semibold text-foreground mt-0.5 inline-flex items-center gap-1">
                <Star className="size-3.5 fill-amber-400 text-amber-500" />
                {profile.stats.totalRatings > 0 ? (
                  <span>
                    <strong>{profile.stats.avgRating}</strong> ({profile.stats.totalRatings}{" "}
                    {profile.stats.totalRatings === 1 ? "review" : "reviews"})
                  </span>
                ) : (
                  <span className="text-muted-foreground">No reviews yet</span>
                )}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Platform Member</span>
              <span className="font-semibold text-foreground mt-0.5 inline-flex items-center gap-1">
                <Calendar className="size-3.5 text-muted-foreground" />
                <span>{new Date(profile.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Fit Context Section (Phase 5 & 12) */}
      {roleFit && (
        <Card className="border-primary/30 bg-primary/5 rounded-2xl overflow-hidden shadow-2xs">
          <CardHeader className="pb-3 bg-primary/10 border-b border-primary/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4.5 text-primary" />
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Candidate Fit for: {roleFit.role.name}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Target Squad: {roleFit.role.teamName} {roleFit.role.eventName ? `(${roleFit.role.eventName})` : ""}
                  </CardDescription>
                </div>
              </div>
              <Badge className={cn("text-xs font-bold self-start sm:self-auto", roleFit.isExact ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground")}>
                {roleFit.isExact ? "Exact Match (100%)" : `${roleFit.requiredCoverage}% Required Match`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Required Skills Fit */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span className="flex items-center gap-1">
                    <Layers className="size-3.5 text-primary" />
                    <span>Required Skills ({roleFit.matchedRequiredCount}/{roleFit.totalRequiredCount})</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {roleFit.requiredSkills.map((s) => (
                    <div
                      key={s.id}
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium",
                        s.isMatched
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                          : "bg-muted/40 border-border/80 text-muted-foreground line-through opacity-70"
                      )}
                    >
                      {s.isMatched ? <Check className="size-3 text-emerald-500" /> : <X className="size-3 text-destructive" />}
                      <span>{s.name}</span>
                      {s.candidateLevel && (
                        <span className="text-[10px] opacity-75 font-mono">({s.candidateLevel})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Preferred Skills Bonus */}
              {roleFit.preferredSkills.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1">
                    <Sparkles className="size-3.5 text-amber-500" />
                    <span>Preferred Bonus Skills</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {roleFit.preferredSkills.map((s) => (
                      <div
                        key={s.id}
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium",
                          s.isMatched
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
                            : "bg-muted/30 border-border/60 text-muted-foreground opacity-60"
                        )}
                      >
                        {s.isMatched ? <Check className="size-3 text-amber-500" /> : <X className="size-3 text-muted-foreground" />}
                        <span>{s.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-primary/20">
              <span className="text-xs text-muted-foreground">
                Matches role requirements for {roleFit.role.seatsRequired} open {roleFit.role.seatsRequired === 1 ? "seat" : "seats"}.
              </span>
              <Button
                size="sm"
                onClick={() => {
                  const target = viewerActiveRoles.find((r) => r.id === roleFit.role.id)
                  if (target) setSelectedRoleForInvite(target)
                  setIsInviteModalOpen(true)
                }}
                className="gap-1 text-xs font-semibold"
              >
                <Mail className="size-3.5" />
                <span>Invite to {roleFit.role.name}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs Navigation for Structured Sections (Phase 13) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 sm:w-auto sm:inline-flex rounded-xl p-1 bg-muted/60">
          <TabsTrigger value="overview" className="rounded-lg text-xs font-semibold">
            Overview
          </TabsTrigger>
          <TabsTrigger value="skills" className="rounded-lg text-xs font-semibold">
            Skills ({profile.skills.length})
          </TabsTrigger>
          <TabsTrigger value="projects" className="rounded-lg text-xs font-semibold">
            Projects ({profile.projects.length})
          </TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-lg text-xs font-semibold">
            Reviews ({profile.stats.totalRatings})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview & Bio */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column (2/3 width) */}
            <div className="md:col-span-2 space-y-6">
              {/* About Candidate / Bio */}
              <Card className="border-border/80 bg-card shadow-sm rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-foreground">About Candidate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {cleanBio || (
                      <span className="text-muted-foreground italic">
                        {isOwner
                          ? "Add a short introduction so teammates understand what you build and what kind of work you enjoy."
                          : "This candidate has not added a bio yet."}
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>

              {/* Featured Top Skills */}
              <Card className="border-border/80 bg-card shadow-sm rounded-2xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                      <Layers className="size-4 text-primary" />
                      <span>Primary Technical Stack</span>
                    </CardTitle>
                    <span className="text-xs text-muted-foreground font-medium">
                      {topSkills.length} core proficiencies
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {topSkills.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No top skills listed.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {topSkills.map(({ skill, level }) => {
                        const levelMeta = SKILL_LEVEL_OPTIONS.find((l) => l.value === level)
                        const projCount = skillProjectCountMap.get(skill.id) || 0
                        return (
                          <div
                            key={skill.id}
                            className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-muted/20 hover:border-primary/40 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="size-8 rounded-lg bg-card border border-border flex items-center justify-center shrink-0 shadow-2xs">
                                <TechIcon name={skill.name} className="size-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-foreground block truncate">
                                  {skill.name}
                                </span>
                                {projCount > 0 && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {projCount} {projCount === 1 ? "project" : "projects"} built
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] uppercase tracking-wider font-bold py-0.5 px-2 rounded-md",
                                levelMeta?.color || ""
                              )}
                            >
                              {level}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column (1/3 width) */}
            <div className="space-y-6">
              {/* Domain Interests */}
              <Card className="border-border/80 bg-card shadow-sm rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                    <Sparkles className="size-4 text-purple-500" />
                    <span>Focus Areas &amp; Interests</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.interests.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No domain interests specified.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.interests.map(({ skill }) => (
                        <Badge
                          key={skill.id}
                          variant="outline"
                          className="text-xs font-medium py-1 px-2.5 bg-muted/40 border-border/80 rounded-lg"
                        >
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Awards & Achievements */}
              {profile.achievements.length > 0 && (
                <Card className="border-border/80 bg-card shadow-sm rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                      <Trophy className="size-4 text-amber-500" />
                      <span>Achievements &amp; Honors</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {profile.achievements.map((ach) => (
                      <div key={ach.id} className="p-3 rounded-xl border border-border/70 bg-card space-y-1">
                        <h5 className="font-bold text-xs text-foreground">{ach.title}</h5>
                        <p className="text-[11px] text-muted-foreground leading-snug">{ach.description}</p>
                        {ach.link && (
                          <a
                            href={ach.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:underline inline-flex items-center gap-1 font-semibold pt-1"
                          >
                            <ExternalLink className="size-2.5" />
                            <span>View Proof</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: All Skills Detailed Breakdown */}
        <TabsContent value="skills" className="space-y-6">
          <Card className="border-border/80 bg-card shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <Layers className="size-4.5 text-primary" />
                <span>Complete Skill Taxonomy &amp; Proficiencies</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Self-declared and verified proficiencies participating in deterministic matching.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Top Skills */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  <span>Advanced &amp; Intermediate Skills ({topSkills.length})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {topSkills.map(({ skill, level }) => {
                    const levelMeta = SKILL_LEVEL_OPTIONS.find((l) => l.value === level)
                    return (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-muted/20"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <TechIcon name={skill.name} className="size-4 shrink-0" />
                          <span className="text-xs font-bold text-foreground truncate">{skill.name}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn("text-[9px] uppercase font-bold py-0.5 px-2 rounded-md", levelMeta?.color || "")}
                        >
                          {level}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Other Skills */}
              {otherSkills.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border/60">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Foundational &amp; Other Skills ({otherSkills.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {otherSkills.map(({ skill, level }) => (
                      <div
                        key={skill.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-card text-xs font-medium text-foreground"
                      >
                        <TechIcon name={skill.name} className="size-3 text-muted-foreground" />
                        <span>{skill.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">({level})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Projects & Portfolio */}
        <TabsContent value="projects" className="space-y-6">
          <Card className="border-border/80 bg-card shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <Code2 className="size-4.5 text-primary" />
                <span>Portfolio &amp; Project Track Record ({profile.projects.length})</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Public projects and hackathon builds demonstrating practical technical ability.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.projects.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Code2 className="size-10 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-sm font-bold text-foreground">No projects published yet</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {isOwner
                      ? "Add your past hackathons, class projects, and GitHub repositories to stand out."
                      : "This candidate has not added any public projects to their profile."}
                  </p>
                </div>
              ) : (
                profile.projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-5 rounded-2xl border border-border/80 bg-card space-y-3 shadow-2xs hover:border-primary/30 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-base text-foreground">{proj.title}</h4>
                        <span className="text-xs text-primary font-bold">{proj.role}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(proj.date).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {proj.description}
                    </p>

                    {proj.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {proj.skills.map(({ skill }) => (
                          <Badge
                            key={skill.id}
                            variant="secondary"
                            className="text-[11px] font-medium py-0.5 px-2 rounded-md flex items-center gap-1"
                          >
                            <TechIcon name={skill.name} className="size-3" />
                            <span>{skill.name}</span>
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border/40 text-xs">
                      {proj.githubLink && (
                        <a
                          href={proj.githubLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-semibold"
                        >
                          <Code2 className="size-3.5 text-primary" />
                          <span>Code Repository</span>
                        </a>
                      )}
                      {proj.demoLink && (
                        <a
                          href={proj.demoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1 font-semibold"
                        >
                          <Globe className="size-3.5" />
                          <span>Live Demo</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Peer Reviews & Trust */}
        <TabsContent value="reviews" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <RatingBreakdownCard
                ratings={profile.ratingsReceived.map((r) => ({
                  id: r.id,
                  score: r.score,
                  feedback: r.feedback ?? null,
                  createdAt: r.createdAt,
                  rater: r.rater,
                }))}
                candidateName={profile.name}
              />
            </div>

            <div className="md:col-span-2 space-y-4">
              <Card className="border-border/80 bg-card shadow-sm rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <Star className="size-4.5 fill-amber-400 text-amber-500" />
                    <span>Teammate Endorsements &amp; Reviews</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.ratingsReceived.length === 0 ? (
                    <div className="text-center py-10 space-y-1.5">
                      <Star className="size-8 text-muted-foreground mx-auto opacity-50" />
                      <p className="text-xs font-bold text-foreground">No peer reviews yet</p>
                      <p className="text-[11px] text-muted-foreground">
                        Reviews are generated after completing hackathon projects together.
                      </p>
                    </div>
                  ) : (
                    profile.ratingsReceived.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="size-7 rounded-lg">
                              <AvatarImage src={rev.rater.profilePhoto || undefined} />
                              <AvatarFallback className="text-[10px] font-bold">
                                {rev.rater.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-bold text-xs text-foreground block">
                                {rev.rater.name}
                              </span>
                              {rev.team && (
                                <span className="text-[10px] text-muted-foreground">
                                  via {rev.team.name}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5 text-amber-500">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "size-3",
                                  i < rev.score ? "fill-amber-400 text-amber-500" : "text-muted-foreground/30"
                                )}
                              />
                            ))}
                          </div>
                        </div>

                        {rev.feedback && (
                          <p className="text-xs text-muted-foreground leading-relaxed italic">
                            &ldquo;{rev.feedback}&rdquo;
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Invite Modal Context */}
      {selectedRoleForInvite && (
        <InviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          candidate={{
            id: profile.id,
            name: profile.name,
            username: profile.username,
            profilePhoto: profile.profilePhoto,
          }}
          role={selectedRoleForInvite}
        />
      )}
    </div>
  )
}
