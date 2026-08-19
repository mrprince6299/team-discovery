"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import {
  Users,
  Award,
  CheckCircle2,
  Clock,
  Lock,
  Send,
  Edit2,
  Compass,
  AlertTriangle,
  Trash2,
} from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CloseRoleDialog } from "./close-role-dialog"
import { RoleManagementDialog } from "./role-management-dialog"
import { DeleteRoleDialog } from "./delete-role-dialog"

export interface TeamRoleDetails {
  id: string
  name: string
  seatsRequired: number
  remainingSeats: number
  status: string
  preferredLevel?: string | null
  preferredExperience?: string | null
  preferredAvailability?: string | null
  expiry: Date
  isExpired?: boolean
  requiredSkills: Array<{ id: string; name: string }>
  preferredSkills: Array<{ id: string; name: string }>
}

interface RoleCardProps {
  role: TeamRoleDetails
  teamId?: string
  onApplyClick: (role: TeamRoleDetails) => void
  isCurrentMember?: boolean
  isCurrentLeader?: boolean
  hasPendingApplication?: boolean
  userActiveInOtherEventTeam?: boolean
  onRoleUpdated?: () => void
}

export function RoleCard({
  role,
  teamId,
  onApplyClick,
  isCurrentMember = false,
  isCurrentLeader = false,
  hasPendingApplication = false,
  userActiveInOtherEventTeam = false,
  onRoleUpdated,
}: RoleCardProps) {
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const isClosed = role.status === "CLOSED"
  const isExpired = role.status === "EXPIRED" || role.isExpired
  const isFull = role.status === "FULL" || role.remainingSeats === 0
  const isOpen = (role.status === "ACTIVE" || role.status === "PARTIALLY_FILLED") && !isExpired && !isClosed
  const isVacant = role.remainingSeats === role.seatsRequired

  let statusBadgeVariant: "exact" | "related" | "secondary" | "destructive" | "outline" = "outline"
  let statusText = role.status

  if (isClosed) {
    statusBadgeVariant = "secondary"
    statusText = "RECRUITMENT CLOSED"
  } else if (isExpired) {
    statusBadgeVariant = "secondary"
    statusText = "ROLE EXPIRED"
  } else if (isFull) {
    statusBadgeVariant = "secondary"
    statusText = "RECRUITMENT COMPLETE"
  } else if (role.status === "PARTIALLY_FILLED") {
    statusBadgeVariant = "related"
    statusText = `PARTIALLY FILLED (${role.seatsRequired - role.remainingSeats}/${role.seatsRequired})`
  } else if (role.status === "ACTIVE") {
    statusBadgeVariant = "exact"
    statusText = "OPEN FOR APPLICATIONS"
  }

  const cannotApplyReason = isCurrentMember
    ? "You are already a member of this team"
    : hasPendingApplication
    ? "Application already pending"
    : userActiveInOtherEventTeam
    ? "You are in another team for this event"
    : isClosed
    ? "Recruitment for this role has been closed"
    : isExpired
    ? "Role application deadline has passed"
    : isFull
    ? "All seats for this role have been filled"
    : !isOpen
    ? "Role is currently closed"
    : null

  const isApplyDisabled = !!cannotApplyReason

  const formattedExpiry = new Date(role.expiry).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <>
      <Card className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card shadow-xs">
        <CardHeader className="p-5 pb-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Badge variant={statusBadgeVariant} className="text-[10px] uppercase font-bold tracking-wider">
              {statusText}
            </Badge>

            <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
              <Users className="size-3.5 text-muted-foreground" />
              <span>
                {role.remainingSeats} of {role.seatsRequired} Seats Available
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-lg font-bold text-foreground leading-snug">{role.name}</h4>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3 text-muted-foreground" />
                <span>Expires: {formattedExpiry}</span>
              </span>
              {role.preferredExperience && role.preferredExperience !== "ANY" && (
                <span className="inline-flex items-center gap-1">
                  · Preferred: {role.preferredExperience.replace(/_/g, " ")}
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-5 py-2 space-y-3 flex-1">
          {/* Required Skills */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Required Skills ({role.requiredSkills.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {role.requiredSkills.map((skill) => (
                <Badge key={skill.id} variant="exact" className="text-xs px-2 py-0.5">
                  <CheckCircle2 className="size-3 mr-1 text-emerald-600 dark:text-emerald-400" />
                  <span>{skill.name}</span>
                </Badge>
              ))}
            </div>
          </div>

          {/* Preferred Skills */}
          {role.preferredSkills.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Preferred Skills ({role.preferredSkills.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {role.preferredSkills.map((skill) => (
                  <Badge key={skill.id} variant="secondary" className="text-xs px-2 py-0.5">
                    <Award className="size-3 mr-1 text-primary" />
                    <span>{skill.name}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-5 pt-3 border-t border-border/60 bg-muted/10 rounded-b-2xl flex flex-col items-stretch gap-2">
          {/* Leader Controls Strip */}
          {isCurrentLeader && (
            <div className="flex items-center gap-2 w-full pt-1 pb-1 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
                className="flex-1 h-8 text-xs font-semibold gap-1.5 border-border/80"
              >
                <Edit2 className="size-3" />
                <span>Edit Role</span>
              </Button>

              {isOpen && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCloseDialogOpen(true)}
                  className="h-8 text-xs font-semibold gap-1 text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  <AlertTriangle className="size-3" />
                  <span>Close</span>
                </Button>
              )}

              {isVacant && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="h-8 text-xs font-semibold gap-1 text-destructive hover:bg-destructive/10 border-destructive/30 hover:border-destructive/50"
                  title="Delete vacant role"
                >
                  <Trash2 className="size-3" />
                  <span>Delete</span>
                </Button>
              )}

              {isOpen && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs font-semibold gap-1 text-primary hover:bg-primary/10"
                >
                  <Link href={`/discover?role=${role.id}`} title="Find matching candidates in Discovery">
                    <Compass className="size-3.5" />
                    <span className="hidden sm:inline">Find Candidates</span>
                  </Link>
                </Button>
              )}
            </div>
          )}

          {/* Candidate Apply Button */}
          {!isCurrentLeader && (
            <Button
              onClick={() => onApplyClick(role)}
              disabled={isApplyDisabled}
              className="w-full gap-2 font-semibold shadow-xs"
            >
              {isApplyDisabled ? (
                <>
                  <Lock className="size-3.5" />
                  <span>{cannotApplyReason}</span>
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  <span>Apply for Role</span>
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Dialogs */}
      <CloseRoleDialog
        roleId={role.id}
        roleName={role.name}
        isOpen={isCloseDialogOpen}
        onOpenChange={setIsCloseDialogOpen}
        onSuccess={onRoleUpdated}
      />

      {teamId && (
        <RoleManagementDialog
          teamId={teamId}
          role={role}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={onRoleUpdated}
        />
      )}

      <DeleteRoleDialog
        roleId={role.id}
        roleName={role.name}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onSuccess={onRoleUpdated}
      />
    </>
  )
}
