'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { createInternalNotification } from './notifications'
import { isUserEligibleForCoreFeatures } from '@/lib/policies'

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
 * Creates a new application for a team role with full validation.
 */
export async function createApplication(input: {
  teamId: string
  roleId: string
  userId?: string
  message?: string
}) {
  const userId = await getAuthUserId(input.userId)
  if (!userId) {
    return { error: 'Unauthorized: You must be logged in to apply.' }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { skills: true }
    })

    if (!user) {
      return { error: 'User not found.' }
    }

    if (!isUserEligibleForCoreFeatures(user.verificationStatus, user.isSuspended)) {
      return { error: 'Account is suspended or not eligible to apply to teams.' }
    }

    const team = await prisma.team.findUnique({
      where: { id: input.teamId }
    })

    if (!team || !['ACTIVE', 'PARTIALLY_FILLED'].includes(team.status as string)) {
      if (!team || team.status !== 'ACTIVE') {
        return { error: 'Team is not open for applications.' }
      }
    }

    const role = await prisma.teamRole.findUnique({
      where: { id: input.roleId }
    })

    if (!role || !['ACTIVE', 'PARTIALLY_FILLED'].includes(role.status)) {
      return { error: 'Role is not open for applications.' }
    }

    if (new Date() >= new Date(role.expiry)) {
      return { error: 'Role has expired and is no longer accepting applications.' }
    }

    // Verify user is not already in the target team
    const existingMembership = await prisma.teamMember.findFirst({
      where: {
        teamId: input.teamId,
        userId: userId,
        status: 'ACTIVE'
      }
    })

    if (existingMembership) {
      return { error: 'You are already an active member of this team.' }
    }

    // Verify one-team-per-event
    if (team.eventId) {
      const eventMembership = await prisma.teamMember.findFirst({
        where: {
          eventId: team.eventId,
          userId: userId,
          status: 'ACTIVE'
        }
      })
      if (eventMembership) {
        return { error: 'You are already an active member of another team for this event.' }
      }
    }

    // Verify no existing pending or accepted application for this team
    const existingApp = await prisma.application.findFirst({
      where: {
        teamId: input.teamId,
        userId: userId,
        status: { in: ['PENDING', 'ACCEPTED'] }
      }
    })

    if (existingApp) {
      return { error: 'You already have an active or accepted application for this team.' }
    }

    const application = await prisma.application.create({
      data: {
        teamId: input.teamId,
        roleId: input.roleId,
        userId: userId,
        message: input.message || null,
        status: 'PENDING'
      }
    })

    // Notify active team leaders
    try {
      const leaders = await prisma.teamMember.findMany({
        where: {
          teamId: input.teamId,
          status: 'ACTIVE',
          membershipRole: { in: ['LEADER', 'CO_LEADER'] }
        }
      })
      for (const leader of leaders) {
        if (leader.userId !== userId) {
          await createInternalNotification({
            userId: leader.userId,
            type: 'APPLICATION_RECEIVED',
            title: 'New Application Received',
            content: `${user.name || user.username} applied for ${role.name} in ${team.name}.`,
            referenceType: 'TEAM',
            referenceId: input.teamId,
          })
        }
      }
    } catch {
      // Non-blocking notification
    }

    return { success: true, application }
  } catch (err: any) {
    return { error: err.message || 'Failed to submit application.' }
  }
}

/**
 * Concurrency-safe Application Acceptance inside a single transaction with row locking.
 */
export async function acceptApplication(applicationId: string, actorUserId?: string) {
  const currentUserId = await getAuthUserId(actorUserId)
  if (!currentUserId) {
    return { error: 'Unauthorized.' }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch application details
      const app = await tx.application.findUnique({
        where: { id: applicationId },
        include: { team: true, role: true }
      })

      if (!app) {
        throw new Error('Application not found.')
      }

      if (app.status !== 'PENDING') {
        throw new Error(`Application is not pending (current status: ${app.status}).`)
      }

      // 2. Verify caller is LEADER or CO_LEADER (or system admin)
      const leaderMembership = await tx.teamMember.findFirst({
        where: {
          teamId: app.teamId,
          userId: currentUserId,
          status: 'ACTIVE',
          membershipRole: { in: ['LEADER', 'CO_LEADER'] }
        }
      })

      const isAdminUser = await tx.userRole.findFirst({
        where: { userId: currentUserId, role: 'ADMIN' }
      })

      if (!leaderMembership && !isAdminUser) {
        throw new Error('Unauthorized: Only team leaders can accept applications.')
      }

      // 3. PostgreSQL Row-Level Lock: Lock the target role
      const lockedRoles = await tx.$queryRaw<Array<{
        id: string
        team_id: string
        seats_required: number
        status: string
        expiry: Date
      }>>`SELECT id, team_id, seats_required, status, expiry FROM public.team_roles WHERE id = ${app.roleId}::uuid FOR UPDATE`

      if (!lockedRoles || lockedRoles.length === 0) {
        throw new Error('Target role not found.')
      }

      const lockedRole = lockedRoles[0]

      if (!['ACTIVE', 'PARTIALLY_FILLED'].includes(lockedRole.status)) {
        throw new Error(`Role is not open (current status: ${lockedRole.status}).`)
      }

      // Verify applicant is not suspended
      const applicant = await tx.user.findUnique({
        where: { id: app.userId },
        select: { id: true, isSuspended: true },
      })
      if (!applicant || applicant.isSuspended) {
        throw new Error('Cannot accept application: the applicant account is currently suspended.')
      }

      if (new Date() >= new Date(lockedRole.expiry)) {
        throw new Error('Target role has expired.')
      }

      // 4. Verify One-Team-Per-Event for applicant
      if (app.team.eventId) {
        const otherEventTeam = await tx.teamMember.findFirst({
          where: {
            eventId: app.team.eventId,
            userId: app.userId,
            status: 'ACTIVE'
          }
        })

        if (otherEventTeam) {
          throw new Error('Applicant is already an active member of another team in this event.')
        }
      }

      // 5. Verify applicant is not already in target team
      const existingInTeam = await tx.teamMember.findFirst({
        where: {
          teamId: app.teamId,
          userId: app.userId,
          status: 'ACTIVE'
        }
      })

      if (existingInTeam) {
        throw new Error('Applicant is already an active member of this team.')
      }

      // 6. Check available seats count
      const activeSeatsCount = await tx.teamMember.count({
        where: {
          roleId: app.roleId,
          status: 'ACTIVE'
        }
      })

      if (activeSeatsCount >= lockedRole.seats_required) {
        throw new Error('Role seats are full.')
      }

      // 7. Update application to ACCEPTED
      await tx.application.update({
        where: { id: applicationId },
        data: { status: 'ACCEPTED' }
      })

      // 8. Add applicant to team_members atomically
      const newMember = await tx.teamMember.create({
        data: {
          teamId: app.teamId,
          eventId: app.team.eventId,
          roleId: app.roleId,
          userId: app.userId,
          membershipRole: 'MEMBER',
          status: 'ACTIVE'
        }
      })

      // 9. Recalculate filled seats inside the same transaction
      const updatedSeatsCount = await tx.teamMember.count({
        where: {
          roleId: app.roleId,
          status: 'ACTIVE'
        }
      })

      let newRoleStatus: 'ACTIVE' | 'PARTIALLY_FILLED' | 'FULL' = 'ACTIVE'

      if (updatedSeatsCount >= lockedRole.seats_required) {
        newRoleStatus = 'FULL'

        // 10. Automatically AUTO_CLOSE all other pending applications for this role
        const autoClosedApps = await tx.application.findMany({
          where: {
            roleId: app.roleId,
            status: 'PENDING',
            id: { not: applicationId }
          },
          select: { id: true, userId: true }
        })

        await tx.application.updateMany({
          where: {
            roleId: app.roleId,
            status: 'PENDING',
            id: { not: applicationId }
          },
          data: { status: 'AUTO_CLOSED' }
        })

        for (const closedApp of autoClosedApps) {
          await createInternalNotification({
            userId: closedApp.userId,
            type: 'APPLICATION_AUTO_CLOSED',
            title: 'Role Filled',
            content: `The role you applied for in ${app.team.name} has been filled by another candidate.`,
            referenceType: 'TEAM',
            referenceId: app.teamId,
          }, tx)
        }

        // Auto-decline/close pending invitations for this full role
        await tx.invitation.updateMany({
          where: {
            roleId: app.roleId,
            status: 'PENDING'
          },
          data: { status: 'DECLINED' }
        })
      } else if (updatedSeatsCount > 0) {
        newRoleStatus = 'PARTIALLY_FILLED'
      }

      await tx.teamRole.update({
        where: { id: app.roleId },
        data: { status: newRoleStatus }
      })

      // 11. Recalculate Team FULL status
      const allTeamRoles = await tx.teamRole.findMany({
        where: { teamId: app.teamId }
      })

      const activeRecruitmentRoles = allTeamRoles.filter(r =>
        ['ACTIVE', 'PARTIALLY_FILLED', 'FULL'].includes(r.status)
      )

      let newTeamStatus = app.team.status

      if (
        activeRecruitmentRoles.length > 0 &&
        activeRecruitmentRoles.every(r => r.status === 'FULL')
      ) {
        newTeamStatus = 'FULL'
        await tx.team.update({
          where: { id: app.teamId },
          data: { status: 'FULL' }
        })
      } else if (
        app.team.status === 'FULL' &&
        activeRecruitmentRoles.some(r => r.status !== 'FULL')
      ) {
        newTeamStatus = 'ACTIVE'
        await tx.team.update({
          where: { id: app.teamId },
          data: { status: 'ACTIVE' }
        })
      }

      // 12. Create notifications inside transaction
      // A. To applicant
      await createInternalNotification({
        userId: app.userId,
        type: 'APPLICATION_ACCEPTED',
        title: 'Application Accepted!',
        content: `Congratulations! You were accepted into ${app.team.name} as ${lockedRole.seats_required > 1 ? lockedRole.id : 'a member'}.`,
        referenceType: 'TEAM',
        referenceId: app.teamId,
      }, tx)

      // B. If role became FULL, notify leader(s)
      if (newRoleStatus === 'FULL') {
        const leaders = await tx.teamMember.findMany({
          where: {
            teamId: app.teamId,
            status: 'ACTIVE',
            membershipRole: { in: ['LEADER', 'CO_LEADER'] }
          }
        })
        for (const leader of leaders) {
          await createInternalNotification({
            userId: leader.userId,
            type: 'ROLE_FILLED',
            title: 'Recruitment Role Filled',
            content: `All seats for a role in ${app.team.name} have been filled.`,
            referenceType: 'TEAM',
            referenceId: app.teamId,
          }, tx)
        }
      }

      // C. If team became FULL, notify all active members
      if (newTeamStatus === 'FULL' && app.team.status !== 'FULL') {
        const allMembers = await tx.teamMember.findMany({
          where: { teamId: app.teamId, status: 'ACTIVE' }
        })
        for (const m of allMembers) {
          await createInternalNotification({
            userId: m.userId,
            type: 'TEAM_FULL',
            title: 'Squad Roster Complete',
            content: `${app.team.name} roster is now fully filled and ready to build!`,
            referenceType: 'TEAM',
            referenceId: app.teamId,
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
    return { error: err.message || 'Failed to accept application.' }
  }
}

/**
 * Rejects a pending application.
 */
export async function rejectApplication(applicationId: string, actorUserId?: string) {
  const currentUserId = await getAuthUserId(actorUserId)
  if (!currentUserId) return { error: 'Unauthorized.' }

  try {
    const app = await prisma.application.findUnique({
      where: { id: applicationId }
    })

    if (!app || app.status !== 'PENDING') {
      return { error: 'Application not found or not pending.' }
    }

    const leaderMembership = await prisma.teamMember.findFirst({
      where: {
        teamId: app.teamId,
        userId: currentUserId,
        status: 'ACTIVE',
        membershipRole: { in: ['LEADER', 'CO_LEADER'] }
      }
    })

    if (!leaderMembership) {
      return { error: 'Unauthorized: Only team leaders can reject applications.' }
    }

    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'REJECTED' }
    })

    // Notify applicant
    try {
      await createInternalNotification({
        userId: app.userId,
        type: 'APPLICATION_REJECTED',
        title: 'Application Update',
        content: 'Your application for a squad recruitment role was not selected.',
        referenceType: 'TEAM',
        referenceId: app.teamId,
      })
    } catch {
      // Non-blocking notification
    }

    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to reject application.' }
  }
}

/**
 * Allows applicant to withdraw their pending application.
 */
export async function withdrawApplication(applicationId: string, actorUserId?: string) {
  const currentUserId = await getAuthUserId(actorUserId)
  if (!currentUserId) return { error: 'Unauthorized.' }

  try {
    const app = await prisma.application.findUnique({
      where: { id: applicationId }
    })

    if (!app || app.status !== 'PENDING') {
      return { error: 'Application not found or cannot be withdrawn.' }
    }

    if (app.userId !== currentUserId) {
      return { error: 'Unauthorized: You can only withdraw your own applications.' }
    }

    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'WITHDRAWN' }
    })

    // Notify team leaders
    try {
      const leaders = await prisma.teamMember.findMany({
        where: {
          teamId: app.teamId,
          status: 'ACTIVE',
          membershipRole: { in: ['LEADER', 'CO_LEADER'] }
        }
      })
      for (const leader of leaders) {
        await createInternalNotification({
          userId: leader.userId,
          type: 'APPLICATION_WITHDRAWN',
          title: 'Application Withdrawn',
          content: 'An applicant withdrew their application for your squad.',
          referenceType: 'TEAM',
          referenceId: app.teamId,
        })
      }
    } catch {
      // Non-blocking notification
    }

    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to withdraw application.' }
  }
}

/**
 * Retrieves all sent applications by the current user and incoming applications for teams led by the current user.
 */
export async function getMyApplications() {
  const currentUserId = await getAuthUserId()
  if (!currentUserId) {
    return { error: 'Unauthorized.', sentApplications: [], receivedApplications: [], isLeader: false }
  }

  try {
    // 1. Sent Applications (Candidate View)
    const sentApps = await prisma.application.findMany({
      where: { userId: currentUserId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            event: {
              select: { id: true, name: true }
            }
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
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // 2. Determine teams where user is LEADER or CO_LEADER
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

    let receivedApps: Array<any> = []
    if (isLeader) {
      receivedApps = await prisma.application.findMany({
        where: {
          teamId: { in: ledTeamIds }
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
              },
              members: { where: { status: 'ACTIVE' } }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              profilePhoto: true,
              year: true,
              bio: true,
              availability: true,
              department: { select: { id: true, name: true } },
              skills: {
                include: {
                  skill: { select: { id: true, name: true } }
                }
              },
              ratingsReceived: {
                select: { score: true }
              },
              projects: {
                where: { isPrivate: false },
                select: { id: true, title: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    const formattedSent = sentApps.map((app) => ({
      id: app.id,
      teamId: app.teamId,
      teamName: app.team.name,
      teamDescription: app.team.description,
      eventName: app.team.event?.name || null,
      roleId: app.roleId,
      roleName: app.role.name,
      roleStatus: app.role.status,
      requiredSkills: app.role.skills
        .filter((rs) => rs.requirementType === 'REQUIRED')
        .map((rs) => ({ id: rs.skill.id, name: rs.skill.name })),
      message: app.message,
      status: app.status,
      createdAt: app.createdAt
    }))

    const formattedReceived = receivedApps.map((app) => {
      const ratings = app.user.ratingsReceived
      const avgRating = ratings.length > 0
        ? Number((ratings.reduce((acc: number, r: any) => acc + r.score, 0) / ratings.length).toFixed(1))
        : null

      const remainingSeats = Math.max(0, app.role.seatsRequired - app.role.members.length)

      return {
        id: app.id,
        teamId: app.teamId,
        teamName: app.team.name,
        eventName: app.team.event?.name || null,
        roleId: app.roleId,
        roleName: app.role.name,
        roleStatus: app.role.status,
        remainingSeats,
        seatsRequired: app.role.seatsRequired,
        requiredSkills: app.role.skills
          .filter((rs: any) => rs.requirementType === 'REQUIRED')
          .map((rs: any) => ({ id: rs.skill.id, name: rs.skill.name })),
        message: app.message,
        status: app.status,
        createdAt: app.createdAt,
        candidate: {
          id: app.user.id,
          name: app.user.name,
          username: app.user.username,
          profilePhoto: app.user.profilePhoto,
          year: app.user.year,
          bio: app.user.bio,
          availability: app.user.availability,
          department: app.user.department?.name || null,
          avgRating,
          ratingsCount: ratings.length,
          publicProjectsCount: app.user.projects.length,
          skills: app.user.skills.map((s: any) => ({
            id: s.skill.id,
            name: s.skill.name,
            level: s.level
          }))
        }
      }
    })

    return {
      success: true,
      sentApplications: formattedSent,
      receivedApplications: formattedReceived,
      isLeader
    }
  } catch (err: any) {
    return {
      error: err.message || 'Failed to fetch applications.',
      sentApplications: [],
      receivedApplications: [],
      isLeader: false
    }
  }
}

