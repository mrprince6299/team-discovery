'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { EventShowcaseData } from '@/app/actions/events'
import {
  Calendar,
  Users,
  Clock,
  Sparkles,
  ArrowLeft,
  PlusCircle,
  Shield,
  Megaphone,
  ArrowRight,
  Code2,
  CheckCircle2,
  Trophy,
  Layers,
} from 'lucide-react'

interface EventDetailsClientProps {
  event: EventShowcaseData
}

export function EventDetailsClient({ event }: EventDetailsClientProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REGISTRATION_OPEN':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 text-xs uppercase font-bold gap-1 py-1">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Registration Open</span>
          </Badge>
        )
      case 'ONGOING':
        return (
          <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/40 text-xs uppercase font-bold gap-1 py-1">
            <Sparkles className="size-3.5 text-purple-500" />
            <span>Live Hackathon</span>
          </Badge>
        )
      case 'REGISTRATION_CLOSED':
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 text-xs uppercase font-bold gap-1 py-1">
            <Clock className="size-3.5 text-amber-500" />
            <span>Registration Closed</span>
          </Badge>
        )
      case 'PUBLISHED':
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/40 text-xs uppercase font-bold gap-1 py-1">
            <Calendar className="size-3.5 text-blue-500" />
            <span>Upcoming</span>
          </Badge>
        )
      case 'COMPLETED':
        return (
          <Badge variant="outline" className="text-xs uppercase font-semibold text-muted-foreground gap-1 py-1">
            <Trophy className="size-3.5 text-muted-foreground" />
            <span>Completed</span>
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs uppercase font-semibold text-muted-foreground">
            {status.replace(/_/g, ' ')}
          </Badge>
        )
    }
  }

  const getDeadlineText = (deadline: Date, status: string) => {
    const d = new Date(deadline)
    const now = new Date()
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (status === 'REGISTRATION_CLOSED' || diffDays < 0) {
      return 'Registration Closed'
    }

    if (diffDays === 0) return 'Closes today!'
    if (diffDays === 1) return 'Closes tomorrow!'
    if (diffDays <= 3) return `Closes in ${diffDays} days`

    return `Closes on ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  const totalOpenRoles = event.teams.reduce((acc, t) => acc + t.openRoles.length, 0)
  const isRegistered = event.currentUserState?.isRegistered
  const hasPendingApp = event.currentUserState?.hasPendingApplication

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Back Navigation */}
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Link href="/events">
            <ArrowLeft className="size-3.5" />
            <span>Back to Events Showcase</span>
          </Link>
        </Button>
      </div>

      {/* Event Hero Card */}
      <Card className="border-border/80 bg-card shadow-sm rounded-2xl overflow-hidden">
        {event.bannerUrl ? (
          <div className="relative w-full h-48 sm:h-64 md:h-72 bg-muted overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.bannerUrl}
              alt={event.name}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
          </div>
        ) : (
          <div className="h-28 bg-gradient-to-r from-primary/20 via-indigo-500/15 to-emerald-500/20" />
        )}

        <CardContent className={`p-6 sm:p-8 space-y-6 ${event.bannerUrl ? "relative z-10 -mt-8 sm:-mt-12" : "-mt-10"}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {event.name}
                </h1>
                {getStatusBadge(event.status)}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
                {event.description}
              </p>
            </div>

            {/* Primary Action Button based on Student Participation State */}
            <div className="shrink-0 flex flex-col sm:items-end gap-2 w-full sm:w-auto">
              {isRegistered ? (
                <div className="space-y-1.5 w-full sm:w-auto text-left sm:text-right">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                    <CheckCircle2 className="size-3.5" />
                    <span>Competing with &ldquo;{event.currentUserState?.teamName}&rdquo;</span>
                  </div>
                  <div>
                    <Button asChild className="bg-primary text-primary-foreground font-semibold shadow-xs w-full sm:w-auto">
                      <Link href={`/teams/${event.currentUserState?.teamId}/workspace`}>
                        <Layers className="mr-2 h-4 w-4" />
                        <span>Go to Squad Workspace</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : hasPendingApp ? (
                <div className="space-y-1.5 w-full sm:w-auto text-left sm:text-right">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                    <Clock className="size-3.5" />
                    <span>Application pending for &ldquo;{event.currentUserState?.pendingTeamName}&rdquo;</span>
                  </div>
                  <div>
                    <Button asChild variant="outline" className="w-full sm:w-auto text-xs">
                      <Link href="/applications">
                        <span>View My Applications</span>
                        <ArrowRight className="ml-1.5 size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : event.status === 'REGISTRATION_OPEN' ? (
                <Button asChild className="bg-primary text-primary-foreground font-semibold shadow-xs w-full sm:w-auto">
                  <Link href={`/teams/create?eventId=${event.id}`}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span>Create Squad for Event</span>
                  </Link>
                </Button>
              ) : event.status === 'REGISTRATION_CLOSED' ? (
                <Button disabled variant="secondary" className="w-full sm:w-auto text-xs font-semibold">
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Registration Closed</span>
                </Button>
              ) : (
                <Button asChild variant="outline" className="w-full sm:w-auto text-xs font-semibold">
                  <Link href="#competing-squads">
                    <span>View Competing Squads</span>
                    <ArrowRight className="ml-1.5 size-3.5" />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Key Event Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/60 text-xs">
            <div className="space-y-0.5">
              <span className="text-muted-foreground block text-[11px] uppercase font-semibold">Event Timeline</span>
              <span className="font-semibold text-foreground inline-flex items-center gap-1">
                <Calendar className="size-3.5 text-primary shrink-0" />
                <span>
                  {new Date(event.startDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  –{' '}
                  {new Date(event.endDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-muted-foreground block text-[11px] uppercase font-semibold">Registration Deadline</span>
              <span className="font-semibold text-foreground inline-flex items-center gap-1">
                <Clock className="size-3.5 text-amber-500 shrink-0" />
                <span>{getDeadlineText(event.registrationDeadline, event.status)}</span>
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-muted-foreground block text-[11px] uppercase font-semibold">Squad Size Rules</span>
              <span className="font-semibold text-foreground inline-flex items-center gap-1">
                <Users className="size-3.5 text-indigo-500 shrink-0" />
                <span>{event.teamSizeInfo || '2 – 5 Builders'}</span>
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-muted-foreground block text-[11px] uppercase font-semibold">Competing Squads</span>
              <span className="font-semibold text-foreground inline-flex items-center gap-1">
                <Sparkles className="size-3.5 text-emerald-500 shrink-0" />
                <span>
                  <strong>{event.teams.length}</strong> Squads ({totalOpenRoles} open seats)
                </span>
              </span>
            </div>
          </div>

          {/* Event Rules & Guidelines Box */}
          {event.rules && (
            <div className="p-4 rounded-xl bg-muted/20 border border-border/60 space-y-2 text-xs">
              <div className="font-bold text-foreground flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <Shield className="size-3.5 text-primary" />
                <span>Challenge Guidelines &amp; Submission Rules</span>
              </div>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {event.rules}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Announcements Panel (if present) */}
      {event.announcements.length > 0 && (
        <Card className="border-border/80 shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 bg-muted/10 border-b border-border/40">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Megaphone className="size-4 text-indigo-500" />
              <span>Event Announcements ({event.announcements.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 divide-y divide-border/60">
            {event.announcements.map((ann) => (
              <div key={ann.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">{ann.title}</span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {new Date(ann.publishedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{ann.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Registered Competing Squads Section */}
      <div id="competing-squads" className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Users className="size-5 text-primary" />
              <span>Competing Squads ({event.teams.length})</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Teams formed for this competition. Browse open recruitment roles or apply to join an existing roster.
            </p>
          </div>

          {event.status === 'REGISTRATION_OPEN' && !isRegistered && (
            <Button asChild size="sm" className="text-xs font-semibold bg-primary text-primary-foreground shadow-xs shrink-0">
              <Link href={`/teams/create?eventId=${event.id}`}>
                <PlusCircle className="mr-1.5 size-3.5" />
                <span>Form Squad for Event</span>
              </Link>
            </Button>
          )}
        </div>

        {event.teams.length === 0 ? (
          <Card className="border-dashed border-2 border-border/80 rounded-2xl p-12 text-center space-y-3 bg-card">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
              <Users className="size-6" />
            </div>
            <CardTitle className="text-base font-bold text-foreground">No squads registered yet</CardTitle>
            <CardDescription className="text-xs max-w-md mx-auto">
              Be the first team to enter this event! Form a squad and recruit talented builders with matching skills.
            </CardDescription>
            {event.status === 'REGISTRATION_OPEN' && (
              <Button asChild size="sm" className="mt-2 bg-primary text-primary-foreground font-semibold shadow-xs">
                <Link href={`/teams/create?eventId=${event.id}`}>
                  <PlusCircle className="mr-1.5 size-3.5" />
                  <span>Register First Squad</span>
                </Link>
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {event.teams.map((team) => (
              <Card
                key={team.id}
                className="border-border/80 bg-card hover:border-primary/40 hover:shadow-md transition-all rounded-2xl flex flex-col justify-between overflow-hidden shadow-xs"
              >
                <CardHeader className="p-5 pb-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base font-bold text-foreground line-clamp-1">
                      {team.name}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                      {team.status}
                    </Badge>
                  </div>

                  <CardDescription className="text-xs leading-relaxed line-clamp-2">
                    {team.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-4">
                  {/* Member Avatar Stack */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground block">
                      Squad Roster ({team.memberCount})
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {team.members.map((m) => (
                        <div
                          key={m.id}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-border/80 bg-muted/20 text-xs"
                        >
                          <Avatar className="size-4 rounded-full">
                            <AvatarImage src={m.avatarUrl || undefined} alt={m.name} />
                            <AvatarFallback className="text-[8px]">{m.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-foreground">{m.name}</span>
                          {m.membershipRole === 'LEADER' && (
                            <span className="text-[9px] text-amber-500 font-bold">★ Leader</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Open Recruitment Roles */}
                  {team.openRoles.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-border/40">
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Sparkles className="size-3" />
                        Open Roles ({team.openRoles.length}):
                      </span>
                      <div className="space-y-1.5">
                        {team.openRoles.map((role) => (
                          <div
                            key={role.id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs"
                          >
                            <div className="space-y-0.5">
                              <span className="font-semibold text-foreground">{role.name}</span>
                              {role.skills.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                  {role.skills.map((skill) => (
                                    <Badge
                                      key={skill}
                                      variant="secondary"
                                      className="text-[9px] px-1 py-0"
                                    >
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] shrink-0 ml-2">
                              {role.seatsRequired} {role.seatsRequired === 1 ? 'seat' : 'seats'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Team Profile Link CTA */}
                  <div className="pt-2">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="w-full text-xs font-semibold hover:border-primary/40 rounded-xl"
                    >
                      <Link href={`/teams/${team.id}`}>
                        <Code2 className="mr-1.5 size-3.5 text-primary" />
                        <span>View Squad Profile &amp; Apply</span>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
