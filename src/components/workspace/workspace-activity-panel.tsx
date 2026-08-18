"use client"

import * as React from "react"
import {
  Activity,
  UserPlus,
  Link as LinkIcon,
  FolderOpen,
  MessageSquare,
  Sparkles,
} from "lucide-react"
import { WorkspaceActivity } from "@/app/actions/workspace"

interface WorkspaceActivityPanelProps {
  activities: WorkspaceActivity[]
}

export function WorkspaceActivityPanel({
  activities,
}: WorkspaceActivityPanelProps) {
  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case "MEMBER_JOINED":
        return <UserPlus className="h-3.5 w-3.5 text-emerald-500" />
      case "LINK_ADDED":
        return <LinkIcon className="h-3.5 w-3.5 text-indigo-500" />
      case "FILE_ADDED":
        return <FolderOpen className="h-3.5 w-3.5 text-amber-500" />
      case "MESSAGE_SENT":
        return <MessageSquare className="h-3.5 w-3.5 text-primary" />
      default:
        return <Activity className="h-3.5 w-3.5 text-muted-foreground" />
    }
  }

  const formatActivityTime = (date: Date) => {
    const d = new Date(date)
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Recent Team Activity
        </h3>
      </div>

      {activities.length === 0 ? (
        <div className="p-6 rounded-lg border border-dashed border-border text-center space-y-2 bg-muted/20">
          <Sparkles className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
          <p className="text-xs text-muted-foreground">
            No activity logged yet. Join the conversation or share resources to start collaborating!
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-border">
          {activities.map((act) => (
            <div key={act.id} className="relative flex items-start gap-2.5">
              <div className="absolute -left-6 top-0.5 p-1 rounded-full bg-card border border-border">
                {getActivityIcon(act.actionType)}
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs text-foreground leading-snug">
                  {act.description}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatActivityTime(act.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
