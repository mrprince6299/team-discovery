"use client"

import * as React from "react"
import Link from "next/link"
import {
  Calendar,
  ArrowRight,
  Trophy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { DashboardData } from "@/app/actions/dashboard"
import { cn } from "@/lib/utils"

interface RegisteredEventsCardProps {
  events: DashboardData["registeredEvents"]
}

function getEventCountdown(startDate: Date | string, registrationDeadline: Date | string, status: string): {
  label: string
  badgeVariant: "default" | "secondary" | "success" | "destructive" | "outline"
  customClass?: string
} {
  const now = new Date().getTime()
  const start = new Date(startDate).getTime()
  const deadline = new Date(registrationDeadline).getTime()

  if (status === "COMPLETED") {
    return { label: "Completed", badgeVariant: "secondary" }
  }

  if (now > start) {
    return { label: "Live / In Progress", badgeVariant: "success" }
  }

  const diffDaysToStart = Math.ceil((start - now) / (1000 * 60 * 60 * 24))
  const diffDaysToDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))

  if (diffDaysToDeadline > 0) {
    return {
      label: `Reg closes in ${diffDaysToDeadline}d`,
      badgeVariant: "secondary",
      customClass: "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold",
    }
  }

  if (diffDaysToStart > 0) {
    return { label: `Starts in ${diffDaysToStart}d`, badgeVariant: "default" }
  }

  return { label: "Upcoming", badgeVariant: "outline" }
}

export function RegisteredEventsCard({ events }: RegisteredEventsCardProps) {
  return (
    <Card className="border-border/80 bg-card/60 shadow-xs backdrop-blur-xs flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="size-4 text-amber-500" />
            <CardTitle className="text-base font-semibold tracking-tight text-foreground">
              Event Competitions
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Hackathons and showcase challenges your squads are registered for.
          </CardDescription>
        </div>
        {events.length > 0 && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
          >
            <Link href="/events">
              <span>All Events</span>
              <ArrowRight className="size-3" />
            </Link>
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-8 px-4 rounded-xl border border-dashed border-border/80 bg-muted/20 my-auto">
            <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 mb-3">
              <Calendar className="size-6" />
            </div>
            <h4 className="text-sm font-semibold text-foreground mb-1">
              No Registered Events
            </h4>
            <p className="text-xs text-muted-foreground max-w-xs mb-4">
              Your squads are not currently participating in any active hackathons or campus challenges.
            </p>
            <Button asChild size="sm" className="h-8 text-xs gap-1.5 font-medium">
              <Link href="/events">
                <Calendar className="size-3.5" />
                <span>Explore Events</span>
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const countdown = getEventCountdown(event.startDate, event.registrationDeadline, event.status)
              const startFormatted = new Date(event.startDate).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })
              const endFormatted = new Date(event.endDate).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })

              return (
                <div
                  key={event.id}
                  className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-border/60 bg-background/80 hover:bg-muted/40 hover:border-amber-500/40 transition-all duration-200 gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link
                        href={`/events/${event.id}`}
                        className="font-semibold text-sm text-foreground hover:text-primary transition-colors truncate"
                      >
                        {event.name}
                      </Link>
                      <Badge
                        variant={countdown.badgeVariant}
                        className={cn("text-[10px] font-semibold tracking-wider h-4 px-1.5", countdown.customClass)}
                      >
                        {countdown.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {event.description || "Compete, build, and showcase your team innovations."}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3 text-muted-foreground" />
                        <span>{startFormatted} – {endFormatted}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 font-medium border-border/80 hover:border-primary/40"
                    >
                      <Link href={`/events/${event.id}`}>
                        <span>Showcase</span>
                        <ArrowRight className="size-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
