"use client"

import * as React from "react"
import Link from "next/link"
import {
  Users,
  Shield,
  MessageSquare,
  ArrowRight,
  PlusCircle,
  Compass,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { DashboardData } from "@/app/actions/dashboard"

interface ActiveSquadsCardProps {
  squads: DashboardData["activeSquads"]
}

export function ActiveSquadsCard({ squads }: ActiveSquadsCardProps) {
  return (
    <Card className="border-border/80 bg-card/60 shadow-xs backdrop-blur-xs flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <Users className="size-4 text-primary" />
            <CardTitle className="text-base font-semibold tracking-tight text-foreground">
              Active Squads
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Your active team collaborations and project workspaces.
          </CardDescription>
        </div>
        {squads.length > 0 && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
          >
            <Link href="/teams">
              <span>All Teams</span>
              <ArrowRight className="size-3" />
            </Link>
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        {squads.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-8 px-4 rounded-xl border border-dashed border-border/80 bg-muted/20 my-auto">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
              <Compass className="size-6" />
            </div>
            <h4 className="text-sm font-semibold text-foreground mb-1">
              No Active Squads Yet
            </h4>
            <p className="text-xs text-muted-foreground max-w-xs mb-4">
              You haven&apos;t joined any project squads. Explore open recruitment roles or create your own squad.
            </p>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Button asChild size="sm" className="h-8 text-xs gap-1.5 font-medium">
                <Link href="/discover">
                  <Compass className="size-3.5" />
                  <span>Discover Teammates</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5 font-medium">
                <Link href="/teams/create">
                  <PlusCircle className="size-3.5" />
                  <span>Create Squad</span>
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {squads.map((squad) => {
              const isLeader = squad.membershipRole === "LEADER" || squad.membershipRole === "CO_LEADER"
              return (
                <div
                  key={squad.id}
                  className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-border/60 bg-background/80 hover:bg-muted/40 hover:border-primary/40 transition-all duration-200 gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link
                        href={`/teams/${squad.id}`}
                        className="font-semibold text-sm text-foreground hover:text-primary transition-colors truncate"
                      >
                        {squad.name}
                      </Link>
                      <Badge
                        variant={isLeader ? "default" : "secondary"}
                        className="text-[10px] font-semibold tracking-wider h-4 px-1.5"
                      >
                        {squad.membershipRole}
                      </Badge>
                      {squad.event && (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-muted-foreground border-border/80 h-4 px-1.5 flex items-center gap-1"
                        >
                          <Calendar className="size-2.5" />
                          <span className="truncate max-w-[120px]">{squad.event.name}</span>
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {squad.description || "Building something extraordinary together."}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="size-3 text-muted-foreground" />
                        <span>{squad.memberCount} member{squad.memberCount !== 1 ? "s" : ""}</span>
                      </span>
                      {squad.myRoleName && (
                        <span className="flex items-center gap-1 text-foreground/80">
                          <Shield className="size-3 text-primary" />
                          <span>{squad.myRoleName}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      asChild
                      size="sm"
                      className="h-7 text-xs gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 font-medium"
                    >
                      <Link href={`/teams/${squad.id}/workspace`}>
                        <MessageSquare className="size-3" />
                        <span>Workspace</span>
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Link href={`/teams/${squad.id}`}>
                        <span>Details</span>
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
