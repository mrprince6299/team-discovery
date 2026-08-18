"use client"

import * as React from "react"
import { useTransition } from "react"
import Link from "next/link"
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  Star,
  Loader2,
  Check,
  X,
} from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { acceptApplication, rejectApplication } from "@/app/actions/applications"
import { toast } from "sonner"

export interface ReceivedApplication {
  id: string
  teamId: string
  teamName: string
  eventName?: string | null
  roleId: string
  roleName: string
  roleStatus: string
  remainingSeats: number
  seatsRequired: number
  requiredSkills: Array<{ id: string; name: string }>
  message?: string | null
  status: string
  createdAt: Date
  candidate: {
    id: string
    name: string
    username: string
    profilePhoto?: string | null
    year?: number | null
    bio?: string | null
    availability?: string | null
    department?: string | null
    avgRating?: number | null
    ratingsCount: number
    publicProjectsCount: number
    skills: Array<{ id: string; name: string; level: string }>
  }
}

interface LeaderApplicationCardProps {
  application: ReceivedApplication
  onStatusChanged?: () => void
}

export function LeaderApplicationCard({
  application,
  onStatusChanged,
}: LeaderApplicationCardProps) {
  const [isPending, startTransition] = useTransition()
  const [actionType, setActionType] = React.useState<"accept" | "reject" | null>(null)

  const handleAccept = () => {
    setActionType("accept")
    startTransition(async () => {
      const res = await acceptApplication(application.id)
      if ("error" in res && res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Accepted ${application.candidate.name} into the team!`)
        if (onStatusChanged) onStatusChanged()
      }
      setActionType(null)
    })
  }

  const handleReject = () => {
    setActionType("reject")
    startTransition(async () => {
      const res = await rejectApplication(application.id)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Application from ${application.candidate.name} rejected.`)
        if (onStatusChanged) onStatusChanged()
      }
      setActionType(null)
    })
  }

  const initials = application.candidate.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const isPendingReview = application.status === "PENDING"

  return (
    <Card className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card shadow-xs">
      <CardHeader className="p-5 pb-3 space-y-3">
        {/* Role & Team Context */}
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Applying For
            </span>
            <div className="flex items-center gap-1.5">
              <Badge variant="exact" className="text-xs font-bold truncate">
                {application.roleName}
              </Badge>
              <span className="text-xs text-muted-foreground truncate">
                in {application.teamName}
              </span>
            </div>
          </div>

          <Badge
            variant={
              application.status === "PENDING"
                ? "outline"
                : application.status === "ACCEPTED"
                ? "exact"
                : "secondary"
            }
            className="text-[10px] uppercase font-bold tracking-wider shrink-0"
          >
            {application.status}
          </Badge>
        </div>

        {/* Candidate Profile Summary */}
        <div className="flex items-start gap-3 pt-2 border-t border-border/50">
          <Avatar className="size-12 rounded-xl border border-border shrink-0 shadow-2xs">
            <AvatarImage
              src={application.candidate.profilePhoto || undefined}
              alt={application.candidate.name}
            />
            <AvatarFallback className="font-bold text-xs bg-muted">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-foreground truncate">
                {application.candidate.name}
              </h4>
              {application.candidate.avgRating && (
                <div className="flex items-center gap-1 text-[11px] font-bold text-foreground">
                  <Star className="size-3 fill-amber-400 text-amber-500" />
                  <span>{application.candidate.avgRating}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground truncate">
              @{application.candidate.username}{" "}
              {application.candidate.department ? `· ${application.candidate.department}` : ""}
            </p>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground pt-0.5">
              {application.candidate.availability && (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {application.candidate.availability.replace(/_/g, " ")}
                </span>
              )}
              {application.candidate.publicProjectsCount > 0 && (
                <span>· {application.candidate.publicProjectsCount} Projects</span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 py-2 space-y-3 flex-1">
        {/* Candidate Skills */}
        {application.candidate.skills.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Verified Candidate Skills
            </span>
            <div className="flex flex-wrap gap-1">
              {application.candidate.skills.slice(0, 6).map((s) => (
                <Badge key={s.id} variant="outline" className="text-[10px] px-1.5 py-0">
                  {s.name}
                </Badge>
              ))}
              {application.candidate.skills.length > 6 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  +{application.candidate.skills.length - 6}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Pitch Statement */}
        {application.message && (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Candidate Pitch
            </span>
            <p className="text-xs text-foreground italic line-clamp-2">
              &ldquo;{application.message}&rdquo;
            </p>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
          <span>{application.remainingSeats} seat(s) remaining for role</span>
          <Button asChild variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-primary gap-1">
            <Link href={`/users/${application.candidate.id}`} target="_blank">
              <span>View Full Profile</span>
              <ExternalLink className="size-3" />
            </Link>
          </Button>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-3 border-t border-border/60 bg-muted/10 rounded-b-2xl flex items-center justify-between gap-2">
        {isPendingReview ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              disabled={isPending}
              className="gap-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
            >
              {isPending && actionType === "reject" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <X className="size-3.5" />
              )}
              <span>Reject</span>
            </Button>

            <Button
              size="sm"
              onClick={handleAccept}
              disabled={isPending}
              className="gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              {isPending && actionType === "accept" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              <span>Accept into Team</span>
            </Button>
          </>
        ) : (
          <div className="w-full text-center text-xs text-muted-foreground font-semibold py-1">
            {application.status === "ACCEPTED" ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                Candidate is an Active Team Member
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <XCircle className="size-3.5" />
                Application {application.status}
              </span>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
