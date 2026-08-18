"use client"

import * as React from "react"
import { useTransition } from "react"
import Link from "next/link"
import {
  Calendar,
  Layers,
  ArrowRight,
  Clock,
  Check,
  X,
  Loader2,
  Mail,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { acceptInvitation, declineInvitation } from "@/app/actions/invitations"
import { toast } from "sonner"

export interface ReceivedInvitation {
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
  expiry: Date
  isExpired: boolean
  createdAt: Date
  sender: {
    id: string
    name: string
    username: string
    profilePhoto?: string | null
  }
}

interface InvitationCardProps {
  invitation: ReceivedInvitation
  onStatusChanged?: () => void
}

export function InvitationCard({ invitation, onStatusChanged }: InvitationCardProps) {
  const [isPending, startTransition] = useTransition()
  const [actionType, setActionType] = React.useState<"accept" | "decline" | null>(null)

  const handleAccept = () => {
    setActionType("accept")
    startTransition(async () => {
      const res = await acceptInvitation(invitation.id)
      if ("error" in res && res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Accepted invitation to join ${invitation.teamName}!`)
        if (onStatusChanged) onStatusChanged()
      }
      setActionType(null)
    })
  }

  const handleDecline = () => {
    setActionType("decline")
    startTransition(async () => {
      const res = await declineInvitation(invitation.id)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Declined invitation from ${invitation.teamName}.`)
        if (onStatusChanged) onStatusChanged()
      }
      setActionType(null)
    })
  }

  const senderInitials = invitation.sender.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const formattedExpiry = new Date(invitation.expiry).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const isPendingDecision = invitation.status === "PENDING" && !invitation.isExpired

  return (
    <Card className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card shadow-xs">
      <CardHeader className="p-5 pb-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          {invitation.eventName ? (
            <Badge variant="outline" className="text-xs font-semibold text-primary truncate max-w-[220px]">
              <Calendar className="size-3 mr-1 shrink-0" />
              <span className="truncate">{invitation.eventName}</span>
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[11px]">
              General Hackathon Team
            </Badge>
          )}

          <Badge
            variant={
              isPendingDecision
                ? "exact"
                : invitation.status === "ACCEPTED"
                ? "exact"
                : "secondary"
            }
            className="text-[10px] uppercase font-bold tracking-wider shrink-0"
          >
            {invitation.status}
          </Badge>
        </div>

        <div className="space-y-1">
          <h3 className="font-extrabold text-lg text-foreground tracking-tight line-clamp-1">
            {invitation.teamName}
          </h3>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Layers className="size-3.5 text-primary shrink-0" />
            <span>Invited to join as: <strong>{invitation.roleName}</strong></span>
          </div>
        </div>

        {/* Sender Info */}
        <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground border-t border-border/50">
          <Avatar className="size-6 rounded-md border border-border">
            <AvatarImage src={invitation.sender.profilePhoto || undefined} alt={invitation.sender.name} />
            <AvatarFallback className="text-[10px] font-bold bg-muted">{senderInitials}</AvatarFallback>
          </Avatar>
          <span>Invited by <strong>{invitation.sender.name}</strong> (@{invitation.sender.username})</span>
        </div>
      </CardHeader>

      <CardContent className="px-5 py-2 space-y-3 flex-1">
        {/* Required Skills */}
        {invitation.requiredSkills.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Required Role Skills
            </span>
            <div className="flex flex-wrap gap-1">
              {invitation.requiredSkills.map((skill) => (
                <Badge key={skill.id} variant="outline" className="text-[10px] px-1.5 py-0">
                  {skill.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Invitation Message */}
        {invitation.message && (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Mail className="size-3 text-primary" />
              <span>Personal Note from Leader</span>
            </span>
            <p className="text-xs text-foreground italic line-clamp-2">
              &ldquo;{invitation.message}&rdquo;
            </p>
          </div>
        )}

        {/* Expiry date info */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            <span>Expires: {formattedExpiry}</span>
          </span>
          <Button asChild variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-primary gap-1">
            <Link href={`/teams/${invitation.teamId}`}>
              <span>View Team</span>
              <ArrowRight className="size-3" />
            </Link>
          </Button>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-3 border-t border-border/60 bg-muted/10 rounded-b-2xl flex items-center justify-between gap-2">
        {isPendingDecision ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecline}
              disabled={isPending}
              className="gap-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
            >
              {isPending && actionType === "decline" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <X className="size-3.5" />
              )}
              <span>Decline</span>
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
              <span>Accept Invitation</span>
            </Button>
          </>
        ) : (
          <div className="w-full text-center text-xs text-muted-foreground font-semibold py-1">
            {invitation.status === "ACCEPTED" ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                You are a member of this team
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <XCircle className="size-3.5" />
                Invitation {invitation.status}
              </span>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
