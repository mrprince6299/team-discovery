'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { SkillLevel, PreferredExperience, Availability } from '@prisma/client'
import { createInternalNotification } from './notifications'
import { revalidatePath } from 'next/cache'

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
 * Creates a team recruitment role with requirement validations.
 */
export async function createTeamRole(input: {
  teamId: string
  name: string
  seatsRequired: number
  preferredLevel?: SkillLevel
  preferredExperience?: PreferredExperience
  preferredAvailability?: Availability
  expiry: Date
  requiredSkillIds: string[]
  preferredSkillIds?: string[]
  leaderUserId?: string
}) {
  const currentUserId = await getAuthUserId(input.leaderUserId)
  if (!currentUserId) return { error: 'Unauthorized.' }

  if (!input.requiredSkillIds || input.requiredSkillIds.length === 0) {
    return { error: 'Validation Error: A team role must have at least one REQUIRED skill before it can be created/opened.' }
  }

  if (input.seatsRequired < 1) {
    return { error: 'Seats required must be at least 1.' }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Verify caller is active leader/co-leader
      const leaderMembership = await tx.teamMember.findFirst({
        where: {
          teamId: input.teamId,
          userId: currentUserId,
          status: 'ACTIVE',
          membershipRole: { in: ['LEADER', 'CO_LEADER'] },
        },
      })

      if (!leaderMembership) {
        throw new Error('Unauthorized: Only team leaders can create team roles.')
      }

      // Create TeamRole
      const role = await tx.teamRole.create({
        data: {
          teamId: input.teamId,
          name: input.name,
          seatsRequired: input.seatsRequired,
          preferredLevel: input.preferredLevel || null,
          preferredExperience: input.preferredExperience || 'ANY',
          preferredAvailability: input.preferredAvailability || null,
          expiry: input.expiry,
          status: 'ACTIVE',
        },
      })

      // Attach REQUIRED skills
      for (const skillId of input.requiredSkillIds) {
        await tx.roleSkill.create({
          data: {
            roleId: role.id,
            skillId: skillId,
            requirementType: 'REQUIRED',
          },
        })
      }

      // Attach PREFERRED skills if any
      if (input.preferredSkillIds) {
        for (const skillId of input.preferredSkillIds) {
          await tx.roleSkill.create({
            data: {
              roleId: role.id,
              skillId: skillId,
              requirementType: 'PREFERRED',
            },
          })
        }
      }

      // Ensure team status is ACTIVE (since it now has an open recruitment role)
      await tx.team.update({
        where: { id: input.teamId },
        data: { status: 'ACTIVE' },
      })

      return role
    })

    try {
      revalidatePath(`/teams/${input.teamId}`)
      revalidatePath('/teams')
      revalidatePath('/discover')
    } catch {
      // Safe context ignoring in tests
    }

    return { success: true, role: result }
  } catch (err: any) {
    return { error: err.message || 'Failed to create team role.' }
  }
}

/**
 * Updates an existing team recruitment role.
 */
export async function updateTeamRole(input: {
  roleId: string
  name?: string
  seatsRequired?: number
  preferredLevel?: SkillLevel | null
  preferredExperience?: PreferredExperience | null
  preferredAvailability?: Availability | null
  expiry?: Date
  requiredSkillIds?: string[]
  preferredSkillIds?: string[]
  leaderUserId?: string
}) {
  const currentUserId = await getAuthUserId(input.leaderUserId)
  if (!currentUserId) return { error: 'Unauthorized.' }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch role and verify caller is active leader
      const role = await tx.teamRole.findUnique({
        where: { id: input.roleId },
        include: { team: true },
      })

      if (!role) {
        throw new Error('Team role not found.')
      }

      const leaderMembership = await tx.teamMember.findFirst({
        where: {
          teamId: role.teamId,
          userId: currentUserId,
          status: 'ACTIVE',
          membershipRole: { in: ['LEADER', 'CO_LEADER'] },
        },
      })

      if (!leaderMembership) {
        throw new Error('Unauthorized: Only team leaders can update team roles.')
      }

      // 2. Check occupied seats
      const occupiedSeats = await tx.teamMember.count({
        where: {
          roleId: role.id,
          status: 'ACTIVE',
        },
      })

      let targetSeats = role.seatsRequired
      if (input.seatsRequired !== undefined) {
        if (input.seatsRequired < 1) {
          throw new Error('Seats required must be at least 1.')
        }
        if (input.seatsRequired < occupiedSeats) {
          throw new Error(`Cannot reduce seats below currently occupied seats (${occupiedSeats}).`)
        }
        targetSeats = input.seatsRequired
      }

      // 3. Validate required skills
      if (input.requiredSkillIds !== undefined) {
        if (input.requiredSkillIds.length === 0) {
          throw new Error('Validation Error: A team role must have at least one REQUIRED skill.')
        }
      }

      // 4. Determine new role status
      let newStatus = role.status
      if (['ACTIVE', 'PARTIALLY_FILLED', 'FULL'].includes(role.status)) {
        if (occupiedSeats >= targetSeats) {
          newStatus = 'FULL'
        } else if (occupiedSeats > 0) {
          newStatus = 'PARTIALLY_FILLED'
        } else {
          newStatus = 'ACTIVE'
        }
      }

      // If expiry was extended into future and role was EXPIRED, reopen if seats available
      if (input.expiry && input.expiry > new Date() && role.status === 'EXPIRED') {
        if (occupiedSeats >= targetSeats) {
          newStatus = 'FULL'
        } else if (occupiedSeats > 0) {
          newStatus = 'PARTIALLY_FILLED'
        } else {
          newStatus = 'ACTIVE'
        }
      }

      // 5. Update role fields
      const updatedRole = await tx.teamRole.update({
        where: { id: role.id },
        data: {
          name: input.name !== undefined ? input.name : role.name,
          seatsRequired: targetSeats,
          preferredLevel: input.preferredLevel !== undefined ? input.preferredLevel : role.preferredLevel,
          preferredExperience: input.preferredExperience !== undefined ? (input.preferredExperience || 'ANY') : role.preferredExperience,
          preferredAvailability: input.preferredAvailability !== undefined ? input.preferredAvailability : role.preferredAvailability,
          expiry: input.expiry !== undefined ? input.expiry : role.expiry,
          status: newStatus,
        },
      })

      // 6. Update skills if provided
      if (input.requiredSkillIds !== undefined || input.preferredSkillIds !== undefined) {
        await tx.roleSkill.deleteMany({
          where: { roleId: role.id },
        })

        const reqSkills = input.requiredSkillIds || []
        for (const skillId of reqSkills) {
          await tx.roleSkill.create({
            data: {
              roleId: role.id,
              skillId,
              requirementType: 'REQUIRED',
            },
          })
        }

        const prefSkills = input.preferredSkillIds || []
        for (const skillId of prefSkills) {
          await tx.roleSkill.create({
            data: {
              roleId: role.id,
              skillId,
              requirementType: 'PREFERRED',
            },
          })
        }
      }

      // 7. Recalculate team status
      const allRoles = await tx.teamRole.findMany({
        where: { teamId: role.teamId },
      })
      const activeRoles = allRoles.filter((r) => ['ACTIVE', 'PARTIALLY_FILLED', 'FULL'].includes(r.status))
      if (activeRoles.length > 0 && activeRoles.every((r) => r.status === 'FULL')) {
        await tx.team.update({
          where: { id: role.teamId },
          data: { status: 'FULL' },
        })
      } else if (activeRoles.length > 0) {
        await tx.team.update({
          where: { id: role.teamId },
          data: { status: 'ACTIVE' },
        })
      }

      return updatedRole
    })

    try {
      revalidatePath(`/teams/${result.teamId}`)
      revalidatePath('/teams')
      revalidatePath('/discover')
    } catch {
      // Safe context ignoring in tests
    }

    return { success: true, role: result }
  } catch (err: any) {
    return { error: err.message || 'Failed to update team role.' }
  }
}

/**
 * Manually closes a team recruitment role.
 * Auto-closes pending applications and expires pending invitations.
 */
export async function closeTeamRole(input: {
  roleId: string
  leaderUserId?: string
}) {
  const currentUserId = await getAuthUserId(input.leaderUserId)
  if (!currentUserId) return { error: 'Unauthorized.' }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch role and verify caller is active leader
      const role = await tx.teamRole.findUnique({
        where: { id: input.roleId },
        include: { team: true },
      })

      if (!role) {
        throw new Error('Team role not found.')
      }

      const leaderMembership = await tx.teamMember.findFirst({
        where: {
          teamId: role.teamId,
          userId: currentUserId,
          status: 'ACTIVE',
          membershipRole: { in: ['LEADER', 'CO_LEADER'] },
        },
      })

      if (!leaderMembership) {
        throw new Error('Unauthorized: Only team leaders can close team roles.')
      }

      if (role.status === 'CLOSED') {
        return { alreadyClosed: true, teamId: role.teamId }
      }

      // 2. Update role status to CLOSED
      await tx.teamRole.update({
        where: { id: role.id },
        data: { status: 'CLOSED' },
      })

      // 3. Auto-close remaining pending applications
      const autoClosedApps = await tx.application.findMany({
        where: {
          roleId: role.id,
          status: 'PENDING',
        },
        select: { id: true, userId: true },
      })

      if (autoClosedApps.length > 0) {
        await tx.application.updateMany({
          where: {
            roleId: role.id,
            status: 'PENDING',
          },
          data: { status: 'AUTO_CLOSED' },
        })

        for (const closedApp of autoClosedApps) {
          await createInternalNotification(
            {
              userId: closedApp.userId,
              type: 'APPLICATION_AUTO_CLOSED',
              title: 'Role Closed',
              content: `The recruitment role (${role.name}) has been closed by the team leader.`,
              referenceType: 'TEAM',
              referenceId: role.teamId,
            },
            tx
          )
        }
      }

      // 4. Expire remaining pending invitations
      await tx.invitation.updateMany({
        where: {
          roleId: role.id,
          status: 'PENDING',
        },
        data: { status: 'EXPIRED' },
      })

      // 5. Recalculate team status
      const allRoles = await tx.teamRole.findMany({
        where: { teamId: role.teamId },
      })
      const activeRoles = allRoles.filter((r) => ['ACTIVE', 'PARTIALLY_FILLED', 'FULL'].includes(r.status))
      if (activeRoles.length > 0 && activeRoles.every((r) => r.status === 'FULL')) {
        await tx.team.update({
          where: { id: role.teamId },
          data: { status: 'FULL' },
        })
      } else if (activeRoles.length > 0) {
        await tx.team.update({
          where: { id: role.teamId },
          data: { status: 'ACTIVE' },
        })
      }

      return { success: true, teamId: role.teamId }
    })

    try {
      revalidatePath(`/teams/${result.teamId}`)
      revalidatePath('/teams')
      revalidatePath('/discover')
    } catch {
      // Safe context ignoring in tests
    }

    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to close team role.' }
  }
}

/**
 * Deletes an unoccupied team recruitment role.
 */
export async function deleteTeamRole(input: {
  roleId: string
  leaderUserId?: string
}) {
  const currentUserId = await getAuthUserId(input.leaderUserId)
  if (!currentUserId) return { error: 'Unauthorized.' }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const role = await tx.teamRole.findUnique({
        where: { id: input.roleId },
        include: { members: { where: { status: 'ACTIVE' } } },
      })

      if (!role) {
        throw new Error('Team role not found.')
      }

      const leaderMembership = await tx.teamMember.findFirst({
        where: {
          teamId: role.teamId,
          userId: currentUserId,
          status: 'ACTIVE',
          membershipRole: { in: ['LEADER', 'CO_LEADER'] },
        },
      })

      if (!leaderMembership) {
        throw new Error('Unauthorized: Only team leaders can delete team roles.')
      }

      if (role.members.length > 0) {
        throw new Error('Cannot delete a role that currently has active members. Please reassign or remove members first.')
      }

      // Auto-close any remaining applications
      await tx.application.updateMany({
        where: { roleId: role.id, status: 'PENDING' },
        data: { status: 'AUTO_CLOSED' },
      })

      // Delete role skills & role
      await tx.roleSkill.deleteMany({ where: { roleId: role.id } })
      await tx.invitation.deleteMany({ where: { roleId: role.id } })
      await tx.application.deleteMany({ where: { roleId: role.id } })
      await tx.teamRole.delete({ where: { id: role.id } })

      // Recalculate team status
      const remainingRoles = await tx.teamRole.findMany({
        where: { teamId: role.teamId },
      })
      const activeRoles = remainingRoles.filter((r) => ['ACTIVE', 'PARTIALLY_FILLED', 'FULL'].includes(r.status))
      if (activeRoles.length > 0 && activeRoles.every((r) => r.status === 'FULL')) {
        await tx.team.update({ where: { id: role.teamId }, data: { status: 'FULL' } })
      }

      return { teamId: role.teamId }
    })

    try {
      revalidatePath(`/teams/${result.teamId}`)
      revalidatePath(`/teams/${result.teamId}/workspace`)
      revalidatePath('/teams')
      revalidatePath('/discover')
      revalidatePath('/dashboard')
    } catch {
      // Safe context ignoring in tests
    }

    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to delete team role.' }
  }
}

/**
 * Idempotent Server-Side Job to expire overdue team roles.
 * Can be run via cron / edge functions.
 */
export async function expireOverdueRoles() {
  const now = new Date()

  try {
    // Find all expired active roles
    const overdueRoles = await prisma.teamRole.findMany({
      where: {
        expiry: { lte: now },
        status: { in: ['ACTIVE', 'PARTIALLY_FILLED'] },
      },
    })

    let expiredCount = 0

    for (const role of overdueRoles) {
      await prisma.$transaction(async (tx) => {
        // 1. Set role status to EXPIRED
        await tx.teamRole.update({
          where: { id: role.id },
          data: { status: 'EXPIRED' },
        })

        // 2. Auto-close remaining pending applications
        const autoClosedApps = await tx.application.findMany({
          where: {
            roleId: role.id,
            status: 'PENDING',
          },
          select: { id: true, userId: true },
        })

        if (autoClosedApps.length > 0) {
          await tx.application.updateMany({
            where: {
              roleId: role.id,
              status: 'PENDING',
            },
            data: { status: 'AUTO_CLOSED' },
          })

          for (const closedApp of autoClosedApps) {
            await createInternalNotification(
              {
                userId: closedApp.userId,
                type: 'APPLICATION_AUTO_CLOSED',
                title: 'Application Closed',
                content: `The recruitment role (${role.name}) has expired.`,
                referenceType: 'TEAM',
                referenceId: role.teamId,
              },
              tx
            )
          }
        }

        // 3. Expire remaining pending invitations
        await tx.invitation.updateMany({
          where: {
            roleId: role.id,
            status: 'PENDING',
          },
          data: { status: 'EXPIRED' },
        })

        // 4. Recalculate team status
        const allRoles = await tx.teamRole.findMany({
          where: { teamId: role.teamId },
        })
        const activeRoles = allRoles.filter((r) => ['ACTIVE', 'PARTIALLY_FILLED', 'FULL'].includes(r.status))
        if (activeRoles.length > 0 && activeRoles.every((r) => r.status === 'FULL')) {
          await tx.team.update({ where: { id: role.teamId }, data: { status: 'FULL' } })
        }

        // 5. Notify active leaders about expired recruitment role
        const leaders = await tx.teamMember.findMany({
          where: {
            teamId: role.teamId,
            status: 'ACTIVE',
            membershipRole: { in: ['LEADER', 'CO_LEADER'] },
          },
        })
        for (const leader of leaders) {
          await createInternalNotification(
            {
              userId: leader.userId,
              type: 'ROLE_EXPIRED',
              title: 'Recruitment Role Expired',
              content: `A recruitment role (${role.name}) has expired.`,
              referenceType: 'TEAM',
              referenceId: role.teamId,
            },
            tx
          )
        }
      })
      expiredCount++
    }

    return { success: true, expiredCount }
  } catch (err: any) {
    return { error: err.message || 'Failed to process role expiry.' }
  }
}
