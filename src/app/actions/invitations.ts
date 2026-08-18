'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { createInternalNotification } from './notifications'

async function getAuthUserId(providedUserId?: string): Promise<string | null> {
  if (providedUserId && process.env.NODE_ENV !== 'production') {
    return providedUserId
  }
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || null
  } catch {
    return null
  }
}

/**
 * Creates a team invitation sent by a team leader to a candidate.
 */
export async function createInvitation(input: {
  teamId: string
  roleId: string
  recipientId: string
  senderId?: string
  message?: string
  expiryDays?: number
}) {
  const senderId = await getAuthUserId(input.senderId)
  if (!senderId) {
    return { error: 'Unauthorized.' }
  }

  try {
    // 1. Verify sender is active LEADER or CO_LEADER
    const senderMembership = await prisma.teamMember.findFirst({
      where: {
        teamId: input.teamId,
        userId: senderId,
        status: 'ACTIVE',
        membershipRole: { in: ['LEADER', 'CO_LEADER'] }
      }
    })

    if (!senderMembership) {
      return { error: 'Unauthorized: Only team leaders can send invitations.' }
    }

    // 2. Verify recipient is APPROVED
    const recipient = await prisma.user.findUnique({
      where: { id: input.recipientId }
    })

    if (!recipient || recipient.verificationStatus !== 'APPROVED') {
      return { error: 'Recipient is not an approved verified user.' }
    }

    // 3. Verify team and role are active
    const team = await prisma.team.findUnique({
      where: { id: input.teamId }
    })

    if (!team || team.status === 'FULL' || team.status === 'CLOSED') {
      return { error: 'Team is not open for new members.' }
    }

    const role = await prisma.teamRole.findUnique({
      where: { id: input.roleId }
    })

    if (!role || !['ACTIVE', 'PARTIALLY_FILLED'].includes(role.status)) {
      return { error: 'Role is not open for invitations.' }
    }

    if (new Date() >= new Date(role.expiry)) {
      return { error: 'Role has expired.' }
    }

    // 4. Verify recipient is not already in the target team
    const inTargetTeam = await prisma.teamMember.findFirst({
      where: {
        teamId: input.teamId,
        userId: input.recipientId,
        status: 'ACTIVE'
      }
    })

    if (inTargetTeam) {
      return { error: 'Recipient is already an active member of this team.' }
    }

    // 5. Verify one-team-per-event for recipient
    if (team.eventId) {
      const inEventTeam = await prisma.teamMember.findFirst({
        where: {
          eventId: team.eventId,
          userId: input.recipientId,
          status: 'ACTIVE'
        }
      })

      if (inEventTeam) {
        return { error: 'Recipient is already an active member of another team in this event.' }
      }
    }

    // 6. Verify no existing pending or accepted invitation for this role
    const existingInvite = await prisma.invitation.findFirst({
      where: {
        roleId: input.roleId,
        recipientId: input.recipientId,
        status: { in: ['PENDING', 'ACCEPTED'] }
      }
    })

    if (existingInvite) {
      return { error: 'An active or accepted invitation already exists for this candidate on this role.' }
    }

    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + (input.expiryDays || 3))

    const invitation = await prisma.invitation.create({
      data: {
        teamId: input.teamId,
        roleId: input.roleId,
        senderId: senderId,
        recipientId: input.recipientId,
        message: input.message || null,
        expiry: expiryDate,
        status: 'PENDING'
      }
    })

    // Notify recipient
    try {
      await createInternalNotification({
        userId: input.recipientId,
        type: 'INVITATION_RECEIVED',
        title: 'New Squad Invitation',
        content: `You received an invitation to join ${team.name} as ${role.name}.`,
        referenceType: 'INVITATION',
        referenceId: invitation.id,
      })
    } catch {
      // Non-blocking notification
    }

    return { success: true, invitation }
  } catch (err: any) {
    return { error: err.message || 'Failed to send invitation.' }
  }
}

/**
 * Concurrency-safe Invitation Acceptance with PostgreSQL row-level locking.
 */
export async function acceptInvitation(invitationId: string, actorUserId?: string) {
  const currentUserId = await getAuthUserId(actorUserId)
  if (!currentUserId) {
    return { error: 'Unauthorized.' }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch invitation
      const invite = await tx.invitation.findUnique({
        where: { id: invitationId },
        include: { team: true, role: true }
      })

      if (!invite) {
        throw new Error('Invitation not found.')
      }

      if (invite.status !== 'PENDING') {
        throw new Error(`Invitation is not pending (current status: ${invite.status}).`)
      }

      if (invite.recipientId !== currentUserId) {
        throw new Error('Unauthorized: You can only accept invitations addressed to you.')
      }

      if (new Date() >= new Date(invite.expiry)) {
        await tx.invitation.update({
          where: { id: invitationId },
          data: { status: 'EXPIRED' }
        })
        throw new Error('Invitation has expired.')
      }

      // 2. Lock the target role with PostgreSQL Row Lock
      const lockedRoles = await tx.$queryRaw<Array<{
        id: string
        team_id: string
        seats_required: number
        status: string
        expiry: Date
      }>>`SELECT id, team_id, seats_required, status, expiry FROM public.team_roles WHERE id = ${invite.roleId}::uuid FOR UPDATE`

      if (!lockedRoles || lockedRoles.length === 0) {
        throw new Error('Target role not found.')
      }

      const lockedRole = lockedRoles[0]

      if (!['ACTIVE', 'PARTIALLY_FILLED'].includes(lockedRole.status)) {
        throw new Error(`Role is not open (current status: ${lockedRole.status}).`)
      }

      if (new Date() >= new Date(lockedRole.expiry)) {
        throw new Error('Target role has expired.')
      }

      // 3. Verify one-team-per-event for recipient
      if (invite.team.eventId) {
        const otherEventTeam = await tx.teamMember.findFirst({
          where: {
            eventId: invite.team.eventId,
            userId: invite.recipientId,
            status: 'ACTIVE'
          }
        })

        if (otherEventTeam) {
          throw new Error('You are already an active member of another team in this event.')
        }
      }

      // 4. Verify user not already in target team
      const existingInTeam = await tx.teamMember.findFirst({
        where: {
          teamId: invite.teamId,
          userId: invite.recipientId,
          status: 'ACTIVE'
        }
      })

      if (existingInTeam) {
        throw new Error('You are already an active member of this team.')
      }

      // 5. Check available seats count
      const activeSeatsCount = await tx.teamMember.count({
        where: {
          roleId: invite.roleId,
          status: 'ACTIVE'
        }
      })

      if (activeSeatsCount >= lockedRole.seats_required) {
        throw new Error('Role seats are full.')
      }

      // 6. Mark invitation ACCEPTED
      await tx.invitation.update({
        where: { id: invitationId },
        data: { status: 'ACCEPTED' }
      })

      // 7. Add recipient to team_members atomically
      const newMember = await tx.teamMember.create({
        data: {
          teamId: invite.teamId,
          eventId: invite.team.eventId,
          roleId: invite.roleId,
          userId: invite.recipientId,
          membershipRole: 'MEMBER',
          status: 'ACTIVE'
        }
      })

      // 8. Recalculate filled seats inside the same transaction
      const updatedSeatsCount = await tx.teamMember.count({
        where: {
          roleId: invite.roleId,
          status: 'ACTIVE'
        }
      })

      let newRoleStatus: 'ACTIVE' | 'PARTIALLY_FILLED' | 'FULL' = 'ACTIVE'

      if (updatedSeatsCount >= lockedRole.seats_required) {
        newRoleStatus = 'FULL'

        // Auto-close remaining pending applications for this role
        const autoClosedApps = await tx.application.findMany({
          where: {
            roleId: invite.roleId,
            status: 'PENDING',
          },
          select: { id: true, userId: true }
        })

        await tx.application.updateMany({
          where: {
            roleId: invite.roleId,
            status: 'PENDING'
          },
          data: { status: 'AUTO_CLOSED' }
        })

        for (const closedApp of autoClosedApps) {
          await createInternalNotification({
            userId: closedApp.userId,
            type: 'APPLICATION_AUTO_CLOSED',
            title: 'Role Filled',
            content: `The role you applied for in ${invite.team.name} has been filled by another candidate.`,
            referenceType: 'TEAM',
            referenceId: invite.teamId,
          }, tx)
        }

        // Auto-close other pending invitations for this full role
        await tx.invitation.updateMany({
          where: {
            roleId: invite.roleId,
            status: 'PENDING',
            id: { not: invitationId }
          },
          data: { status: 'DECLINED' }
        })
      } else if (updatedSeatsCount > 0) {
        newRoleStatus = 'PARTIALLY_FILLED'
      }

      await tx.teamRole.update({
        where: { id: invite.roleId },
        data: { status: newRoleStatus }
      })

      // 9. Recalculate Team FULL status
      const allTeamRoles = await tx.teamRole.findMany({
        where: { teamId: invite.teamId }
      })

      const activeRecruitmentRoles = allTeamRoles.filter(r =>
        ['ACTIVE', 'PARTIALLY_FILLED', 'FULL'].includes(r.status)
      )

      let newTeamStatus = invite.team.status

      if (
        activeRecruitmentRoles.length > 0 &&
        activeRecruitmentRoles.every(r => r.status === 'FULL')
      ) {
        newTeamStatus = 'FULL'
        await tx.team.update({
          where: { id: invite.teamId },
          data: { status: 'FULL' }
        })
      } else if (
        invite.team.status === 'FULL' &&
        activeRecruitmentRoles.some(r => r.status !== 'FULL')
      ) {
        newTeamStatus = 'ACTIVE'
        await tx.team.update({
          where: { id: invite.teamId },
          data: { status: 'ACTIVE' }
        })
      }

      // Notify sender / team leader
      if (invite.senderId !== currentUserId) {
        await createInternalNotification({
          userId: invite.senderId,
          type: 'INVITATION_ACCEPTED',
          title: 'Invitation Accepted',
          content: `A candidate accepted your invitation to join ${invite.team.name}!`,
          referenceType: 'TEAM',
          referenceId: invite.teamId,
        }, tx)
      }

      // If role became FULL
      if (newRoleStatus === 'FULL') {
        const leaders = await tx.teamMember.findMany({
          where: {
            teamId: invite.teamId,
            status: 'ACTIVE',
            membershipRole: { in: ['LEADER', 'CO_LEADER'] }
          }
        })
        for (const leader of leaders) {
          await createInternalNotification({
            userId: leader.userId,
            type: 'ROLE_FILLED',
            title: 'Recruitment Role Filled',
            content: `All seats for a role in ${invite.team.name} have been filled.`,
            referenceType: 'TEAM',
            referenceId: invite.teamId,
          }, tx)
        }
      }

      // If team became FULL
      if (newTeamStatus === 'FULL' && invite.team.status !== 'FULL') {
        const allMembers = await tx.teamMember.findMany({
          where: { teamId: invite.teamId, status: 'ACTIVE' }
        })
        for (const m of allMembers) {
          await createInternalNotification({
            userId: m.userId,
            type: 'TEAM_FULL',
            title: 'Squad Roster Complete',
            content: `${invite.team.name} roster is now fully filled and ready to build!`,
            referenceType: 'TEAM',
            referenceId: invite.teamId,
          }, tx)
        }
      }

      return {
        success: true,
        memberId: newMember.id,
        roleStatus: newRoleStatus,
        teamStatus: newTeamStatus,
        activeSeatsCount: updatedSeatsCount
      }
    })

    return result
  } catch (err: any) {
    return { error: err.message || 'Failed to accept invitation.' }
  }
}

/**
 * Declines an invitation.
 */
export async function declineInvitation(invitationId: string, actorUserId?: string) {
  const currentUserId = await getAuthUserId(actorUserId)
  if (!currentUserId) return { error: 'Unauthorized.' }

  try {
    const invite = await prisma.invitation.findUnique({
      where: { id: invitationId }
    })

    if (!invite || invite.status !== 'PENDING') {
      return { error: 'Invitation not found or not pending.' }
    }

    if (invite.recipientId !== currentUserId) {
      return { error: 'Unauthorized: You can only decline invitations addressed to you.' }
    }

    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'DECLINED' }
    })

    // Notify sender
    if (invite.senderId) {
      try {
        await createInternalNotification({
          userId: invite.senderId,
          type: 'INVITATION_DECLINED',
          title: 'Invitation Declined',
          content: 'A candidate declined your squad invitation.',
          referenceType: 'TEAM',
          referenceId: invite.teamId,
        })
      } catch {
        // Non-blocking notification
      }
    }

    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to decline invitation.' }
  }
}

/**
 * Retrieves all invitations received by the current user and sent by the current user / teams led by user.
 */
export async function getMyInvitations() {
  const currentUserId = await getAuthUserId()
  if (!currentUserId) {
    return { error: 'Unauthorized.', receivedInvitations: [], sentInvitations: [], isLeader: false }
  }

  try {
    // 1. Received Invitations (Candidate View)
    const received = await prisma.invitation.findMany({
      where: { recipientId: currentUserId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            description: true,
            event: { select: { id: true, name: true } }
          }
        },
        role: {
          include: {
            skills: {
              include: {
                skill: { select: { id: true, name: true } }
              }
            }
          }
        },
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePhoto: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // 2. Teams user leads
    const ledTeams = await prisma.teamMember.findMany({
      where: {
        userId: currentUserId,
        status: 'ACTIVE',
        membershipRole: { in: ['LEADER', 'CO_LEADER'] }
      },
      select: { teamId: true }
    })

    const ledTeamIds = ledTeams.map((t) => t.teamId)
    const isLeader = ledTeamIds.length > 0

    // 3. Sent Invitations (Leader View)
    let sent: Array<any> = []
    if (isLeader) {
      sent = await prisma.invitation.findMany({
        where: {
          OR: [
            { senderId: currentUserId },
            { teamId: { in: ledTeamIds } }
          ]
        },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              event: { select: { id: true, name: true } }
            }
          },
          role: {
            include: {
              skills: {
                include: {
                  skill: { select: { id: true, name: true } }
                }
              }
            }
          },
          recipient: {
            select: {
              id: true,
              name: true,
              username: true,
              profilePhoto: true,
              department: { select: { id: true, name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    const formattedReceived = received.map((inv) => {
      const isExpired = new Date(inv.expiry) <= new Date()
      let effectiveStatus = inv.status
      if (effectiveStatus === 'PENDING' && isExpired) {
        effectiveStatus = 'EXPIRED'
      }

      return {
        id: inv.id,
        teamId: inv.teamId,
        teamName: inv.team.name,
        teamDescription: inv.team.description,
        eventName: inv.team.event?.name || null,
        roleId: inv.roleId,
        roleName: inv.role.name,
        roleStatus: inv.role.status,
        requiredSkills: inv.role.skills
          .filter((rs) => rs.requirementType === 'REQUIRED')
          .map((rs) => ({ id: rs.skill.id, name: rs.skill.name })),
        message: inv.message,
        status: effectiveStatus,
        expiry: inv.expiry,
        isExpired,
        createdAt: inv.createdAt,
        sender: {
          id: inv.sender.id,
          name: inv.sender.name,
          username: inv.sender.username,
          profilePhoto: inv.sender.profilePhoto
        }
      }
    })

    const formattedSent = sent.map((inv) => {
      const isExpired = new Date(inv.expiry) <= new Date()
      let effectiveStatus = inv.status
      if (effectiveStatus === 'PENDING' && isExpired) {
        effectiveStatus = 'EXPIRED'
      }

      return {
        id: inv.id,
        teamId: inv.teamId,
        teamName: inv.team.name,
        eventName: inv.team.event?.name || null,
        roleId: inv.roleId,
        roleName: inv.role.name,
        requiredSkills: inv.role.skills
          .filter((rs: any) => rs.requirementType === 'REQUIRED')
          .map((rs: any) => ({ id: rs.skill.id, name: rs.skill.name })),
        message: inv.message,
        status: effectiveStatus,
        expiry: inv.expiry,
        isExpired,
        createdAt: inv.createdAt,
        recipient: {
          id: inv.recipient.id,
          name: inv.recipient.name,
          username: inv.recipient.username,
          profilePhoto: inv.recipient.profilePhoto,
          department: inv.recipient.department?.name || null
        }
      }
    })

    return {
      success: true,
      receivedInvitations: formattedReceived,
      sentInvitations: formattedSent,
      isLeader
    }
  } catch (err: any) {
    return {
      error: err.message || 'Failed to fetch invitations.',
      receivedInvitations: [],
      sentInvitations: [],
      isLeader: false
    }
  }
}

