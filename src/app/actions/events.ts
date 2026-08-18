'use server'

import { prisma } from '@/lib/prisma'
import { EventStatus, TeamStatus } from '@prisma/client'

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
