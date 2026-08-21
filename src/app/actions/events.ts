'use server'

import { prisma } from '@/lib/prisma'
import { isCurrentUserAdmin } from '@/app/actions/verification'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { EventStatus, TeamStatus } from '@prisma/client'

async function getAuthUserId(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || null
  } catch {
    return null
  }
}

export interface EventCatalogItem {
  id: string
  name: string
  description: string
  startDate: Date
  endDate: Date
  registrationDeadline: Date
  rules: string
  bannerUrl: string | null
  teamSizeInfo: string
  status: EventStatus
  teamCount: number
  openRoleCount: number
  totalSeatsRemaining: number
}

export interface EventShowcaseData {
  id: string
  name: string
  description: string
  startDate: Date
  endDate: Date
  registrationDeadline: Date
  rules: string
  bannerUrl: string | null
  teamSizeInfo: string
  status: EventStatus
  teams: Array<{
    id: string
    name: string
    description: string
    status: TeamStatus
    memberCount: number
    members: Array<{
      id: string
      name: string
      username: string
      avatarUrl: string | null
      membershipRole: string
    }>
    openRoles: Array<{
      id: string
      name: string
      seatsRequired: number
      skills: string[]
    }>
  }>
  currentUserState?: {
    isRegistered: boolean
    teamId?: string
    teamName?: string
    isLeader?: boolean
    hasPendingApplication?: boolean
    pendingTeamName?: string
  }
  announcements: Array<{
    id: string
    title: string
    content: string
    publishedAt: Date
    author: {
      name: string
    }
  }>
}

/**
 * Fetches all discoverable events for the Event Catalog showcase.
 */
export async function getEventsCatalog(): Promise<{
  error?: string
  events?: EventCatalogItem[]
}> {
  try {
    const rawEvents = await prisma.event.findMany({
      where: {
        status: {
          in: ['PUBLISHED', 'REGISTRATION_OPEN', 'ONGOING', 'COMPLETED'],
        },
      },
      include: {
        teams: {
          select: {
            id: true,
            status: true,
            roles: {
              where: { status: { in: ['ACTIVE', 'PARTIALLY_FILLED'] } },
              select: {
                id: true,
                seatsRequired: true,
                members: { where: { status: 'ACTIVE' }, select: { id: true } },
              },
            },
          },
        },
      },
      orderBy: [{ startDate: 'asc' }],
    })

    const events: EventCatalogItem[] = rawEvents.map((evt) => {
      let openRoleCount = 0
      let totalSeatsRemaining = 0

      evt.teams.forEach((t) => {
        t.roles.forEach((r) => {
          const filled = r.members.length
          const remaining = Math.max(0, r.seatsRequired - filled)
          if (remaining > 0) {
            openRoleCount++
            totalSeatsRemaining += remaining
          }
        })
      })

      return {
        id: evt.id,
        name: evt.name,
        description: evt.description,
        startDate: evt.startDate,
        endDate: evt.endDate,
        registrationDeadline: evt.registrationDeadline,
        rules: evt.rules,
        bannerUrl: evt.bannerUrl,
        teamSizeInfo: evt.teamSizeInfo,
        status: evt.status,
        teamCount: evt.teams.length,
        openRoleCount,
        totalSeatsRemaining,
      }
    })

    return { events }
  } catch (err: any) {
    console.error('Error fetching events catalog:', err)
    return { error: err.message || 'Failed to load events.' }
  }
}

/**
 * Fetches comprehensive event showcase details, registered squads, and open recruitment roles.
 */
export async function getEventShowcaseDetails(
  eventId: string
): Promise<{ error?: string; event?: EventShowcaseData }> {
  try {
    const rawEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        announcements: {
          orderBy: { publishedAt: 'desc' },
          include: {
            author: { select: { name: true } },
          },
        },
        teams: {
          where: {
            status: { in: ['ACTIVE', 'FULL', 'CLOSED'] },
          },
          include: {
            members: {
              where: { status: 'ACTIVE' },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    profilePhoto: true,
                  },
                },
              },
              orderBy: { joinedAt: 'asc' },
            },
            roles: {
              where: { status: { in: ['ACTIVE', 'PARTIALLY_FILLED'] } },
              include: {
                skills: {
                  include: {
                    skill: { select: { name: true } },
                  },
                },
                members: { where: { status: 'ACTIVE' }, select: { id: true } },
              },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    })

    if (!rawEvent) {
      return { error: 'Event not found.' }
    }

    const formattedTeams = rawEvent.teams.map((team) => {
      const openRoles = team.roles
        .map((r) => {
          const filled = r.members.length
          const remaining = Math.max(0, r.seatsRequired - filled)
          if (remaining <= 0) return null
          return {
            id: r.id,
            name: r.name,
            seatsRequired: remaining,
            skills: r.skills.map((s) => s.skill.name),
          }
        })
        .filter(Boolean) as Array<{
        id: string
        name: string
        seatsRequired: number
        skills: string[]
      }>

      return {
        id: team.id,
        name: team.name,
        description: team.description,
        status: team.status,
        memberCount: team.members.length,
        members: team.members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          username: m.user.username,
          avatarUrl: m.user.profilePhoto,
          membershipRole: m.membershipRole,
        })),
        openRoles,
      }
    })

    // Fetch current user participation state if authenticated
    const currentUserId = await getAuthUserId()
    let currentUserState: EventShowcaseData['currentUserState'] = undefined

    if (currentUserId) {
      const activeMember = await prisma.teamMember.findFirst({
        where: {
          userId: currentUserId,
          status: 'ACTIVE',
          team: { eventId: rawEvent.id },
        },
        include: {
          team: {
            select: { id: true, name: true },
          },
        },
      })

      if (activeMember) {
        currentUserState = {
          isRegistered: true,
          teamId: activeMember.team.id,
          teamName: activeMember.team.name,
          isLeader: activeMember.membershipRole === 'LEADER' || activeMember.membershipRole === 'CO_LEADER',
        }
      } else {
        const pendingApp = await prisma.application.findFirst({
          where: {
            userId: currentUserId,
            status: 'PENDING',
            team: { eventId: rawEvent.id },
          },
          include: {
            team: {
              select: { name: true },
            },
          },
        })

        if (pendingApp) {
          currentUserState = {
            isRegistered: false,
            hasPendingApplication: true,
            pendingTeamName: pendingApp.team.name,
          }
        }
      }
    }

    const eventData: EventShowcaseData = {
      id: rawEvent.id,
      name: rawEvent.name,
      description: rawEvent.description,
      startDate: rawEvent.startDate,
      endDate: rawEvent.endDate,
      registrationDeadline: rawEvent.registrationDeadline,
      rules: rawEvent.rules,
      bannerUrl: rawEvent.bannerUrl,
      teamSizeInfo: rawEvent.teamSizeInfo,
      status: rawEvent.status,
      teams: formattedTeams,
      currentUserState,
      announcements: rawEvent.announcements.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        publishedAt: a.publishedAt,
        author: { name: a.author.name },
      })),
    }

    return { event: eventData }
  } catch (err: any) {
    console.error('Error fetching event showcase details:', err)
    return { error: err.message || 'Failed to load event details.' }
  }
}


// ============================================================================
// ADMIN EVENT & HACKATHON ACTIONS (ADMIN-ONLY)
// ============================================================================

export interface AdminEventItem {
  id: string
  name: string
  description: string
  startDate: Date
  endDate: Date
  registrationDeadline: Date
  rules: string
  bannerUrl: string | null
  teamSizeInfo: string
  status: EventStatus
  teamCount: number
  totalMembersCount: number
  announcementCount: number
}

export interface AdminEventCounts {
  total: number
  draft: number
  published: number
  registrationOpen: number
  registrationClosed: number
  ongoing: number
  completed: number
  cancelled: number
  totalTeams: number
  totalParticipants: number
}

export interface AdminEventInput {
  name: string
  description: string
  startDate: string | Date
  endDate: string | Date
  registrationDeadline: string | Date
  rules: string
  teamSizeInfo: string
  bannerUrl?: string | null
  status?: EventStatus
}

/**
 * Fetches all events with administrative metrics (Admin Only)
 */
export async function getAdminEventsList(): Promise<{
  error?: string
  events?: AdminEventItem[]
  counts?: AdminEventCounts
}> {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  try {
    const rawEvents = await prisma.event.findMany({
      orderBy: [{ startDate: 'desc' }],
      include: {
        _count: {
          select: {
            teams: true,
            teamMembers: true,
            announcements: true,
          },
        },
      },
    })

    const events: AdminEventItem[] = rawEvents.map((e) => ({
      id: e.id,
      name: e.name,
      description: e.description,
      startDate: e.startDate,
      endDate: e.endDate,
      registrationDeadline: e.registrationDeadline,
      rules: e.rules,
      bannerUrl: e.bannerUrl,
      teamSizeInfo: e.teamSizeInfo,
      status: e.status,
      teamCount: e._count.teams,
      totalMembersCount: e._count.teamMembers,
      announcementCount: e._count.announcements,
    }))

    const counts: AdminEventCounts = {
      total: events.length,
      draft: events.filter((e) => e.status === 'DRAFT').length,
      published: events.filter((e) => e.status === 'PUBLISHED').length,
      registrationOpen: events.filter((e) => e.status === 'REGISTRATION_OPEN').length,
      registrationClosed: events.filter((e) => e.status === 'REGISTRATION_CLOSED').length,
      ongoing: events.filter((e) => e.status === 'ONGOING').length,
      completed: events.filter((e) => e.status === 'COMPLETED').length,
      cancelled: events.filter((e) => e.status === 'CANCELLED').length,
      totalTeams: events.reduce((acc, e) => acc + e.teamCount, 0),
      totalParticipants: events.reduce((acc, e) => acc + e.totalMembersCount, 0),
    }

    return { events, counts }
  } catch (err: any) {
    console.error('Error fetching admin events list:', err)
    return { error: err.message || 'Failed to fetch admin events list.' }
  }
}

/**
 * Creates a new event (Admin Only)
 */
export async function createAdminEvent(input: AdminEventInput): Promise<{
  success?: boolean
  error?: string
  eventId?: string
}> {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  if (!input.name?.trim()) {
    return { error: 'Event name is required.' }
  }
  if (!input.description?.trim()) {
    return { error: 'Event description is required.' }
  }
  if (!input.rules?.trim()) {
    return { error: 'Event rules & guidelines are required.' }
  }
  if (!input.teamSizeInfo?.trim()) {
    return { error: 'Team size rules are required (e.g., "2-4 Members").' }
  }

  try {
    const startDate = new Date(input.startDate)
    const endDate = new Date(input.endDate)
    const registrationDeadline = new Date(input.registrationDeadline)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || isNaN(registrationDeadline.getTime())) {
      return { error: 'Please provide valid dates for all schedule fields.' }
    }

    const newEvent = await prisma.event.create({
      data: {
        name: input.name.trim(),
        description: input.description.trim(),
        rules: input.rules.trim(),
        teamSizeInfo: input.teamSizeInfo.trim(),
        startDate,
        endDate,
        registrationDeadline,
        bannerUrl: input.bannerUrl?.trim() || null,
        status: input.status || 'DRAFT',
      },
    })

    revalidatePath('/admin/events')
    revalidatePath('/events')
    revalidatePath('/dashboard')

    return { success: true, eventId: newEvent.id }
  } catch (err: any) {
    console.error('Error creating admin event:', err)
    return { error: err.message || 'Failed to create event.' }
  }
}

/**
 * Updates an existing event (Admin Only)
 */
export async function updateAdminEvent(
  id: string,
  input: Partial<AdminEventInput>
): Promise<{ success?: boolean; error?: string }> {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  try {
    const existing = await prisma.event.findUnique({ where: { id } })
    if (!existing) {
      return { error: 'Event not found.' }
    }

    const dataToUpdate: any = {}
    if (input.name !== undefined) dataToUpdate.name = input.name.trim()
    if (input.description !== undefined) dataToUpdate.description = input.description.trim()
    if (input.rules !== undefined) dataToUpdate.rules = input.rules.trim()
    if (input.teamSizeInfo !== undefined) dataToUpdate.teamSizeInfo = input.teamSizeInfo.trim()
    if (input.bannerUrl !== undefined) dataToUpdate.bannerUrl = input.bannerUrl?.trim() || null
    if (input.status !== undefined) dataToUpdate.status = input.status

    if (input.startDate !== undefined) {
      const d = new Date(input.startDate)
      if (!isNaN(d.getTime())) dataToUpdate.startDate = d
    }
    if (input.endDate !== undefined) {
      const d = new Date(input.endDate)
      if (!isNaN(d.getTime())) dataToUpdate.endDate = d
    }
    if (input.registrationDeadline !== undefined) {
      const d = new Date(input.registrationDeadline)
      if (!isNaN(d.getTime())) dataToUpdate.registrationDeadline = d
    }

    await prisma.event.update({
      where: { id },
      data: dataToUpdate,
    })

    revalidatePath('/admin/events')
    revalidatePath('/events')
    revalidatePath(`/events/${id}`)

    return { success: true }
  } catch (err: any) {
    console.error('Error updating admin event:', err)
    return { error: err.message || 'Failed to update event.' }
  }
}

/**
 * Updates the status of an event (Admin Only)
 */
export async function setAdminEventStatus(
  id: string,
  status: EventStatus
): Promise<{ success?: boolean; error?: string; status?: EventStatus }> {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  try {
    const existing = await prisma.event.findUnique({ where: { id } })
    if (!existing) {
      return { error: 'Event not found.' }
    }

    await prisma.event.update({
      where: { id },
      data: { status },
    })

    revalidatePath('/admin/events')
    revalidatePath('/events')
    revalidatePath(`/events/${id}`)

    return { success: true, status }
  } catch (err: any) {
    console.error('Error changing event status:', err)
    return { error: err.message || 'Failed to change event status.' }
  }
}

/**
 * Deletes an event (Admin Only)
 */
export async function deleteAdminEvent(id: string): Promise<{ success?: boolean; error?: string }> {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  try {
    const existing = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: { select: { teams: true } },
      },
    })

    if (!existing) {
      return { error: 'Event not found.' }
    }

    if (existing._count.teams > 0 && existing.status !== 'DRAFT') {
      return {
        error: `Cannot delete event with ${existing._count.teams} active squads. You can archive or cancel it instead.`,
      }
    }

    await prisma.event.delete({ where: { id } })

    revalidatePath('/admin/events')
    revalidatePath('/events')

    return { success: true }
  } catch (err: any) {
    console.error('Error deleting admin event:', err)
    return { error: err.message || 'Failed to delete event.' }
  }
}
