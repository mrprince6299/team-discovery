"use client"

import * as React from "react"
import Link from "next/link"
import {
  Clock,
  ExternalLink,
  Mail,
} from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface SentInvitation {
  id: string
  teamId: string
  teamName: string
  eventName?: string | null
  roleId: string
  roleName: string
  requiredSkills: Array<{ id: string; name: string }>
  message?: string | null
  status: string
  expiry: Date
  isExpired: boolean
  createdAt: Date
  recipient: {
    id: string
    name: string
    username: string
    profilePhoto?: string | null
    department?: string | null
  }
}

interface SentInvitationCardProps {
  invitation: SentInvitation
}

export function SentInvitationCard({ invitation }: SentInvitationCardProps) {
  const initials = invitation.recipient.name
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

  return (
    <Card className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card shadow-xs">
      <CardHeader className="p-5 pb-3 space-y-3">
        {/* Team & Role Banner */}
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Invited For
            </span>
            <div className="flex items-center gap-1.5">
              <Badge variant="exact" className="text-xs font-bold truncate">
                {invitation.roleName}
              </Badge>
              <span className="text-xs text-muted-foreground truncate">
                in {invitation.teamName}
              </span>
            </div>
          </div>

          <Badge
            variant={
              invitation.status === "PENDING"
                ? "outline"
                : invitation.status === "ACCEPTED"
                ? "exact"
                : "secondary"
            }
            className="text-[10px] uppercase font-bold tracking-wider shrink-0"
          >
            {invitation.status}
          </Badge>
        </div>

        {/* Recipient Profile Info */}
        <div className="flex items-center gap-3 pt-2 border-t border-border/50">
          <Avatar className="size-10 rounded-xl border border-border shrink-0 shadow-2xs">
            <AvatarImage
              src={invitation.recipient.profilePhoto || undefined}
              alt={invitation.recipient.name}
            />
            <AvatarFallback className="font-bold text-xs bg-muted">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-0.5">
            <h4 className="font-extrabold text-sm text-foreground truncate">
              {invitation.recipient.name}
            </h4>
            <p className="text-xs text-muted-foreground truncate">
              @{invitation.recipient.username}{" "}
              {invitation.recipient.department ? `· ${invitation.recipient.department}` : ""}
            </p>
          </div>
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
              {invitation.requiredSkills.map((s) => (
                <Badge key={s.id} variant="outline" className="text-[10px] px-1.5 py-0">
                  {s.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Message */}
        {invitation.message && (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Mail className="size-3 text-muted-foreground" />
              <span>Invitation Message</span>
            </span>
            <p className="text-xs text-foreground italic line-clamp-2">
              &ldquo;{invitation.message}&rdquo;
            </p>
          </div>
        )}

        {/* Expiry */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            <span>Expires: {formattedExpiry}</span>
          </span>
          {invitation.eventName && (
            <span className="truncate max-w-[140px] text-[10px]">
              {invitation.eventName}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-3 border-t border-border/60 bg-muted/10 rounded-b-2xl flex items-center justify-between gap-2">
        <Button asChild variant="outline" size="sm" className="w-full gap-1.5 text-xs font-semibold">
          <Link href={`/users/${invitation.recipient.id}`} target="_blank">
            <span>View Candidate Profile</span>
            <ExternalLink className="size-3" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
