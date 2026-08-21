'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { createInternalNotification } from './notifications'
import { ReportReason, ReportTargetType } from '@prisma/client'

async function getAuthUserId(providedUserId?: string): Promise<string | null> {
  if (providedUserId && process.env.NODE_ENV !== 'production') {
    return providedUserId
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

export interface SubmitReportInput {
  targetType: ReportTargetType
  targetId: string
  reason: ReportReason
  description?: string
  senderId?: string
}

/**
 * Submits a trust & safety report against a User, Team, Message, File, or Link.
 */
export async function submitReport(input: SubmitReportInput) {
  const reporterId = await getAuthUserId(input.senderId)
  if (!reporterId) {
    return { error: 'Unauthorized: You must be logged in to submit a report.' }
  }

  try {
    // 1. Verify reporter exists and is not suspended
    const reporter = await prisma.user.findUnique({
      where: { id: reporterId },
      select: { id: true, isSuspended: true, name: true },
    })

    if (!reporter) {
      return { error: 'Reporter account not found.' }
    }



    // 2. Prevent self-reporting
    if (input.targetType === 'USER' && input.targetId === reporterId) {
      return { error: 'You cannot report your own profile.' }
    }

    // 3. Verify target entity exists based on targetType
    switch (input.targetType) {
      case 'USER': {
        const targetUser = await prisma.user.findUnique({
          where: { id: input.targetId },
          select: { id: true },
        })
        if (!targetUser) return { error: 'Reported user does not exist.' }
        break
      }
      case 'TEAM': {
        const targetTeam = await prisma.team.findUnique({
          where: { id: input.targetId },
          select: { id: true },
        })
        if (!targetTeam) return { error: 'Reported squad does not exist.' }
        break
      }
      case 'MESSAGE': {
        const targetMessage = await prisma.message.findUnique({
          where: { id: input.targetId },
          select: { id: true },
        })
        if (!targetMessage) return { error: 'Reported message does not exist.' }
        break
      }
      case 'FILE': {
        const targetFile = await prisma.teamFile.findUnique({
          where: { id: input.targetId },
          select: { id: true },
        })
        if (!targetFile) return { error: 'Reported file does not exist.' }
        break
      }
      case 'LINK': {
        const targetLink = await prisma.teamLink.findUnique({
          where: { id: input.targetId },
          select: { id: true },
        })
        if (!targetLink) return { error: 'Reported link does not exist.' }
        break
      }
      default:
        return { error: 'Invalid report target type.' }
    }

    // 4. Duplicate report prevention (One active report per target per reporter)
    const existingActiveReport = await prisma.report.findFirst({
      where: {
        reporterId,
        targetType: input.targetType,
        targetId: input.targetId,
        status: { in: ['OPEN', 'IN_REVIEW'] },
      },
    })

    if (existingActiveReport) {
      return {
        error:
          'You already have an active report under review for this item. Our moderation team will investigate.',
      }
    }

    // 5. Description length constraint
    const trimmedDescription = input.description?.trim() || null
    if (trimmedDescription && trimmedDescription.length > 2000) {
      return { error: 'Report description cannot exceed 2,000 characters.' }
    }

    // 6. Create Report atomically
    const report = await prisma.report.create({
      data: {
        reporterId,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason,
        description: trimmedDescription,
        status: 'OPEN',
      },
    })

    // 7. Activity Log audit entry
    await prisma.activityLog.create({
      data: {
        userId: reporterId,
        actionType: 'REPORT_SUBMITTED',
        description: `Report submitted for ${input.targetType} (${input.reason})`,
        metadata: {
          reportId: report.id,
          targetType: input.targetType,
          targetId: input.targetId,
          reason: input.reason,
        },
      },
    })

    // 8. In-app confirmation notification to reporter
    await createInternalNotification({
      userId: reporterId,
      type: 'REPORT_RECEIVED',
      title: 'Report Received',
      content:
        'Thank you for reporting this issue. Our moderation team has received your report and will review it shortly.',
      referenceType: 'REPORT',
      referenceId: report.id,
    })

    return { success: true, reportId: report.id }
  } catch (error: unknown) {
    console.error('Error in submitReport:', error)
    return { error: 'Failed to submit report. Please try again later.' }
  }
}

/**
 * Retrieves the authenticated user's submitted reports with public-safe fields.
 */
export async function getMySubmittedReports() {
  const reporterId = await getAuthUserId()
  if (!reporterId) {
    return { error: 'Unauthorized.' }
  }

  try {
    const rawReports = await prisma.report.findMany({
      where: { reporterId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        targetType: true,
        targetId: true,
        reason: true,
        description: true,
        status: true,
        resolvedAt: true,
        createdAt: true,
        // Internal admin notes (resolutionNote, resolverId, actionTaken) are strictly omitted
      },
    })

    // Safely hydrate public display snapshot for each target
    const hydratedReports = await Promise.all(
      rawReports.map(async (rep) => {
        let targetSnapshot = 'Target'
        try {
          switch (rep.targetType) {
            case 'USER': {
              const u = await prisma.user.findUnique({
                where: { id: rep.targetId },
                select: { name: true, username: true },
              })
              if (u) targetSnapshot = `${u.name} (@${u.username})`
              break
            }
            case 'TEAM': {
              const t = await prisma.team.findUnique({
                where: { id: rep.targetId },
                select: { name: true },
              })
              if (t) targetSnapshot = t.name
              break
            }
            case 'MESSAGE': {
              const m = await prisma.message.findUnique({
                where: { id: rep.targetId },
                select: { content: true, sender: { select: { name: true } } },
              })
              if (m) targetSnapshot = `Message by ${m.sender.name}: "${m.content.slice(0, 40)}${m.content.length > 40 ? '...' : ''}"`
              break
            }
            case 'FILE': {
              const f = await prisma.teamFile.findUnique({
                where: { id: rep.targetId },
                select: { fileName: true },
              })
              if (f) targetSnapshot = `File: ${f.fileName}`
              break
            }
            case 'LINK': {
              const l = await prisma.teamLink.findUnique({
                where: { id: rep.targetId },
                select: { title: true },
              })
              if (l) targetSnapshot = `Link: ${l.title}`
              break
            }
          }
        } catch {
          // Fallback to default
        }

        return {
          ...rep,
          targetSnapshot,
        }
      })
    )

    return { reports: hydratedReports }
  } catch (error: unknown) {
    console.error('Error in getMySubmittedReports:', error)
    return { error: 'Failed to fetch your reports.' }
  }
}
