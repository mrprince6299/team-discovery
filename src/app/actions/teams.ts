'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { SkillLevel, PreferredExperience, Availability } from '@prisma/client'

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
 * Creates a team and atomically registers the creator as the sole ACTIVE LEADER.
 */
export async function createTeam(input: {
  name: string
  description: string
  eventId?: string
  leaderUserId?: string
}) {
  const leaderId = await getAuthUserId(input.leaderUserId)
  if (!leaderId) {
    return { error: 'Unauthorized.' }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify leader exists and is APPROVED
      const leader = await tx.user.findUnique({
        where: { id: leaderId }
      })

      if (!leader || leader.verificationStatus !== 'APPROVED') {
        throw new Error('Only approved verified users can create teams.')
      }

      // 2. If eventId is specified, verify one-team-per-event for leader
      if (input.eventId) {
        const existingEventMembership = await tx.teamMember.findFirst({
          where: {
            eventId: input.eventId,
            userId: leaderId,
            status: 'ACTIVE'
          }
        })

        if (existingEventMembership) {
          throw new Error('You are already an active member of another team in this event.')
        }
      }

      // 3. Create Team record
      const team = await tx.team.create({
        data: {
          name: input.name,
          description: input.description,
          eventId: input.eventId || null,
          status: 'ACTIVE'
        }
      })

      // 4. Create Leader membership record atomically
      await tx.teamMember.create({
        data: {
          teamId: team.id,
          eventId: input.eventId || null,
          userId: leaderId,
          membershipRole: 'LEADER',
          status: 'ACTIVE'
        }
      })

      // 5. Create Team conversation record
      await tx.conversation.create({
        data: {
          teamId: team.id
        }
      })

      return team
    })

    return { success: true, team: result }
  } catch (err: any) {
    return { error: err.message || 'Failed to create team.' }
  }
}

/**
 * Atomically creates a team along with one or more recruitment roles and required skills.
 */
export async function createTeamWithRoles(input: {
  name: string
  description: string
  eventId?: string
  roles: Array<{
    name: string
    seatsRequired: number
    preferredLevel?: SkillLevel
    preferredExperience?: PreferredExperience
    preferredAvailability?: Availability
    expiry: Date
    requiredSkillIds: string[]
    preferredSkillIds?: string[]
  }>
}) {
  const leaderId = await getAuthUserId()
  if (!leaderId) {
    return { error: 'Unauthorized. Please sign in.' }
  }

  if (!input.name.trim()) {
    return { error: 'Team name is required.' }
  }

  if (!input.description.trim()) {
    return { error: 'Team description is required.' }
  }

  if (!input.roles || input.roles.length === 0) {
    return { error: 'Please define at least one initial recruitment role.' }
  }

  for (const r of input.roles) {
    if (!r.requiredSkillIds || r.requiredSkillIds.length === 0) {
      return { error: `Role "${r.name}" must contain at least one REQUIRED skill.` }
    }
    if (r.seatsRequired < 1) {
      return { error: `Role "${r.name}" seats required must be at least 1.` }
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify user is APPROVED
      const user = await tx.user.findUnique({ where: { id: leaderId } })
      if (!user || user.verificationStatus !== 'APPROVED') {
        throw new Error('Only approved verified users can create teams.')
      }

      // 2. If eventId is specified, check one-team-per-event
      if (input.eventId) {
        const existingMembership = await tx.teamMember.findFirst({
          where: {
            eventId: input.eventId,
            userId: leaderId,
            status: 'ACTIVE',
          },
        })
        if (existingMembership) {
          throw new Error('You are already an active member of another team for this event.')
        }
      }

      // 3. Create Team
      const team = await tx.team.create({
        data: {
          name: input.name.trim(),
          description: input.description.trim(),
          eventId: input.eventId || null,
          status: 'ACTIVE',
        },
      })

      // 4. Create Leader membership
      await tx.teamMember.create({
        data: {
          teamId: team.id,
          eventId: input.eventId || null,
          userId: leaderId,
          membershipRole: 'LEADER',
          status: 'ACTIVE',
        },
      })

      // 5. Create Team Conversation
      await tx.conversation.create({
        data: {
          teamId: team.id,
        },
      })

      // 6. Create Initial Roles and their skills
      for (const r of input.roles) {
        const role = await tx.teamRole.create({
          data: {
            teamId: team.id,
            name: r.name.trim(),
            seatsRequired: r.seatsRequired,
            preferredLevel: r.preferredLevel || null,
            preferredExperience: r.preferredExperience || 'ANY',
            preferredAvailability: r.preferredAvailability || null,
            expiry: r.expiry,
            status: 'ACTIVE',
          },
        })

        // Insert required skills
        const skillMappings = [
          ...r.requiredSkillIds.map((skillId) => ({
            roleId: role.id,
            skillId,
            requirementType: 'REQUIRED' as const,
          })),
          ...(r.preferredSkillIds || []).map((skillId) => ({
            roleId: role.id,
            skillId,
            requirementType: 'PREFERRED' as const,
          })),
        ]

        await tx.roleSkill.createMany({
          data: skillMappings,
          skipDuplicates: true,
        })
      }

      return team
    })

    return { success: true, teamId: result.id }
  } catch (err: any) {
    return { error: err.message || 'Failed to create team with roles.' }
  }
}

/**
 * Fetches all discoverable teams with active open roles, member counts, and event context.
 */
export async function getDiscoverableTeams() {
  const teams = await prisma.team.findMany({
    where: {
      status: { in: ['ACTIVE', 'FULL'] },
    },
    include: {
      event: {
        select: {
          id: true,
          name: true,
          bannerUrl: true,
          registrationDeadline: true,
          status: true,
        },
      },
      members: {
        where: { status: 'ACTIVE' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              profilePhoto: true,
              department: { select: { id: true, name: true } },
            },
          },
        },
      },
      roles: {
        include: {
          skills: {
            include: {
              skill: { select: { id: true, name: true } },
            },
          },
          members: {
            where: { status: 'ACTIVE' },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return teams.map((team) => {
    const leader = team.members.find((m) => m.membershipRole === 'LEADER')?.user || null
    const activeRoles = team.roles.filter(
      (r) => ['ACTIVE', 'PARTIALLY_FILLED'].includes(r.status) && new Date(r.expiry) > new Date()
    )

    let totalSeatsRequired = 0
    let totalSeatsRemaining = 0
    const uniqueSkills = new Map<string, string>()

    team.roles.forEach((r) => {
      const activeFilled = r.members.length
      const remaining = Math.max(0, r.seatsRequired - activeFilled)
      totalSeatsRequired += r.seatsRequired
      totalSeatsRemaining += remaining

      r.skills.forEach((rs) => {
        uniqueSkills.set(rs.skill.id, rs.skill.name)
      })
    })

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      status: team.status,
      event: team.event,
      leader,
      activeMemberCount: team.members.length,
      members: team.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        membershipRole: m.membershipRole,
        user: m.user,
      })),
      totalRolesCount: team.roles.length,
      activeRolesCount: activeRoles.length,
      totalSeatsRemaining,
      totalSeatsRequired,
      openRoles: activeRoles.map((r) => ({
        id: r.id,
        name: r.name,
        seatsRequired: r.seatsRequired,
        remainingSeats: Math.max(0, r.seatsRequired - r.members.length),
        status: r.status,
        requiredSkills: r.skills
          .filter((rs) => rs.requirementType === 'REQUIRED')
          .map((rs) => ({ id: rs.skill.id, name: rs.skill.name })),
      })),
      skillTags: Array.from(uniqueSkills.entries()).map(([id, name]) => ({ id, name })),
    }
  })
}

/**
 * Fetches full team details including active roster and role cards.
 */
export async function getTeamDetails(teamId: string) {
  const currentUserId = await getAuthUserId()

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      event: {
        select: {
          id: true,
          name: true,
          description: true,
          bannerUrl: true,
          registrationDeadline: true,
          status: true,
        },
      },
      members: {
        where: { status: 'ACTIVE' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              profilePhoto: true,
              year: true,
              bio: true,
              department: { select: { id: true, name: true } },
              skills: {
                include: {
                  skill: { select: { id: true, name: true } },
                },
              },
              ratingsReceived: {
                select: { score: true },
              },
            },
          },
          role: {
            select: { id: true, name: true },
          },
        },
      },
      roles: {
        include: {
          skills: {
            include: {
              skill: { select: { id: true, name: true } },
            },
          },
          members: {
            where: { status: 'ACTIVE' },
          },
        },
        orderBy: { expiry: 'asc' },
      },
    },
  })

  if (!team) return null

  // Check if current user is an active member or has a pending application
  let isCurrentLeader = false
  let isCurrentMember = false
  let hasPendingApplication = false
  let userActiveInOtherEventTeam = false

  if (currentUserId) {
    const currentMember = team.members.find((m) => m.userId === currentUserId)
    if (currentMember) {
      isCurrentMember = true
      isCurrentLeader = currentMember.membershipRole === 'LEADER'
    }

    const pendingApp = await prisma.application.findFirst({
      where: {
        teamId: team.id,
        userId: currentUserId,
        status: 'PENDING',
      },
    })
    hasPendingApplication = !!pendingApp

    if (team.eventId) {
      const otherEventMembership = await prisma.teamMember.findFirst({
        where: {
          eventId: team.eventId,
          userId: currentUserId,
          status: 'ACTIVE',
          teamId: { not: team.id },
        },
      })
      userActiveInOtherEventTeam = !!otherEventMembership
    }
  }

  const leader = team.members.find((m) => m.membershipRole === 'LEADER')?.user || null

  const rolesWithDetails = team.roles.map((r) => {
    const activeFilled = r.members.length
    const remainingSeats = Math.max(0, r.seatsRequired - activeFilled)
    const isExpired = new Date(r.expiry) <= new Date()

    let effectiveStatus = r.status
    if (isExpired && effectiveStatus !== 'EXPIRED' && effectiveStatus !== 'CLOSED') {
      effectiveStatus = 'EXPIRED'
    }

    return {
      id: r.id,
      name: r.name,
      seatsRequired: r.seatsRequired,
      remainingSeats,
      status: effectiveStatus,
      preferredLevel: r.preferredLevel,
      preferredExperience: r.preferredExperience,
      preferredAvailability: r.preferredAvailability,
      expiry: r.expiry,
      isExpired,
      requiredSkills: r.skills
        .filter((rs) => rs.requirementType === 'REQUIRED')
        .map((rs) => ({ id: rs.skill.id, name: rs.skill.name })),
      preferredSkills: r.skills
        .filter((rs) => rs.requirementType === 'PREFERRED')
        .map((rs) => ({ id: rs.skill.id, name: rs.skill.name })),
    }
  })

  return {
    id: team.id,
    name: team.name,
    description: team.description,
    status: team.status,
    event: team.event,
    leader,
    isCurrentLeader,
    isCurrentMember,
    hasPendingApplication,
    userActiveInOtherEventTeam,
    currentUserId,
    members: team.members.map((m) => {
      const ratings = m.user.ratingsReceived
      const avgRating =
        ratings.length > 0
          ? Number((ratings.reduce((acc, r) => acc + r.score, 0) / ratings.length).toFixed(1))
          : null

      return {
        id: m.id,
        userId: m.userId,
        membershipRole: m.membershipRole,
        assignedRoleName: m.role?.name || null,
        joinedAt: m.joinedAt,
        user: {
          id: m.user.id,
          name: m.user.name,
          username: m.user.username,
          profilePhoto: m.user.profilePhoto,
          year: m.user.year,
          bio: m.user.bio,
          department: m.user.department,
          avgRating,
          ratingsCount: ratings.length,
          topSkills: m.user.skills.map((s) => ({
            id: s.skill.id,
            name: s.skill.name,
            level: s.level,
          })),
        },
      }
    }),
    roles: rolesWithDetails,
  }
}

/**
 * Fetches all available events open for registration or ongoing.
 */
export async function getAvailableEvents() {
  return prisma.event.findMany({
    where: {
      status: { in: ['REGISTRATION_OPEN', 'PUBLISHED', 'ONGOING'] },
    },
    select: {
      id: true,
      name: true,
      description: true,
      bannerUrl: true,
      registrationDeadline: true,
      status: true,
    },
    orderBy: { registrationDeadline: 'asc' },
  })
}

/**
 * Concurrency-safe Leadership Transfer ensuring exactly one active leader remains.
 */
export async function transferLeadership(input: {
  teamId: string
  currentLeaderId?: string
  newLeaderId: string
}) {
  const leaderId = await getAuthUserId(input.currentLeaderId)
  if (!leaderId) return { error: 'Unauthorized.' }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify current user is currently the active LEADER of the team
      const currentLeader = await tx.teamMember.findFirst({
        where: {
          teamId: input.teamId,
          userId: leaderId,
          status: 'ACTIVE',
          membershipRole: 'LEADER'
        }
      })

      if (!currentLeader) {
        throw new Error('Unauthorized: Only the current active team leader can transfer leadership.')
      }

      // 2. Verify target user is currently an active member of the team
      const targetMember = await tx.teamMember.findFirst({
        where: {
          teamId: input.teamId,
          userId: input.newLeaderId,
          status: 'ACTIVE'
        }
      })

      if (!targetMember) {
        throw new Error('Target user is not an active member of this team.')
      }

      if (targetMember.userId === leaderId) {
        throw new Error('Target user is already the team leader.')
      }

      // 3. Demote current leader to MEMBER
      await tx.teamMember.update({
        where: { id: currentLeader.id },
        data: { membershipRole: 'MEMBER' }
      })

      // 4. Promote target member to LEADER
      await tx.teamMember.update({
        where: { id: targetMember.id },
        data: { membershipRole: 'LEADER' }
      })

      // 5. Verify leadership integrity: exactly 1 active LEADER
      const leaderCount = await tx.teamMember.count({
        where: {
          teamId: input.teamId,
          status: 'ACTIVE',
          membershipRole: 'LEADER'
        }
      })

      if (leaderCount !== 1) {
        throw new Error('Leadership integrity violation: team must have exactly one active leader.')
      }

      return { success: true }
    })

    if (result.success) {
      revalidatePath('/teams')
      revalidatePath(`/teams/${input.teamId}`)
      revalidatePath(`/teams/${input.teamId}/workspace`)
      revalidatePath('/dashboard')
    }

    return result
  } catch (err: any) {
    return { error: err.message || 'Failed to transfer leadership.' }
  }
}

/**
 * Member leaves team safely. If leader leaves, transfership or team close is enforced.
 */
export async function leaveTeam(input: {
  teamId: string
  userId?: string
}) {
  const currentUserId = await getAuthUserId(input.userId)
  if (!currentUserId) return { error: 'Unauthorized.' }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const member = await tx.teamMember.findFirst({
        where: {
          teamId: input.teamId,
          userId: currentUserId,
          status: 'ACTIVE'
        }
      })

      if (!member) {
        throw new Error('You are not an active member of this team.')
      }

      // Check other active members
      const otherActiveMembers = await tx.teamMember.findMany({
        where: {
          teamId: input.teamId,
          id: { not: member.id },
          status: 'ACTIVE'
        }
      })

      if (member.membershipRole === 'LEADER') {
        if (otherActiveMembers.length > 0) {
          throw new Error('Team leader cannot leave without transferring leadership to another active member first.')
        } else {
          // Sole member leaving -> Close team
          await tx.teamMember.update({
            where: { id: member.id },
            data: { status: 'LEFT', leftAt: new Date() }
          })
          await tx.team.update({
            where: { id: input.teamId },
            data: { status: 'CLOSED' }
          })
          return { success: true, teamClosed: true }
        }
      }

      // Standard member leaving
      await tx.teamMember.update({
        where: { id: member.id },
        data: { status: 'LEFT', leftAt: new Date() }
      })

      // If member held a role, recalculate role and team status
      if (member.roleId) {
        const activeSeatsCount = await tx.teamMember.count({
          where: { roleId: member.roleId, status: 'ACTIVE' }
        })

        const role = await tx.teamRole.findUnique({
          where: { id: member.roleId }
        })

        if (role && !['EXPIRED', 'CLOSED', 'DRAFT'].includes(role.status)) {
          let newRoleStatus: 'ACTIVE' | 'PARTIALLY_FILLED' | 'FULL' = 'ACTIVE'
          if (activeSeatsCount >= role.seatsRequired) {
            newRoleStatus = 'FULL'
          } else if (activeSeatsCount > 0) {
            newRoleStatus = 'PARTIALLY_FILLED'
          }
          await tx.teamRole.update({
            where: { id: member.roleId },
            data: { status: newRoleStatus }
          })
        }

        // Recalculate team status
        const allRoles = await tx.teamRole.findMany({
          where: { teamId: input.teamId }
        })
        const activeRoles = allRoles.filter(r => ['ACTIVE', 'PARTIALLY_FILLED', 'FULL'].includes(r.status))
        if (activeRoles.length > 0 && activeRoles.every(r => r.status === 'FULL')) {
          await tx.team.update({ where: { id: input.teamId }, data: { status: 'FULL' } })
        } else if (activeRoles.some(r => ['ACTIVE', 'PARTIALLY_FILLED'].includes(r.status))) {
          await tx.team.update({ where: { id: input.teamId }, data: { status: 'ACTIVE' } })
        }
      }

      return { success: true }
    })

    if (result.success) {
      revalidatePath('/teams')
      revalidatePath(`/teams/${input.teamId}`)
      revalidatePath(`/teams/${input.teamId}/workspace`)
      revalidatePath('/dashboard')
    }

    return result
  } catch (err: any) {
    return { error: err.message || 'Failed to leave team.' }
  }
}
