"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Users,
  FileText,
  Mail,
  Bookmark,
  Star,
  Compass,
  PlusCircle,
  Award,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DashboardData } from "@/app/actions/dashboard"
import { SavedItemsSheet } from "@/components/bookmarks/saved-items-sheet"
import { ActiveSquadsCard } from "./active-squads-card"
import { PendingActionsStrip } from "./pending-actions-strip"
import { RegisteredEventsCard } from "./registered-events-card"
import { ActivityStreamCard } from "./activity-stream-card"
import { cn } from "@/lib/utils"

interface DashboardClientProps {
  data: DashboardData
}

export function DashboardClient({ data }: DashboardClientProps) {
  const {
    user,
    metrics,
    activeSquads,
    pendingInvitations,
    pendingApplications,
    registeredEvents,
    recentActivity,
  } = data

  const isVerified = user.verificationStatus === "APPROVED"

  const metricCards = [
    {
      title: "Active Squads",
      value: metrics.activeSquadsCount,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      href: "/teams",
    },
    {
      title: "Applications",
      value: metrics.pendingApplicationsCount,
      icon: FileText,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/20",
      href: "/applications",
    },
    {
      title: "Invitations",
      value: metrics.pendingInvitationsCount,
      icon: Mail,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      href: "/invitations",
    },
    {
      title: "Saved Items",
      value: metrics.savedItemsCount,
      icon: Bookmark,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      href: "#",
    },
    {
      title: "Peer Reviews",
      value: metrics.peerReviewsCount,
      icon: Award,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/20",
      href: "/profile",
    },
    {
      title: "Average Rating",
      value: metrics.avgRating ? `${metrics.avgRating} ★` : "—",
      icon: Star,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      href: "/profile",
    },
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* 1. Hero Command Center Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card/80 to-background shadow-xs">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant={isVerified ? "success" : "outline"}
                className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5"
              >
                {isVerified ? "Verified Builder" : "Pending Verification"}
              </Badge>
              <Badge
                variant="secondary"
                className="text-[10px] uppercase font-medium tracking-wider px-2 py-0.5"
              >
                {user.availability.replace(/_/g, " ")}
              </Badge>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
                Welcome back, <span className="text-primary">{user.name.split(" ")[0]}</span>!
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1.5 max-w-xl leading-relaxed">
                Your personal operations command center. Track your squad momentum, respond to invites, and lead hackathon teams.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap pt-2">
              <Button asChild size="default" className="gap-2 font-semibold shadow-xs">
                <Link href="/discover">
                  <Compass className="size-4" />
                  <span>Find Teammates</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="default" className="gap-2 font-semibold border-border/80 hover:border-primary/40">
                <Link href="/teams/create">
                  <PlusCircle className="size-4" />
                  <span>Form Squad</span>
                </Link>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5 hidden lg:block relative h-48 xl:h-56 rounded-xl overflow-hidden border border-border/60 shadow-xs">
            <Image
              src="/images/dashboard-hero.jpg"
              alt="Team Discovery Command Center Illustration"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      {/* 2. Compact Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon
          const cardElement = (
            <Card
              className={cn(
                "border bg-card/60 hover:bg-card/90 transition-all duration-200 shadow-xs group",
                card.borderColor,
                card.title === "Saved Items" && "cursor-pointer"
              )}
            >
              <CardContent className="p-3.5 sm:p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-medium text-muted-foreground truncate">
                    {card.title}
                  </span>
                  <div
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg border",
                      card.color,
                      card.bgColor,
                      card.borderColor
                    )}
                  >
                    <Icon className="size-3.5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {card.value}
                </div>
              </CardContent>
            </Card>
          )

          if (card.title === "Saved Items") {
            return (
              <SavedItemsSheet key={card.title} triggerClassName="text-left block h-full">
                {cardElement}
              </SavedItemsSheet>
            )
          }

          return <div key={card.title}>{cardElement}</div>
        })}
      </div>

      {/* 3. Items Requiring Attention */}
      <PendingActionsStrip
        metrics={metrics}
        pendingInvitations={pendingInvitations}
        pendingApplications={pendingApplications}
        unreadNotificationsCount={user.unreadNotificationsCount}
      />

      {/* 4. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Squads & Registered Events */}
        <div className="lg:col-span-7 space-y-6">
          <ActiveSquadsCard squads={activeSquads} />
          <RegisteredEventsCard events={registeredEvents} />
        </div>

        {/* Right Column: Activity Stream & Quick Launch */}
        <div className="lg:col-span-5 space-y-6">
          <ActivityStreamCard activity={recentActivity} />

          {/* Quick Launch Shortcuts */}
          <Card className="border-border/80 bg-card/60 shadow-xs backdrop-blur-xs">
            <CardContent className="p-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Quick Shortcuts
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs justify-start font-medium border-border/80 hover:border-primary/40 truncate"
                >
                  <Link href="/profile">
                    <span>My Profile</span>
                  </Link>
                </Button>
                <SavedItemsSheet triggerClassName="w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs justify-start font-medium border-border/80 hover:border-primary/40 truncate"
                  >
                    <span>Saved Shortlist</span>
                  </Button>
                </SavedItemsSheet>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs justify-start font-medium border-border/80 hover:border-primary/40 truncate"
                >
                  <Link href="/teams">
                    <span>Browse Teams</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs justify-start font-medium border-border/80 hover:border-primary/40 truncate"
                >
                  <Link href="/notifications">
                    <span>Notification Center</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
