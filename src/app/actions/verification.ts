'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateProfileCompleteness } from '@/lib/verification'
import { parseProfileRole } from '@/lib/constants/options'
import { createInternalNotification } from '@/app/actions/notifications'
import type { VerificationStatus } from '@prisma/client'

async function getAuthUserId(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || null
  } catch {
    return null
  }
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const userId = await getAuthUserId()
  if (!userId) return false

  const adminRole = await prisma.userRole.findFirst({
    where: { userId, role: 'ADMIN' },
  })
  return !!adminRole
}

export async function getStudentVerificationStatus() {
  const userId = await getAuthUserId()
  if (!userId) {
    return { error: 'Unauthorized: Please log in' }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      department: true,
      college: true,
      privateData: true,
      skills: {
        include: { skill: true },
      },
      interests: {
        include: { skill: true },
      },
      projects: true,
      verificationReq: {
        include: {
          reviewer: {
            select: { name: true, username: true },
          },
        },
      },
    },
  })

  if (!user) {
    return { error: 'User record not found' }
  }

  const completeness = calculateProfileCompleteness(user)
  const { role, cleanBio } = parseProfileRole(user.bio)

  return {
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.privateData?.collegeEmail || '',
      erp: user.privateData?.erp || '',
      verificationStatus: user.verificationStatus,
      college: user.college?.name || null,
      department: user.department?.name || null,
      year: user.year,
      primaryRole: role,
      bio: cleanBio,
      skills: user.skills.map((s) => ({ id: s.skill.id, name: s.skill.name, level: s.level })),
      completeness,
    },
    verificationRequest: user.verificationReq
      ? {
          id: user.verificationReq.id,
          status: user.verificationReq.status,
          rejectionReason: user.verificationReq.rejectionReason,
          createdAt: user.verificationReq.createdAt,
          updatedAt: user.verificationReq.updatedAt,
          reviewerName: user.verificationReq.reviewer?.name || null,
        }
      : null,
  }
}

export async function submitStudentVerificationRequest() {
  const userId = await getAuthUserId()
  if (!userId) {
    return { error: 'Unauthorized: Please log in' }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      privateData: true,
      verificationReq: true,
    },
  })

  if (!user) {
    return { error: 'User record not found' }
  }

  // Prevent duplicate pending requests
  if (user.verificationReq && user.verificationReq.status === 'PENDING') {
    return { error: 'You already have an active verification request under review.' }
  }

  const erpIdentifier = user.privateData?.erp || user.username || 'STUDENT'

  try {
    await prisma.$transaction(async (tx) => {
      await tx.verificationRequest.upsert({
        where: { userId: user.id },
        update: {
          status: 'PENDING',
          rejectionReason: null,
          erp: erpIdentifier,
          updatedAt: new Date(),
        },
        create: {
          userId: user.id,
          status: 'PENDING',
          erp: erpIdentifier,
        },
      })

      await tx.user.update({
        where: { id: user.id },
        data: {
          verificationStatus: 'PENDING',
        },
      })
    })

    revalidatePath('/verify/student')
    revalidatePath('/profile')
    revalidatePath(`/users/${user.id}`)
    revalidatePath('/admin/verify')

    return { success: true, message: 'Verification request submitted for admin review.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to submit verification request' }
  }
}

export async function getAdminVerificationList(filters?: {
  status?: string
  search?: string
}) {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  const rawRequests = await prisma.verificationRequest.findMany({
    include: {
      user: {
        include: {
          department: true,
          college: true,
          privateData: true,
          skills: {
            include: { skill: true },
          },
          interests: {
            include: { skill: true },
          },
          projects: true,
        },
      },
      reviewer: {
        select: { id: true, name: true, username: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const counts = {
    total: rawRequests.length,
    pending: rawRequests.filter((r) => r.status === 'PENDING').length,
    approved: rawRequests.filter((r) => r.status === 'APPROVED').length,
    rejected: rawRequests.filter((r) => r.status === 'REJECTED').length,
  }

  let filtered = rawRequests

  if (filters?.status && filters.status !== 'ALL') {
    filtered = filtered.filter((r) => r.status === filters.status)
  }

  if (filters?.search && filters.search.trim().length > 0) {
    const q = filters.search.toLowerCase().trim()
    filtered = filtered.filter((r) => {
      const name = r.user.name.toLowerCase()
      const username = r.user.username.toLowerCase()
      const email = (r.user.privateData?.collegeEmail || '').toLowerCase()
      const college = (r.user.college?.name || '').toLowerCase()
      const dept = (r.user.department?.name || '').toLowerCase()
      return (
        name.includes(q) ||
        username.includes(q) ||
        email.includes(q) ||
        college.includes(q) ||
        dept.includes(q)
      )
    })
  }

  const formattedRequests = filtered.map((req) => {
    const completeness = calculateProfileCompleteness(req.user)
    const { role } = parseProfileRole(req.user.bio)

    return {
      id: req.id,
      userId: req.user.id,
      name: req.user.name,
      username: req.user.username,
      avatarUrl: req.user.profilePhoto,
      email: req.user.privateData?.collegeEmail || '',
      erp: req.erp || req.user.privateData?.erp || '',
      status: req.status,
      rejectionReason: req.rejectionReason,
      createdAt: req.createdAt,
      updatedAt: req.updatedAt,
      reviewerName: req.reviewer?.name || null,
      college: req.user.college?.name || 'Not specified',
      department: req.user.department?.name || 'Not specified',
      year: req.user.year,
      primaryRole: role || 'Not set',
      skills: req.user.skills.map((s) => ({ name: s.skill.name, level: s.level })),
      completenessPercentage: completeness.percentage,
      completenessBreakdown: completeness.breakdown,
      projectCount: req.user.projects.length,
    }
  })

  return {
    counts,
    requests: formattedRequests,
  }
}

export async function reviewStudentVerification(data: {
  requestId: string
  action: 'APPROVE' | 'REJECT'
  rejectionReason?: string
}) {
  const userId = await getAuthUserId()
  if (!userId) {
    return { error: 'Unauthorized: Please log in' }
  }

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return { error: 'Unauthorized: Only system administrators can review verification requests.' }
  }

  const request = await prisma.verificationRequest.findUnique({
    where: { id: data.requestId },
    include: { user: true },
  })

  if (!request) {
    return { error: 'Verification request not found.' }
  }

  const newStatus: VerificationStatus = data.action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
  const reason = data.action === 'REJECT' ? data.rejectionReason?.trim() || 'Profile details need clarification.' : null

  try {
    await prisma.$transaction(async (tx) => {
      await tx.verificationRequest.update({
        where: { id: request.id },
        data: {
          status: newStatus,
          reviewerId: userId,
          rejectionReason: reason,
          updatedAt: new Date(),
        },
      })

      await tx.user.update({
        where: { id: request.userId },
        data: {
          verificationStatus: newStatus,
        },
      })

      // Send in-app notification to the student
      if (data.action === 'APPROVE') {
        await createInternalNotification(
          {
            userId: request.userId,
            type: 'VERIFICATION_APPROVED',
            title: 'Student Verification Approved',
            content: 'Congratulations! Your student verification request has been approved. You now have the Verified Student badge and priority trust ranking in teammate discovery.',
            referenceType: 'VERIFICATION_REQUEST',
            referenceId: request.id,
          },
          tx
        )
      } else {
        await createInternalNotification(
          {
            userId: request.userId,
            type: 'VERIFICATION_REJECTED',
            title: 'Student Verification Update',
            content: `Your student verification request was not approved: ${reason || 'Please ensure your profile and academic information are complete and resubmit.'}`,
            referenceType: 'VERIFICATION_REQUEST',
            referenceId: request.id,
          },
          tx
        )
      }
    })

    revalidatePath('/admin/verify')
    revalidatePath('/verify/student')
    revalidatePath('/profile')
    revalidatePath(`/users/${request.userId}`)
    revalidatePath('/discover')

    return { success: true, message: `Verification request has been ${newStatus.toLowerCase()}.` }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to process review' }
  }
}
