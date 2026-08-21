'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { isCurrentUserAdmin } from '@/app/actions/verification'
import { createClient } from '@/utils/supabase/server'
import { createInternalNotification } from './notifications'
import { ReportReason, ReportTargetType, ReportStatus } from '@prisma/client'

async function getAdminAuthId(): Promise<string | null> {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return null
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

export interface AdminReportsFilter {
  status?: ReportStatus
  targetType?: ReportTargetType
  reason?: ReportReason
  search?: string
}

/**
 * 1. Admin Reports Queue
 */
export async function getAdminReportsQueue(filters?: AdminReportsFilter) {
  const adminId = await getAdminAuthId()
  if (!adminId) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  try {
    const whereClause: {
      status?: ReportStatus
      targetType?: ReportTargetType
      reason?: ReportReason
    } = {}

    if (filters?.status) whereClause.status = filters.status
    if (filters?.targetType) whereClause.targetType = filters.targetType
    if (filters?.reason) whereClause.reason = filters.reason

    const [reports, statusCounts] = await Promise.all([
      prisma.report.findMany({
        where: whereClause,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        include: {
          reporter: {
            select: {
              id: true,
              name: true,
              username: true,
              profilePhoto: true,
            },
          },
          resolver: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      }),
      Promise.all([
        prisma.report.count({ where: { status: 'OPEN' } }),
        prisma.report.count({ where: { status: 'IN_REVIEW' } }),
        prisma.report.count({ where: { status: 'RESOLVED' } }),
        prisma.report.count({ where: { status: 'DISMISSED' } }),
      ]),
    ])

    // Hydrate targets with context
    const userTargetIds = reports.filter((r) => r.targetType === 'USER').map((r) => r.targetId)
    const teamTargetIds = reports.filter((r) => r.targetType === 'TEAM').map((r) => r.targetId)
    const messageTargetIds = reports.filter((r) => r.targetType === 'MESSAGE').map((r) => r.targetId)

    const [usersMap, teamsMap, messagesMap] = await Promise.all([
      userTargetIds.length > 0
        ? prisma.user
            .findMany({
              where: { id: { in: userTargetIds } },
              select: {
                id: true,
                name: true,
                username: true,
                profilePhoto: true,
                isSuspended: true,
                college: { select: { name: true } },
                department: { select: { name: true } },
              },
            })
            .then((users) => new Map(users.map((u) => [u.id, u])))
        : new Map(),
      teamTargetIds.length > 0
        ? prisma.team
            .findMany({
              where: { id: { in: teamTargetIds } },
              select: {
                id: true,
                name: true,
                status: true,
                event: { select: { name: true } },
                _count: { select: { members: true } },
              },
            })
            .then((teams) => new Map(teams.map((t) => [t.id, t])))
        : new Map(),
      messageTargetIds.length > 0
        ? prisma.message
            .findMany({
              where: { id: { in: messageTargetIds } },
              select: {
                id: true,
                content: true,
                createdAt: true,
                sender: { select: { id: true, name: true, username: true } },
                conversation: { select: { team: { select: { id: true, name: true } } } },
              },
            })
            .then((msgs) => new Map(msgs.map((m) => [m.id, m])))
        : new Map(),
    ])

    const hydratedReports = reports.map((r) => ({
      ...r,
      targetUser: r.targetType === 'USER' ? usersMap.get(r.targetId) || null : null,
      targetTeam: r.targetType === 'TEAM' ? teamsMap.get(r.targetId) || null : null,
      targetMessage: r.targetType === 'MESSAGE' ? messagesMap.get(r.targetId) || null : null,
    }))

    return {
      reports: hydratedReports,
      counts: {
        open: statusCounts[0],
        inReview: statusCounts[1],
        resolved: statusCounts[2],
        dismissed: statusCounts[3],
        total: statusCounts[0] + statusCounts[1] + statusCounts[2] + statusCounts[3],
      },
    }
  } catch (error: unknown) {
    console.error('Error fetching admin reports queue:', error)
    return { error: 'Failed to load moderation queue.' }
  }
}

/**
 * 2. Update Report Status (e.g. Move to IN_REVIEW)
 */
export async function updateReportStatus(reportId: string, status: ReportStatus) {
  const adminId = await getAdminAuthId()
  if (!adminId) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  try {
    const report = await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        resolverId: adminId,
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: adminId,
        actionType: 'REPORT_IN_REVIEW',
        description: `Report ${reportId} marked as ${status}`,
        metadata: { reportId, status, adminId },
      },
    })

    revalidatePath('/admin/reports')
    return { success: true, report }
  } catch (error: unknown) {
    console.error('Error in updateReportStatus:', error)
    return { error: 'Failed to update report status.' }
  }
}

/**
 * 3. Resolve Report with Action
 */
export async function resolveReport(
  reportId: string,
  data?: {
    actionTaken?: string
    resolutionNote?: string
  }
) {
  const adminId = await getAdminAuthId()
  if (!adminId) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  const actionTaken = data?.actionTaken?.trim() || 'Report reviewed and resolved'

  try {
    const report = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'RESOLVED',
        resolverId: adminId,
        resolvedAt: new Date(),
        actionTaken,
        resolutionNote: data?.resolutionNote?.trim() || null,
      },
    })

    // Activity log entry
    await prisma.activityLog.create({
      data: {
        userId: adminId,
        actionType: 'REPORT_RESOLVED',
        description: `Report ${reportId} resolved with action: ${actionTaken}`,
        metadata: {
          reportId,
          actionTaken,
          adminId,
        },
      },
    })

    // Public resolution notification to reporter (without leaking internal notes)
    await createInternalNotification({
      userId: report.reporterId,
      type: 'REPORT_RESOLVED',
      title: 'Report Reviewed',
      content:
        'Your report has been reviewed and resolved by our moderation team. Thank you for keeping Team Discovery safe.',
      referenceType: 'REPORT',
      referenceId: report.id,
    })

    revalidatePath('/admin/reports')
    return { success: true, report }
  } catch (error: unknown) {
    console.error('Error in resolveReport:', error)
    return { error: 'Failed to resolve report.' }
  }
}

/**
 * 4. Dismiss Report (e.g. Unfounded / False Report)
 */
export async function dismissReport(reportId: string, reason?: string) {
  const adminId = await getAdminAuthId()
  if (!adminId) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  try {
    const report = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'DISMISSED',
        resolverId: adminId,
        resolvedAt: new Date(),
        actionTaken: 'DISMISSED_NO_ACTION',
        resolutionNote: reason?.trim() || 'Dismissed by administrator.',
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: adminId,
        actionType: 'REPORT_DISMISSED',
        description: `Report ${reportId} dismissed`,
        metadata: { reportId, adminId, reason },
      },
    })

    // Notify reporter that report was reviewed and closed
    await createInternalNotification({
      userId: report.reporterId,
      type: 'REPORT_RESOLVED',
      title: 'Report Reviewed',
      content:
        'Your report has been reviewed and closed by our moderation team. Thank you for your feedback.',
      referenceType: 'REPORT',
      referenceId: report.id,
    })

    revalidatePath('/admin/reports')
    return { success: true, report }
  } catch (error: unknown) {
    console.error('Error in dismissReport:', error)
    return { error: 'Failed to dismiss report.' }
  }
}

/**
 * 5. Reversible User Suspension
 */
export async function suspendUser(userId: string, reason: string) {
  const adminId = await getAdminAuthId()
  if (!adminId) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  if (!reason || reason.trim().length === 0) {
    return { error: 'A suspension reason is required.' }
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: true,
        suspendedAt: new Date(),
        suspendedById: adminId,
        suspensionReason: reason.trim(),
      },
    })

    // Activity log entry
    await prisma.activityLog.create({
      data: {
        userId: adminId,
        actionType: 'USER_SUSPENDED',
        description: `User @${updatedUser.username} was suspended`,
        metadata: {
          targetUserId: userId,
          adminId,
          reason: reason.trim(),
        },
      },
    })

    // Notify suspended user
    await createInternalNotification({
      userId,
      type: 'ACCOUNT_SUSPENDED',
      title: 'Account Suspended',
      content:
        'Your account has been temporarily suspended due to a violation of community guidelines.',
      referenceType: 'USER',
      referenceId: userId,
    })

    revalidatePath('/discover')
    revalidatePath('/admin/users')
    revalidatePath(`/users/${userId}`)
    return { success: true, user: updatedUser }
  } catch (error: unknown) {
    console.error('Error in suspendUser:', error)
    return { error: 'Failed to suspend user.' }
  }
}

/**
 * 6. Lift User Suspension
 */
export async function liftUserSuspension(userId: string) {
  const adminId = await getAdminAuthId()
  if (!adminId) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: false,
        suspendedAt: null,
        suspendedById: null,
        suspensionReason: null,
      },
    })

    // Activity log entry
    await prisma.activityLog.create({
      data: {
        userId: adminId,
        actionType: 'USER_UNSUSPENDED',
        description: `Suspension lifted for user @${updatedUser.username}`,
        metadata: {
          targetUserId: userId,
          adminId,
        },
      },
    })

    // Notify user
    await createInternalNotification({
      userId,
      type: 'ACCOUNT_RESTORED',
      title: 'Account Restored',
      content: 'Your account suspension has been lifted. Full access is restored.',
      referenceType: 'USER',
      referenceId: userId,
    })

    revalidatePath('/discover')
    revalidatePath('/admin/users')
    revalidatePath(`/users/${userId}`)
    return { success: true, user: updatedUser }
  } catch (error: unknown) {
    console.error('Error in liftUserSuspension:', error)
    return { error: 'Failed to lift user suspension.' }
  }
}
