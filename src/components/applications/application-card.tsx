"use client"

import * as React from "react"
import { useTransition } from "react"
import Link from "next/link"
import {
  Calendar,
  Layers,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Trash2,
} from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { withdrawApplication } from "@/app/actions/applications"
import { toast } from "sonner"

export interface SentApplication {
  id: string
  teamId: string
  teamName: string
  teamDescription: string
  eventName?: string | null
  roleId: string
  roleName: string
  roleStatus: string
  requiredSkills: Array<{ id: string; name: string }>
  message?: string | null
  status: string
  createdAt: Date
}

interface ApplicationCardProps {
  application: SentApplication
  onStatusChanged?: () => void
}

export function ApplicationCard({ application, onStatusChanged }: ApplicationCardProps) {
  const [isPending, startTransition] = useTransition()

  const handleWithdraw = () => {
    startTransition(async () => {
      const res = await withdrawApplication(application.id)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Application withdrawn successfully.")
        if (onStatusChanged) onStatusChanged()
      }
    })
  }

  const formattedDate = new Date(application.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  // Status Badge Rendering
  let badgeVariant: "exact" | "related" | "secondary" | "destructive" | "outline" = "outline"
  let badgeIcon = <Clock className="size-3" />
  let explanation = ""

  switch (application.status) {
    case "PENDING":
      badgeVariant = "outline"
      badgeIcon = <Clock className="size-3 text-amber-500" />
      explanation = "Awaiting review by the team leader."
      break
    case "ACCEPTED":
      badgeVariant = "exact"
      badgeIcon = <CheckCircle2 className="size-3 text-emerald-500" />
      explanation = "You have been accepted into this team!"
      break
    case "REJECTED":
      badgeVariant = "destructive"
      badgeIcon = <XCircle className="size-3 text-destructive" />
      explanation = "The team leader decided to move forward with other candidates."
      break
    case "AUTO_CLOSED":
      badgeVariant = "secondary"
      badgeIcon = <AlertCircle className="size-3 text-muted-foreground" />
      explanation = "Role filled by another applicant."
      break
    case "WITHDRAWN":
      badgeVariant = "secondary"
      badgeIcon = <XCircle className="size-3 text-muted-foreground" />
      explanation = "You withdrew this application."
      break
    default:
      badgeVariant = "outline"
      badgeIcon = <Clock className="size-3" />
      explanation = ""
  }

  return (
    <Card className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card shadow-xs">
      <CardHeader className="p-5 pb-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          {application.eventName ? (
            <Badge variant="outline" className="text-xs font-semibold text-primary truncate max-w-[220px]">
              <Calendar className="size-3 mr-1 shrink-0" />
              <span className="truncate">{application.eventName}</span>
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[11px]">
              General Hackathon Team
            </Badge>
          )}

          <Badge variant={badgeVariant} className="text-[10px] uppercase font-bold tracking-wider gap-1 shrink-0">
            {badgeIcon}
            <span>{application.status.replace(/_/g, " ")}</span>
          </Badge>
        </div>

        <div className="space-y-1">
          <h3 className="font-extrabold text-lg text-foreground tracking-tight line-clamp-1">
            {application.teamName}
          </h3>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Layers className="size-3.5 text-emerald-500 shrink-0" />
            <span>Applied for: <strong>{application.roleName}</strong></span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 py-2 space-y-3 flex-1">
        {/* Required Skills */}
        {application.requiredSkills.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Required Skills
            </span>
            <div className="flex flex-wrap gap-1">
              {application.requiredSkills.map((skill) => (
                <Badge key={skill.id} variant="outline" className="text-[10px] px-1.5 py-0">
                  {skill.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Pitch Statement */}
        {application.message && (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Your Pitch
            </span>
            <p className="text-xs text-foreground italic line-clamp-2">
              &ldquo;{application.message}&rdquo;
            </p>
          </div>
        )}

        {/* Status Explanation */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
          <span>{explanation}</span>
          <span className="shrink-0">{formattedDate}</span>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-3 border-t border-border/60 bg-muted/10 rounded-b-2xl flex items-center justify-between gap-2">
        <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
          <Link href={`/teams/${application.teamId}`}>
            <span>View Team</span>
            <ArrowRight className="size-3" />
          </Link>
        </Button>

        {application.status === "PENDING" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleWithdraw}
            disabled={isPending}
            className="text-xs text-destructive hover:bg-destructive/10 gap-1 h-8"
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            <span>Withdraw</span>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
