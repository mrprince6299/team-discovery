'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const searchSchema = z.string().trim().min(1, 'Search query must not be empty.').max(100, 'Search query too long.')

export interface SearchUserResult {
  id: string
  name: string
  username: string
  profilePhoto: string | null
  bio: string | null
  availability: string
  year: number | null
  departmentName: string | null
  topSkills: string[]
  isBookmarked?: boolean
}

export interface SearchTeamResult {
  id: string
  name: string
  description: string
  status: string
  eventName: string | null
  activeRolesCount: number
  totalSeatsRemaining: number
  skills: string[]
  isBookmarked?: boolean
}

export interface SearchProjectResult {
  id: string
  title: string
  description: string
  role: string
  githubLink: string | null
  demoLink: string | null
  creatorId: string
  creatorName: string
  creatorUsername: string
  skills: string[]
  isBookmarked?: boolean
}

export interface SearchEventResult {
  id: string
  name: string
  description: string | null
  status: string
  startDate: Date | null
  endDate: Date | null
  registeredSquadsCount: number
}

export interface GlobalSearchResult {
  users: SearchUserResult[]
  teams: SearchTeamResult[]
  projects: SearchProjectResult[]
  events: SearchEventResult[]
  totalMatches: number
}

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
 * Global Instant Search across public platform entities:
 * 1. Candidates / Users
 * 2. Teams
 * 3. Public Projects (isPrivate = false strictly enforced)
 * 4. Events
 */
export async function globalSearch(
  rawQuery: string,
  actorUserId?: string
): Promise<{ success?: boolean; data?: GlobalSearchResult; error?: string }> {
  const currentUserId = await getAuthUserId(actorUserId)
  if (!currentUserId) {
    return { error: 'Unauthorized: Please log in to search.' }
  }

  const parseResult = searchSchema.safeParse(rawQuery)
  if (!parseResult.success) {
    return { error: parseResult.error.issues?.[0]?.message || parseResult.error.message || 'Invalid search query.' }
  }

  const query = parseResult.data

  try {
    const [usersRaw, teamsRaw, projectsRaw, eventsRaw] = await Promise.all([
      // 1. Search Users
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { username: { contains: query, mode: 'insensitive' } },
            { bio: { contains: query, mode: 'insensitive' } },
            { skills: { some: { skill: { name: { contains: query, mode: 'insensitive' } } } } },
          ],
        },
        select: {
          id: true,
          name: true,
          username: true,
          profilePhoto: true,
          bio: true,
          availability: true,
          year: true,
          department: { select: { name: true } },
          skills: {
            take: 3,
            select: { skill: { select: { name: true } } },
          },
        },
        take: 5,
        orderBy: { name: 'asc' },
      }),

      // 2. Search Teams
      prisma.team.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { event: { name: { contains: query, mode: 'insensitive' } } },
            { roles: { some: { name: { contains: query, mode: 'insensitive' } } } },
            { roles: { some: { skills: { some: { skill: { name: { contains: query, mode: 'insensitive' } } } } } } },
          ],
        },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          event: { select: { name: true } },
          roles: {
            where: { status: { in: ['ACTIVE', 'PARTIALLY_FILLED'] } },
            select: {
              id: true,
              seatsRequired: true,
              members: { where: { status: 'ACTIVE' }, select: { id: true } },
              skills: { take: 2, select: { skill: { select: { name: true } } } },
            },
          },
        },
        take: 5,
        orderBy: { name: 'asc' },
      }),

      // 3. Search Public Projects (Strictly isPrivate = false)
      prisma.project.findMany({
        where: {
          isPrivate: false,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { role: { contains: query, mode: 'insensitive' } },
            { skills: { some: { skill: { name: { contains: query, mode: 'insensitive' } } } } },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          role: true,
          githubLink: true,
          demoLink: true,
          userId: true,
          user: { select: { id: true, name: true, username: true } },
          skills: {
            take: 3,
            select: { skill: { select: { name: true } } },
          },
        },
        take: 5,
        orderBy: { title: 'asc' },
      }),

      // 4. Search Events
      prisma.event.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          startDate: true,
          endDate: true,
          teams: { select: { id: true } },
        },
        take: 5,
        orderBy: { name: 'asc' },
      }),
    ])

    // Collect all target IDs to check bookmark status in batch
    const candidateUserIds = usersRaw.map((u) => u.id)
    const candidateTeamIds = teamsRaw.map((t) => t.id)
    const candidateProjectIds = projectsRaw.map((p) => p.id)

    const userBookmarks = await prisma.bookmark.findMany({
      where: {
        userId: currentUserId,
        OR: [
          { targetType: 'USER', targetId: { in: candidateUserIds } },
          { targetType: 'TEAM', targetId: { in: candidateTeamIds } },
          { targetType: 'PROJECT', targetId: { in: candidateProjectIds } },
        ],
      },
      select: { targetType: true, targetId: true },
    })

    const bookmarkedSet = new Set(userBookmarks.map((b) => `${b.targetType}:${b.targetId}`))

    // Map into clean public projections
    const users: SearchUserResult[] = usersRaw.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      profilePhoto: u.profilePhoto,
      bio: u.bio,
      availability: u.availability,
      year: u.year,
      departmentName: u.department?.name || null,
      topSkills: u.skills.map((s) => s.skill.name),
      isBookmarked: bookmarkedSet.has(`USER:${u.id}`),
    }))

    const teams: SearchTeamResult[] = teamsRaw.map((t) => {
      let remainingSeats = 0
      const skillsSet = new Set<string>()

      for (const role of t.roles) {
        remainingSeats += Math.max(0, role.seatsRequired - role.members.length)
        for (const s of role.skills) {
          skillsSet.add(s.skill.name)
        }
      }

      return {
        id: t.id,
        name: t.name,
        description: t.description,
        status: t.status,
        eventName: t.event?.name || null,
        activeRolesCount: t.roles.length,
        totalSeatsRemaining: remainingSeats,
        skills: Array.from(skillsSet).slice(0, 3),
        isBookmarked: bookmarkedSet.has(`TEAM:${t.id}`),
      }
    })

    const projects: SearchProjectResult[] = projectsRaw.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      role: p.role,
      githubLink: p.githubLink,
      demoLink: p.demoLink,
      creatorId: p.user.id,
      creatorName: p.user.name,
      creatorUsername: p.user.username,
      skills: p.skills.map((s) => s.skill.name),
      isBookmarked: bookmarkedSet.has(`PROJECT:${p.id}`),
    }))

    const events: SearchEventResult[] = eventsRaw.map((e) => ({
      id: e.id,
      name: e.name,
      description: e.description,
      status: e.status,
      startDate: e.startDate,
      endDate: e.endDate,
      registeredSquadsCount: e.teams.length,
    }))

    const totalMatches = users.length + teams.length + projects.length + events.length

    return {
      success: true,
      data: {
        users,
        teams,
        projects,
        events,
        totalMatches,
      },
    }
  } catch (err: any) {
    return { error: err.message || 'Failed to execute global search.' }
  }
}
