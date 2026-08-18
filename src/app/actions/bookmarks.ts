'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { TargetType } from '@prisma/client'
import { revalidatePath } from 'next/cache'

async function getAuthUserId(testOverrideUserId?: string): Promise<string | null> {
  if (testOverrideUserId && process.env.NODE_ENV !== 'production') {
    return testOverrideUserId
  }
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user?.id || null
  } catch {
    return null
  }
}

const toggleBookmarkSchema = z.object({
  targetType: z.enum(['USER', 'TEAM', 'PROJECT']),
  targetId: z.string().uuid('Invalid target ID format.'),
})

export interface SavedUserItem {
  id: string
  name: string
  username: string
  profilePhoto: string | null
  availability: string
  departmentName?: string | null
}

export interface SavedTeamItem {
  id: string
  name: string
  description: string
  status: string
  eventName?: string | null
  openRolesCount: number
}

export interface SavedProjectItem {
  id: string
  title: string
  description: string
  role: string
  githubLink: string | null
  figmaLink: string | null
  demoLink: string | null
  creator: {
    id: string
    name: string
    username: string
    profilePhoto: string | null
  }
  skills: Array<{ id: string; name: string }>
}

export interface BookmarkItem {
  id: string
  targetType: 'USER' | 'TEAM' | 'PROJECT'
  targetId: string
  createdAt: Date
  isAvailable: boolean
  user?: SavedUserItem | null
  team?: SavedTeamItem | null
  project?: SavedProjectItem | null
}

export async function toggleBookmark(
  input: { targetType: 'USER' | 'TEAM' | 'PROJECT'; targetId: string },
  testOverrideUserId?: string
): Promise<{ error?: string; isBookmarked?: boolean }> {
  const currentUserId = await getAuthUserId(testOverrideUserId)
  if (!currentUserId) {
    return { error: 'Unauthorized. Please log in to bookmark items.' }
  }

  const parsed = toggleBookmarkSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid bookmark payload.' }
  }

  const { targetType, targetId } = parsed.data

  try {
    // 1. Verify target existence and privacy rules
    if (targetType === 'USER') {
      const user = await prisma.user.findUnique({
        where: { id: targetId },
        select: { id: true },
      })
      if (!user) {
        return { error: 'Target user does not exist.' }
      }
    } else if (targetType === 'TEAM') {
      const team = await prisma.team.findUnique({
        where: { id: targetId },
        select: { id: true },
      })
      if (!team) {
        return { error: 'Target team does not exist.' }
      }
    } else if (targetType === 'PROJECT') {
      const project = await prisma.project.findUnique({
        where: { id: targetId },
        select: { id: true, isPrivate: true, userId: true },
      })
      if (!project) {
        return { error: 'Target project does not exist.' }
      }
      if (project.isPrivate && project.userId !== currentUserId) {
        return { error: 'Cannot bookmark a private project.' }
      }
    } else {
      return { error: 'Unsupported bookmark target type.' }
    }

    // 2. Check if already bookmarked
    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_targetType_targetId: {
          userId: currentUserId,
          targetType: targetType as TargetType,
          targetId,
        },
      },
    })

    if (existing) {
      // Remove bookmark
      await prisma.bookmark.delete({
        where: { id: existing.id },
      })

      try {
        revalidatePath('/dashboard')
        revalidatePath('/discover')
        revalidatePath('/teams')
      } catch {
        // Safe context ignoring in tests
      }

      return { isBookmarked: false }
    } else {
      // Create bookmark
      try {
        await prisma.bookmark.create({
          data: {
            userId: currentUserId,
            targetType: targetType as TargetType,
            targetId,
          },
        })
      } catch (createErr: any) {
        // Handle concurrent race safely
        if (createErr.code === 'P2002') {
          return { isBookmarked: true }
        }
        throw createErr
      }

      try {
        revalidatePath('/dashboard')
        revalidatePath('/discover')
        revalidatePath('/teams')
      } catch {
        // Safe context ignoring in tests
      }

      return { isBookmarked: true }
    }
  } catch (err: any) {
    console.error('Error toggling bookmark:', err)
    return { error: err.message || 'Failed to toggle bookmark.' }
  }
}

export async function checkBookmarkStatus(
  input: { targetType: 'USER' | 'TEAM' | 'PROJECT'; targetId: string },
  testOverrideUserId?: string
): Promise<{ error?: string; isBookmarked: boolean }> {
  const currentUserId = await getAuthUserId(testOverrideUserId)
  if (!currentUserId) {
    return { isBookmarked: false }
  }

  const parsed = toggleBookmarkSchema.safeParse(input)
  if (!parsed.success) {
    return { isBookmarked: false, error: 'Invalid input.' }
  }

  try {
    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_targetType_targetId: {
          userId: currentUserId,
          targetType: parsed.data.targetType as TargetType,
          targetId: parsed.data.targetId,
        },
      },
      select: { id: true },
    })

    return { isBookmarked: !!existing }
  } catch {
    return { isBookmarked: false }
  }
}

export async function getMyBookmarks(
  filterType?: 'ALL' | 'USER' | 'TEAM' | 'PROJECT',
  testOverrideUserId?: string
): Promise<{ error?: string; data?: BookmarkItem[] }> {
  const currentUserId = await getAuthUserId(testOverrideUserId)
  if (!currentUserId) {
    return { error: 'Unauthorized. Please log in to view saved items.' }
  }

  try {
    const whereClause: any = { userId: currentUserId }
    if (filterType && filterType !== 'ALL') {
      whereClause.targetType = filterType as TargetType
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    })

    if (bookmarks.length === 0) {
      return { data: [] }
    }

    // Separate target IDs by type to fetch details efficiently without N+1 queries
    const userIds = bookmarks.filter((b) => b.targetType === 'USER').map((b) => b.targetId)
    const teamIds = bookmarks.filter((b) => b.targetType === 'TEAM').map((b) => b.targetId)
    const projectIds = bookmarks.filter((b) => b.targetType === 'PROJECT').map((b) => b.targetId)

    const [users, teams, projects] = await Promise.all([
      userIds.length > 0
        ? prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
              id: true,
              name: true,
              username: true,
              profilePhoto: true,
              availability: true,
              department: { select: { name: true } },
            },
          })
        : [],

      teamIds.length > 0
        ? prisma.team.findMany({
            where: { id: { in: teamIds } },
            select: {
              id: true,
              name: true,
              description: true,
              status: true,
              event: { select: { name: true } },
              roles: {
                where: { status: 'ACTIVE' },
                select: { id: true },
              },
            },
          })
        : [],

      projectIds.length > 0
        ? prisma.project.findMany({
            where: { id: { in: projectIds } },
            select: {
              id: true,
              userId: true,
              title: true,
              description: true,
              role: true,
              githubLink: true,
              figmaLink: true,
              demoLink: true,
              isPrivate: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  profilePhoto: true,
                },
              },
              skills: {
                include: {
                  skill: { select: { id: true, name: true } },
                },
              },
            },
          })
        : [],
    ])

    const userMap = new Map(users.map((u) => [u.id, u]))
    const teamMap = new Map(teams.map((t) => [t.id, t]))
    const projectMap = new Map(projects.map((p) => [p.id, p]))

    const result: BookmarkItem[] = []

    for (const b of bookmarks) {
      if (b.targetType === 'USER') {
        const u = userMap.get(b.targetId)
        if (u) {
          result.push({
            id: b.id,
            targetType: 'USER',
            targetId: b.targetId,
            createdAt: b.createdAt,
            isAvailable: true,
            user: {
              id: u.id,
              name: u.name,
              username: u.username,
              profilePhoto: u.profilePhoto,
              availability: u.availability,
              departmentName: u.department?.name || null,
            },
          })
        } else {
          result.push({
            id: b.id,
            targetType: 'USER',
            targetId: b.targetId,
            createdAt: b.createdAt,
            isAvailable: false,
          })
        }
      } else if (b.targetType === 'TEAM') {
        const t = teamMap.get(b.targetId)
        if (t) {
          result.push({
            id: b.id,
            targetType: 'TEAM',
            targetId: b.targetId,
            createdAt: b.createdAt,
            isAvailable: true,
            team: {
              id: t.id,
              name: t.name,
              description: t.description,
              status: t.status,
              eventName: t.event?.name || null,
              openRolesCount: t.roles.length,
            },
          })
        } else {
          result.push({
            id: b.id,
            targetType: 'TEAM',
            targetId: b.targetId,
            createdAt: b.createdAt,
            isAvailable: false,
          })
        }
      } else if (b.targetType === 'PROJECT') {
        const p = projectMap.get(b.targetId)
        if (p && (!p.isPrivate || p.userId === currentUserId)) {
          result.push({
            id: b.id,
            targetType: 'PROJECT',
            targetId: b.targetId,
            createdAt: b.createdAt,
            isAvailable: true,
            project: {
              id: p.id,
              title: p.title,
              description: p.description,
              role: p.role,
              githubLink: p.githubLink,
              figmaLink: p.figmaLink,
              demoLink: p.demoLink,
              creator: {
                id: p.user.id,
                name: p.user.name,
                username: p.user.username,
                profilePhoto: p.user.profilePhoto,
              },
              skills: p.skills.map((s) => ({ id: s.skill.id, name: s.skill.name })),
            },
          })
        } else {
          result.push({
            id: b.id,
            targetType: 'PROJECT',
            targetId: b.targetId,
            createdAt: b.createdAt,
            isAvailable: false,
          })
        }
      }
    }

    return { data: result }
  } catch (err: any) {
    console.error('Error fetching bookmarks:', err)
    return { error: err.message || 'Failed to retrieve saved items.' }
  }
}
