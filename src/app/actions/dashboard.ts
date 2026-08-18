'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

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

export interface DashboardData {
  user: {
    id: string
    name: string
    username: string
    verificationStatus: string
    avatarUrl: string | null
    availability: string
    unreadNotificationsCount: number
  }
  metrics: {
    activeSquadsCount: number
    pendingApplicationsCount: number
    pendingInvitationsCount: number
    savedItemsCount: number
    peerReviewsCount: number
    avgRating: number | null
  }
  activeSquads: Array<{
    id: string
    name: string
    description: string
    membershipRole: string
    status: string
    memberCount: number
    myRoleName?: string | null
    event?: { id: string; name: string } | null
  }>
  pendingInvitations: Array<{
    id: string
    teamId: string
    teamName: string
    roleName: string
    senderName: string
    senderAvatar: string | null
    expiry: Date
    createdAt: Date
  }>
  pendingApplications: Array<{
    id: string
    teamId: string
    teamName: string
    roleName: string
    createdAt: Date
    status: string
  }>
  registeredEvents: Array<{
    id: string
    name: string
    description: string
    startDate: Date
    endDate: Date
    registrationDeadline: Date
    status: string
    teamCount: number
  }>
  recentActivity: Array<{
    id: string
    teamId?: string | null
    teamName?: string | null
    actionType: string
    description: string
    createdAt: Date
  }>
}

export async function getDashboardData(
  testOverrideUserId?: string
): Promise<{ error?: string; data?: DashboardData }> {
  const currentUserId = await getAuthUserId(testOverrideUserId)
  if (!currentUserId) {
    return { error: 'Unauthorized. Please log in to access your command center.' }
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        name: true,
        username: true,
        profilePhoto: true,
        verificationStatus: true,
        availability: true,
      },
    })

    if (!dbUser) {
      return { error: 'User profile not found.' }
    }

    // 1. Fetch active squad memberships
    const activeMemberships = await prisma.teamMember.findMany({
      where: {
        userId: currentUserId,
        status: 'ACTIVE',
      },
      include: {
        team: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
                description: true,
                startDate: true,
                endDate: true,
                registrationDeadline: true,
                status: true,
              },
            },
            members: {
              where: { status: 'ACTIVE' },
              select: { id: true },
            },
          },
        },
        role: {
          select: { name: true },
        },
      },
      orderBy: { joinedAt: 'desc' },
    })

    const myTeamIds = activeMemberships.map((m) => m.teamId)

    // 2. Parallel queries for other dashboard sections
    const [
      pendingApplications,
      pendingInvitations,
      bookmarksCount,
      ratings,
      unreadNotificationsCount,
      recentActivityLogs,
    ] = await Promise.all([
      // Pending applications sent by user
      prisma.application.findMany({
        where: {
          userId: currentUserId,
          status: 'PENDING',
        },
        include: {
          team: { select: { id: true, name: true } },
          role: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Pending received invitations
      prisma.invitation.findMany({
        where: {
          recipientId: currentUserId,
          status: 'PENDING',
          expiry: { gt: new Date() },
        },
        include: {
          team: { select: { id: true, name: true } },
          role: { select: { id: true, name: true } },
          sender: { select: { id: true, name: true, profilePhoto: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Bookmarks count
      prisma.bookmark.count({
        where: { userId: currentUserId },
      }),

      // Ratings received by user
      prisma.rating.findMany({
        where: { rateeId: currentUserId },
        select: { score: true },
      }),

      // Unread notifications count
      prisma.notification.count({
        where: { userId: currentUserId, isRead: false },
      }),

      // Recent activity logs for user or user's active teams
      prisma.activityLog.findMany({
        where: {
          OR: [
            { userId: currentUserId },
            ...(myTeamIds.length > 0 ? [{ teamId: { in: myTeamIds } }] : []),
          ],
        },
        include: {
          team: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

    // Calculate metrics
    const peerReviewsCount = ratings.length
    const avgRating =
      ratings.length > 0
        ? Number((ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length).toFixed(1))
        : null

    // Format active squads
    const activeSquads = activeMemberships.map((m) => ({
      id: m.team.id,
      name: m.team.name,
      description: m.team.description,
      membershipRole: m.membershipRole,
      status: m.team.status,
      memberCount: m.team.members.length,
      myRoleName: m.role?.name || null,
      event: m.team.event ? { id: m.team.event.id, name: m.team.event.name } : null,
    }))

    // Extract unique registered events from active squads
    const eventsMap = new Map<string, any>()
    for (const m of activeMemberships) {
      if (m.team.event && !eventsMap.has(m.team.event.id)) {
        eventsMap.set(m.team.event.id, {
          id: m.team.event.id,
          name: m.team.event.name,
          description: m.team.event.description,
          startDate: m.team.event.startDate,
          endDate: m.team.event.endDate,
          registrationDeadline: m.team.event.registrationDeadline,
          status: m.team.event.status,
          teamCount: 1,
        })
      }
    }

    const registeredEvents = Array.from(eventsMap.values())

    return {
      data: {
        user: {
          id: dbUser.id,
          name: dbUser.name,
          username: dbUser.username,
          verificationStatus: dbUser.verificationStatus,
          avatarUrl: dbUser.profilePhoto,
          availability: dbUser.availability,
          unreadNotificationsCount,
        },
        metrics: {
          activeSquadsCount: activeSquads.length,
          pendingApplicationsCount: pendingApplications.length,
          pendingInvitationsCount: pendingInvitations.length,
          savedItemsCount: bookmarksCount,
          peerReviewsCount,
          avgRating,
        },
        activeSquads,
        pendingInvitations: pendingInvitations.map((inv) => ({
          id: inv.id,
          teamId: inv.team.id,
          teamName: inv.team.name,
          roleName: inv.role.name,
          senderName: inv.sender.name,
          senderAvatar: inv.sender.profilePhoto,
          expiry: inv.expiry,
          createdAt: inv.createdAt,
        })),
        pendingApplications: pendingApplications.map((app) => ({
          id: app.id,
          teamId: app.team.id,
          teamName: app.team.name,
          roleName: app.role.name,
          createdAt: app.createdAt,
          status: app.status,
        })),
        registeredEvents,
        recentActivity: recentActivityLogs.map((log) => ({
          id: log.id,
          teamId: log.teamId,
          teamName: log.team?.name || null,
          actionType: log.actionType,
          description: log.description,
          createdAt: log.createdAt,
        })),
      },
    }
  } catch (err: any) {
    console.error('Error fetching dashboard data:', err)
    return { error: err.message || 'Failed to load command center data.' }
  }
}
