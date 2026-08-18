"use client"

import * as React from "react"
import Link from "next/link"
import {
  Activity,
  UserPlus,
  MessageSquare,
  Star,
  Sparkles,
  FileText,
  Layers,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { DashboardData } from "@/app/actions/dashboard"
import { cn } from "@/lib/utils"

interface ActivityStreamCardProps {
  activity: DashboardData["recentActivity"]
}

function getRelativeTime(date: Date | string): string {
  const now = new Date().getTime()
  const past = new Date(date).getTime()
  const diffInSeconds = Math.floor((now - past) / 1000)

  if (diffInSeconds < 60) return "Just now"
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function getActivityMeta(actionType: string) {
  switch (actionType) {
    case "MEMBER_JOINED":
    case "APPLICATION_ACCEPTED":
    case "INVITATION_ACCEPTED":
      return {
        icon: UserPlus,
        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        label: "Member Joined",
      }
    case "RATING_SUBMITTED":
      return {
        icon: Star,
        color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        label: "Peer Review",
      }
    case "MESSAGE_SENT":
    case "CHAT":
      return {
        icon: MessageSquare,
        color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        label: "Conversation",
      }
    case "FILE_UPLOADED":
    case "LINK_ADDED":
      return {
        icon: FileText,
        color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
        label: "Resource",
      }
    case "ROLE_CREATED":
    case "ROLE_FILLED":
      return {
        icon: Sparkles,
        color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
        label: "Squad Goal",
      }
    default:
      return {
        icon: Activity,
        color: "text-primary bg-primary/10 border-primary/20",
        label: "Activity",
      }
  }
}

export function ActivityStreamCard({ activity }: ActivityStreamCardProps) {
  return (
    <Card className="border-border/80 bg-card/60 shadow-xs backdrop-blur-xs flex flex-col h-full">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-emerald-500" />
          <CardTitle className="text-base font-semibold tracking-tight text-foreground">
            Recent Activity
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground mt-0.5">
          Real-time milestones, team joins, and peer reviews across your network.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        {activity.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-8 px-4 rounded-xl border border-dashed border-border/80 bg-muted/20 my-auto">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground mb-3">
              <Layers className="size-6" />
            </div>
            <h4 className="text-sm font-semibold text-foreground mb-1">
              No Activity Recorded Yet
            </h4>
            <p className="text-xs text-muted-foreground max-w-xs">
              When teammates join your squads, submit reviews, or share resources, milestones will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3" role="feed" aria-label="Activity Feed">
            {activity.map((item) => {
              const meta = getActivityMeta(item.actionType)
              const Icon = meta.icon
              const relativeTime = getRelativeTime(item.createdAt)

              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-background/60 hover:bg-muted/30 transition-colors"
                  role="article"
                >
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                      meta.color
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-foreground">
                        {meta.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {relativeTime}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                    {item.teamId && item.teamName && (
                      <div className="mt-1.5">
                        <Link
                          href={`/teams/${item.teamId}`}
                          className="inline-flex items-center text-[11px] font-medium text-primary hover:underline"
                        >
                          <span>{item.teamName}</span>
                        </Link>
                      </div>
                    )}
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
