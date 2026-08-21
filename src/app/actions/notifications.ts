'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
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

export interface NotificationItem {
  id: string
  userId: string
  type: string
  title: string
  content: string
  referenceType: string
  referenceId: string
  isRead: boolean
  createdAt: Date
}

export type NotificationCategory = 'ALL' | 'UNREAD' | 'TEAM' | 'EVENT' | 'VERIFICATION' | 'REVIEWS'

const TEAM_NOTIFICATION_TYPES = [
  'APPLICATION_RECEIVED',
  'APPLICATION_ACCEPTED',
  'APPLICATION_REJECTED',
  'APPLICATION_AUTO_CLOSED',
  'APPLICATION_WITHDRAWN',
  'INVITATION_RECEIVED',
  'INVITATION_ACCEPTED',
  'INVITATION_DECLINED',
  'ROLE_FILLED',
  'TEAM_FULL',
  'ROLE_EXPIRED',
  'LEADERSHIP_TRANSFERRED',
]

const EVENT_NOTIFICATION_TYPES = [
  'EVENT_ANNOUNCEMENT',
  'EVENT_PUBLISHED',
  'EVENT_UPDATED',
  'REGISTRATION_OPENING',
  'REGISTRATION_CLOSING',
]

const VERIFICATION_NOTIFICATION_TYPES = [
  'VERIFICATION_APPROVED',
  'VERIFICATION_REJECTED',
  'VERIFICATION_SUBMITTED',
]

const REVIEW_NOTIFICATION_TYPES = ['RATING_RECEIVED']

/**
 * Creates an in-app notification record. Can be run inside an existing Prisma transaction or standalone.
 */
export async function createInternalNotification(
  data: {
    userId: string
    type: string
    title: string
    content: string
    referenceType: string
    referenceId: string
  },
  tx?: any
): Promise<{ success: boolean; id?: string }> {
  const db = tx || prisma
  try {
    const notification = await db.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        content: data.content,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        isRead: false,
      },
    })
    return { success: true, id: notification.id }
  } catch (err: any) {
    console.error('Failed to create notification:', err)
    return { success: false }
  }
}

/**
 * Fetches notifications for the authenticated user with category filtering.
 */
export async function getMyNotifications(
  filter: NotificationCategory = 'ALL',
  testOverrideUserId?: string
): Promise<{ error?: string; notifications?: NotificationItem[]; unreadCount?: number }> {
  const currentUserId = await getAuthUserId(testOverrideUserId)
  if (!currentUserId) {
    return { error: 'Unauthorized. Please sign in to view notifications.', notifications: [], unreadCount: 0 }
  }

  try {
    const whereCondition: any = { userId: currentUserId }

    if (filter === 'UNREAD') {
      whereCondition.isRead = false
    } else if (filter === 'TEAM') {
      whereCondition.type = { in: TEAM_NOTIFICATION_TYPES }
    } else if (filter === 'EVENT') {
      whereCondition.type = { in: EVENT_NOTIFICATION_TYPES }
    } else if (filter === 'VERIFICATION') {
      whereCondition.type = { in: VERIFICATION_NOTIFICATION_TYPES }
    } else if (filter === 'REVIEWS') {
      whereCondition.type = { in: REVIEW_NOTIFICATION_TYPES }
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.notification.count({
        where: { userId: currentUserId, isRead: false },
      }),
    ])

    return {
      notifications: notifications.map((n) => ({
        id: n.id,
        userId: n.userId,
        type: n.type,
        title: n.title,
        content: n.content,
        referenceType: n.referenceType,
        referenceId: n.referenceId,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      unreadCount,
    }
  } catch (err: any) {
    return { error: err.message || 'Failed to fetch notifications.', notifications: [], unreadCount: 0 }
  }
}

/**
 * Retrieves latest notifications for the Navbar Dropdown Preview.
 */
export async function getLatestNotificationsPreview(
  limit: number = 5,
  testOverrideUserId?: string
): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
  const currentUserId = await getAuthUserId(testOverrideUserId)
  if (!currentUserId) {
    return { notifications: [], unreadCount: 0 }
  }

  try {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: currentUserId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId: currentUserId, isRead: false },
      }),
    ])

    return {
      notifications: notifications.map((n) => ({
        id: n.id,
        userId: n.userId,
        type: n.type,
        title: n.title,
        content: n.content,
        referenceType: n.referenceType,
        referenceId: n.referenceId,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      unreadCount,
    }
  } catch {
    return { notifications: [], unreadCount: 0 }
  }
}

/**
 * Retrieves unread notification count for lightweight Navbar badge rendering.
 */
export async function getUnreadNotificationCount(
  testOverrideUserId?: string
): Promise<{ error?: string; unreadCount: number }> {
  const currentUserId = await getAuthUserId(testOverrideUserId)
  if (!currentUserId) {
    return { unreadCount: 0 }
  }

  try {
    const unreadCount = await prisma.notification.count({
      where: { userId: currentUserId, isRead: false },
    })
    return { unreadCount }
  } catch {
    return { unreadCount: 0 }
  }
}

/**
 * Marks a single notification as read. Idempotent and strictly enforces ownership.
 */
export async function markNotificationRead(
  notificationId: string,
  testOverrideUserId?: string
): Promise<{ error?: string; success?: boolean }> {
  const currentUserId = await getAuthUserId(testOverrideUserId)
  if (!currentUserId) {
    return { error: 'Unauthorized.' }
  }

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification) {
      return { error: 'Notification not found.' }
    }

    if (notification.userId !== currentUserId) {
      return { error: 'Unauthorized: You can only update your own notifications.' }
    }

    if (!notification.isRead) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      })
    }

    try {
      revalidatePath('/notifications')
    } catch {
      // Ignore during CLI testing outside request context
    }
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to mark notification as read.' }
  }
}

/**
 * Marks all notifications as read for the authenticated user.
 */
export async function markAllNotificationsRead(
  testOverrideUserId?: string
): Promise<{ error?: string; success?: boolean; updatedCount?: number }> {
  const currentUserId = await getAuthUserId(testOverrideUserId)
  if (!currentUserId) {
    return { error: 'Unauthorized.' }
  }

  try {
    const res = await prisma.notification.updateMany({
      where: { userId: currentUserId, isRead: false },
      data: { isRead: true },
    })

    try {
      revalidatePath('/notifications')
    } catch {
      // Ignore during CLI testing outside request context
    }
    return { success: true, updatedCount: res.count }
  } catch (err: any) {
    return { error: err.message || 'Failed to mark all notifications as read.' }
  }
}

/**
 * Deletes a single notification. Strictly enforces ownership.
 */
export async function deleteNotification(
  notificationId: string,
  testOverrideUserId?: string
): Promise<{ error?: string; success?: boolean }> {
  const currentUserId = await getAuthUserId(testOverrideUserId)
  if (!currentUserId) {
    return { error: 'Unauthorized.' }
  }

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification) {
      return { error: 'Notification not found.' }
    }

    if (notification.userId !== currentUserId) {
      return { error: 'Unauthorized: You can only delete your own notifications.' }
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    })

    try {
      revalidatePath('/notifications')
    } catch {
      // Ignore during CLI testing outside request context
    }
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to delete notification.' }
  }
}
