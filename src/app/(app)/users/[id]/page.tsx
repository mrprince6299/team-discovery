import Link from "next/link"
import { notFound } from "next/navigation"
import { getPublicProfile } from "@/app/actions/profile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookmarkButton } from "@/components/bookmarks/bookmark-button"
import { RatingBreakdownCard } from "@/components/ratings/rating-breakdown-card"
import { ReviewCard } from "@/components/ratings/review-card"
import {
  Star,
  Clock,
  ExternalLink,
  Code2,
  PenTool,
  Globe,
  Trophy,
  Layers,
  Sparkles,
  ArrowLeft,
  Mail,
  Calendar,
  Building,
} from "lucide-react"

interface PublicProfilePageProps {
  params: Promise<{ id: string }>
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { id } = await params
  const profile = await getPublicProfile(id)

  if (!profile) {
    notFound()
  }

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
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <Link href="/profile">
            <ArrowLeft className="size-3.5" />
            <span>Back to Profile Editor</span>
          </Link>
        </Button>
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
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{profile.name}</h1>
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
              <Button asChild size="sm" className="w-full sm:w-auto gap-1.5 shadow-xs">
                <Link href={`/discover?candidate=${profile.id}`}>
                  <Mail className="size-3.5" />
                  <span>Invite to Team Role</span>
                </Link>
              </Button>
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

      {/* Bio / Summary */}
      {profile.bio && (
        <Card className="border-border/80 shadow-xs rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              About
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
              {profile.bio}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Technical Skills & Interests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skills */}
        <Card className="border-border/80 shadow-xs rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <span>Verified Skills</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Primary ranking factors for deterministic role matching.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profile.skills.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No skills listed.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map(({ skill, level }) => (
                  <div
                    key={skill.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/80 bg-muted/20 text-xs"
                  >
                    <span className="font-semibold text-foreground">{skill.name}</span>
                    <Badge
                      variant={
                        level === "ADVANCED"
                          ? "exact"
                          : level === "INTERMEDIATE"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-[9px] px-1 py-0"
                    >
                      {level}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interests */}
        <Card className="border-border/80 shadow-xs rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <span>Domain Interests</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Technologies and topics the candidate is eager to work on.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profile.interests.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No interests listed.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.map(({ skill }) => (
                  <Badge key={skill.id} variant="interest" className="text-xs px-2.5 py-0.5">
                    {skill.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Public Projects (Portfolio) */}
      <Card className="border-border/80 shadow-xs rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">Public Project Portfolio</CardTitle>
          <CardDescription className="text-xs">
            Verifiable hackathon builds, production applications, and open-source code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profile.projects.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-border rounded-xl space-y-1">
              <p className="text-xs text-muted-foreground">No public projects available for this candidate.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.projects.map((project) => (
                <Card
                  key={project.id}
                  className="border-border/80 bg-muted/10 hover:border-border transition-colors rounded-xl flex flex-col justify-between"
                >
                  <CardHeader className="pb-2 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-bold text-foreground">
                        {project.title}
                      </CardTitle>
                      <BookmarkButton
                        targetType="PROJECT"
                        targetId={project.id}
                        size="icon"
                        className="size-7 shrink-0 -mt-1"
                      />
                    </div>
                    <div className="text-xs font-semibold text-primary">{project.role}</div>
                    <CardDescription className="text-xs leading-relaxed line-clamp-3">
                      {project.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 pb-4">
                    {/* Project Skills */}
                    {project.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.skills.map(({ skill }) => (
                          <Badge key={skill.id} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {skill.name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* External Links */}
                    <div className="flex items-center gap-3 text-xs pt-2 border-t border-border/40">
                      {project.githubLink && (
                        <a
                          href={project.githubLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Code2 className="size-3.5" />
                          <span>Code</span>
                        </a>
                      )}
                      {project.figmaLink && (
                        <a
                          href={project.figmaLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <PenTool className="size-3.5" />
                          <span>Figma</span>
                        </a>
                      )}
                      {project.demoLink && (
                        <a
                          href={project.demoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Globe className="size-3.5" />
                          <span>Live Demo</span>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievements */}
      {profile.achievements.length > 0 && (
        <Card className="border-border/80 shadow-xs rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Trophy className="size-4 text-amber-500" />
              <span>Hackathon Awards &amp; Honors</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-start justify-between p-3.5 rounded-xl border border-border/80 bg-muted/20"
              >
                <div className="space-y-1">
                  <div className="font-bold text-sm text-foreground">{achievement.title}</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {achievement.description}
                  </p>
                  {achievement.link && (
                    <div className="pt-1">
                      <a
                        href={achievement.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <span>Verified Certificate</span>
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Peer Reviews & Trust Breakdown */}
      <div className="space-y-6">
        <RatingBreakdownCard
          ratings={profile.ratingsReceived}
          candidateName={profile.name}
        />

        {profile.ratingsReceived.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
              <Star className="size-4 fill-amber-400 text-amber-500" />
              <span>Individual Peer Reviews ({profile.ratingsReceived.length})</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.ratingsReceived.map((rating) => (
                <ReviewCard key={rating.id} rating={rating} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
