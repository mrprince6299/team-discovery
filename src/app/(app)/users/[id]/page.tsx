import Link from "next/link"
import { notFound } from "next/navigation"
import { getPublicProfile } from "@/app/actions/profile"
import { createClient } from "@/utils/supabase/server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookmarkButton } from "@/components/bookmarks/bookmark-button"
import { RatingBreakdownCard } from "@/components/ratings/rating-breakdown-card"
import { TechIcon } from "@/components/common/tech-icon"
import { parseProfileRole, SKILL_LEVEL_OPTIONS } from "@/lib/constants/options"
import {
  Star,
  Clock,
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
} from "lucide-react"

interface PublicProfilePageProps {
  params: Promise<{ id: string }>
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { id } = await params
  const [profile, supabase] = await Promise.all([
    getPublicProfile(id),
    createClient(),
  ])

  if (!profile) {
    notFound()
  }

  const { data: { user: authUser } } = await supabase.auth.getUser()
  const isOwner = authUser?.id === profile.id
  const { role: profileRole, cleanBio } = parseProfileRole(profile.bio)

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const isVerified = profile.verificationStatus === "APPROVED"

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Back navigation */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <Link href="/discover">
            <ArrowLeft className="size-3.5" />
            <span>Back to Discovery</span>
          </Link>
        </Button>

        {isOwner && (
          <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs font-semibold shadow-2xs">
            <Link href="/profile">
              <Edit3 className="size-3.5 text-primary" />
              <span>Edit My Profile</span>
            </Link>
          </Button>
        )}
      </div>

      {/* Hero Header Card */}
      <Card className="border-border/80 bg-card shadow-sm rounded-2xl overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-emerald-500/10 to-blue-500/20" />
        <CardContent className="relative px-6 pb-6 pt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-14">
            <div className="flex items-end gap-4">
              <Avatar className="size-28 rounded-2xl border-4 border-background shadow-md">
                <AvatarImage src={profile.profilePhoto || undefined} alt={profile.name} />
                <AvatarFallback className="rounded-2xl text-2xl font-bold bg-muted">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{profile.name}</h1>
                  {profileRole && (
                    <Badge variant="default" className="text-xs font-semibold bg-primary text-primary-foreground gap-1">
                      <Briefcase className="size-3" />
                      <span>{profileRole}</span>
                    </Badge>
                  )}
                  <Badge
                    variant={isVerified ? "success" : "outline"}
                    className="text-[10px] uppercase font-semibold"
                  >
                    {isVerified ? "Verified Student" : "Pending Verification"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-medium">@{profile.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              {isOwner ? (
                <Button asChild size="sm" className="w-full sm:w-auto gap-1.5 shadow-xs font-semibold">
                  <Link href="/profile">
                    <Edit3 className="size-3.5" />
                    <span>Edit Profile</span>
                  </Link>
                </Button>
              ) : (
                <Button asChild size="sm" className="w-full sm:w-auto gap-1.5 shadow-xs">
                  <Link href={`/discover?candidate=${profile.id}`}>
                    <Mail className="size-3.5" />
                    <span>Invite to Team Role</span>
                  </Link>
                </Button>
              )}
              <BookmarkButton
                targetType="USER"
                targetId={profile.id}
                size="icon"
                variant="outline"
                className="size-9 shrink-0 border-border/80"
              />
            </div>
          </div>

          {/* Key Metadata & Secondary Trust Rating */}
          <div className="mt-6 pt-4 border-t border-border/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block">Availability</span>
              <span className="font-semibold text-foreground mt-0.5 inline-flex items-center gap-1">
                <Clock className="size-3.5 text-emerald-500" />
                {profile.availability.replace(/_/g, " ")}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Institution &amp; Major</span>
              <span className="font-semibold text-foreground mt-0.5 inline-flex items-center gap-1 truncate max-w-[200px]">
                <Building className="size-3.5 text-primary shrink-0" />
                {profile.department?.name || "Student"}
                {profile.year ? ` · Yr ${profile.year}` : ""}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Peer Trust Rating</span>
              <span className="font-semibold text-foreground mt-0.5 inline-flex items-center gap-1">
                <Star className="size-3.5 fill-amber-400 text-amber-500" />
                {profile.stats.totalRatings > 0 ? (
                  <span>
                    <strong>{profile.stats.avgRating}</strong> ({profile.stats.totalRatings}{" "}
                    {profile.stats.totalRatings === 1 ? "review" : "reviews"})
                  </span>
                ) : (
                  <span className="text-muted-foreground">No ratings yet</span>
                )}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Joined Platform</span>
              <span className="font-semibold text-foreground mt-0.5 inline-flex items-center gap-1">
                <Calendar className="size-3.5 text-muted-foreground" />
                {new Date(profile.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: 2 Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column (2/3 width): Bio, Skills, Projects */}
        <div className="md:col-span-2 space-y-8">
          {/* Bio Section */}
          <Card className="border-border/80 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">About Candidate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                {cleanBio || "This candidate has not added a bio yet."}
              </p>
            </CardContent>
          </Card>

          {/* Technical Skills Section */}
          <Card className="border-border/80 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Layers className="size-4 text-primary" />
                  <span>Technical Skills</span>
                </CardTitle>
                <span className="text-xs text-muted-foreground font-medium">
                  {profile.skills.length} skills listed
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {profile.skills.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No technical skills listed.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {profile.skills.map(({ skill, level }) => {
                    const levelMeta = SKILL_LEVEL_OPTIONS.find((l) => l.value === level)
                    return (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-border/80 bg-muted/20"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="size-7 rounded-lg bg-background border border-border flex items-center justify-center shrink-0 shadow-2xs">
                            <TechIcon name={skill.name} className="size-3.5" />
                          </div>
                          <span className="text-xs font-semibold text-foreground truncate">
                            {skill.name}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[9px] uppercase tracking-wider font-semibold py-0 px-1.5 ${levelMeta?.color || ""}`}
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

          {/* Projects Portfolio Section */}
          <Card className="border-border/80 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Code2 className="size-4 text-primary" />
                <span>Portfolio Projects ({profile.projects.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.projects.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No projects added yet.</p>
              ) : (
                profile.projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-4 rounded-xl border border-border/80 bg-card space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{proj.title}</h4>
                        <span className="text-xs text-primary font-medium">{proj.role}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(proj.date).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {proj.description}
                    </p>

                    {proj.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {proj.skills.map(({ skill }) => (
                          <Badge key={skill.id} variant="secondary" className="text-[10px] font-normal py-0">
                            {skill.name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 pt-1 text-xs">
                      {proj.githubLink && (
                        <a
                          href={proj.githubLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-medium"
                        >
                          <Code2 className="size-3.5" />
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
        </div>

        {/* Right Column (1/3 width): Ratings, Interests, Achievements */}
        <div className="space-y-6">
          {/* Peer Ratings Breakdown */}
          <RatingBreakdownCard ratings={profile.ratingsReceived} candidateName={profile.name} />

          {/* Domain Interests */}
          <Card className="border-border/80 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="size-4 text-purple-500" />
                <span>Interests &amp; Domains</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.interests.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No interests specified.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map(({ skill }) => (
                    <Badge
                      key={skill.id}
                      variant="outline"
                      className="text-xs font-medium py-1 px-2.5 bg-muted/40 border-border/80"
                    >
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Awards & Achievements */}
          <Card className="border-border/80 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Trophy className="size-4 text-amber-500" />
                <span>Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.achievements.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No awards listed.</p>
              ) : (
                profile.achievements.map((ach) => (
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
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
