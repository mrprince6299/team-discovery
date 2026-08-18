'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { createInternalNotification } from './notifications'

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

export interface SubmitRatingInput {
  teamId: string
  rateeId: string
  score: number
  feedback?: string
}

export interface PublicRatingData {
  id: string
  score: number
  feedback: string | null
  createdAt: Date
  rater: {
    id: string
    name: string
    username: string
    profilePhoto: string | null
  }
  team: {
    id: string
    name: string
  }
}

/**
 * Submits a 1-5 star peer rating for a teammate.
 * Strictly enforces the Final Peer Review Eligibility Rule:
 * 1. raterId !== rateeId
 * 2. Team is not DRAFT
 * 3. Rater is ACTIVE or LEFT member of team
 * 4. Ratee is ACTIVE or LEFT member of team
 * 5. Neither user has status REMOVED
 * 6. No prior rating from rater to ratee for this team
 */
export async function submitPeerRating(
  input: SubmitRatingInput,
  testOverrideUserId?: string
): Promise<{ error?: string; rating?: PublicRatingData }> {
  const raterId = await getAuthUserId(testOverrideUserId)
  if (!raterId) {
    return { error: 'Unauthorized. Please log in to submit a review.' }
  }

  // 1. Self-rating prevention
  if (raterId === input.rateeId) {
    return { error: 'Cannot rate yourself.' }
  }

  // 2. Score bounds validation
  if (
    typeof input.score !== 'number' ||
    !Number.isInteger(input.score) ||
    input.score < 1 ||
    input.score > 5
  ) {
    return { error: 'Score must be an integer between 1 and 5.' }
  }

  // 3. Feedback sanitization & length constraint
  const trimmedFeedback = input.feedback?.trim() || null
  if (trimmedFeedback && trimmedFeedback.length > 1000) {
    return { error: 'Feedback must not exceed 1000 characters.' }
  }

  try {
    // 4. Verify Team exists and is not DRAFT
    const team = await prisma.team.findUnique({
      where: { id: input.teamId },
      select: { id: true, name: true, status: true, eventId: true },
    })

    if (!team) {
      return { error: 'Team not found.' }
    }

    if (team.status === 'DRAFT') {
      return { error: 'Peer reviews can only be submitted for active or completed teams.' }
    }

    // 5. Verify Rater Membership (must be ACTIVE or LEFT, not REMOVED)
    const raterMembership = await prisma.teamMember.findFirst({
      where: {
        teamId: input.teamId,
        userId: raterId,
      },
      include: {
        user: { select: { id: true, name: true, username: true, profilePhoto: true } },
      },
    })

    if (!raterMembership || (raterMembership.status !== 'ACTIVE' && raterMembership.status !== 'LEFT')) {
      if (raterMembership?.status === 'REMOVED') {
        return { error: 'Removed members are not eligible to rate teammates.' }
      }
      return { error: 'You can only rate teammates from teams you collaborated with.' }
    }

    // 6. Verify Ratee Membership (must be ACTIVE or LEFT, not REMOVED)
    const rateeMembership = await prisma.teamMember.findFirst({
      where: {
        teamId: input.teamId,
        userId: input.rateeId,
      },
      include: {
        user: { select: { id: true, name: true, username: true } },
      },
    })

    if (!rateeMembership || (rateeMembership.status !== 'ACTIVE' && rateeMembership.status !== 'LEFT')) {
      if (rateeMembership?.status === 'REMOVED') {
        return { error: 'Removed members cannot receive peer reviews.' }
      }
      return { error: 'The selected user is not a verified teammate in this squad.' }
    }

    // 7. Check Duplicate Rating
    const existingRating = await prisma.rating.findUnique({
      where: {
        one_rating_per_peer_per_team: {
          raterId,
          rateeId: input.rateeId,
          teamId: input.teamId,
        },
      },
    })

    if (existingRating) {
      return { error: 'You have already reviewed this teammate for this team.' }
    }

    // 8. Create Rating & ActivityLog atomically in transaction
    const [newRating] = await prisma.$transaction([
      prisma.rating.create({
        data: {
          raterId,
          rateeId: input.rateeId,
          teamId: input.teamId,
          eventId: team.eventId || null, // scalar UUID
          score: input.score,
          feedback: trimmedFeedback,
        },
        include: {
          rater: {
            select: {
              id: true,
              name: true,
              username: true,
              profilePhoto: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.activityLog.create({
        data: {
          teamId: input.teamId,
          userId: raterId,
          actionType: 'RATING_SUBMITTED',
          description: `${raterMembership.user.name} submitted a peer review for ${rateeMembership.user.name}`,
        },
      }),
    ])

    // Notify ratee
    try {
      await createInternalNotification({
        userId: input.rateeId,
        type: 'RATING_RECEIVED',
        title: 'New Peer Review Received',
        content: `You received a ${input.score}-star peer review for your collaboration in ${team.name}!`,
        referenceType: 'USER',
        referenceId: raterId,
      })
    } catch {
      // Non-blocking notification
    }

    try {
      revalidatePath('/profile')
      revalidatePath(`/users/${input.rateeId}`)
      revalidatePath(`/teams/${input.teamId}`)
      revalidatePath(`/teams/${input.teamId}/workspace`)
    } catch {
      // Ignore during CLI testing outside request context
    }

    return {
      rating: {
        id: newRating.id,
        score: newRating.score,
        feedback: newRating.feedback,
        createdAt: newRating.createdAt,
        rater: {
          id: newRating.rater.id,
          name: newRating.rater.name,
          username: newRating.rater.username,
          profilePhoto: newRating.rater.profilePhoto,
        },
        team: {
          id: newRating.team.id,
          name: newRating.team.name,
        },
      },
    }
  } catch (err: any) {
    if (err.code === 'P2002') {
      return { error: 'You have already reviewed this teammate for this team.' }
    }
    console.error('Error in submitPeerRating:', err)
    return { error: err.message || 'Failed to submit peer review.' }
  }
}

/**
 * Checks if the authenticated user has already rated a specific teammate for a given team.
 */
export async function getTeammateRatingStatus(
  input: {
    teamId: string
    rateeId: string
  },
  testOverrideUserId?: string
): Promise<{ hasRated: boolean; rating?: { score: number; feedback: string | null; createdAt: Date } }> {
  const raterId = await getAuthUserId(testOverrideUserId)
  if (!raterId) {
    return { hasRated: false }
  }

  try {
    const rating = await prisma.rating.findUnique({
      where: {
        one_rating_per_peer_per_team: {
          raterId,
          rateeId: input.rateeId,
          teamId: input.teamId,
        },
      },
      select: {
        score: true,
        feedback: true,
        createdAt: true,
      },
    })

    if (!rating) {
      return { hasRated: false }
    }

    return {
      hasRated: true,
      rating: {
        score: rating.score,
        feedback: rating.feedback,
        createdAt: rating.createdAt,
      },
    }
  } catch {
    return { hasRated: false }
  }
}

/**
 * Fetches all teammates in a team who are eligible to be rated by the authenticated user,
 * along with their current rating status.
 */
export async function getEligibleTeammatesForRating(
  teamId: string,
  testOverrideUserId?: string
): Promise<{
  error?: string
  teammates?: Array<{
    userId: string
    name: string
    username: string
    avatarUrl: string | null
    membershipRole: string
    hasRated: boolean
    ratingScore?: number | null
  }>
}> {
  const raterId = await getAuthUserId(testOverrideUserId)
  if (!raterId) {
    return { error: 'Unauthorized.' }
  }

  try {
    // 1. Verify rater is member of team
    const raterMembership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: raterId,
        status: { in: ['ACTIVE', 'LEFT'] },
      },
    })

    if (!raterMembership) {
      return { error: 'You are not a verified member of this team.' }
    }

    // 2. Query other members of the team
    const members = await prisma.teamMember.findMany({
      where: {
        teamId,
        userId: { not: raterId },
        status: { in: ['ACTIVE', 'LEFT'] },
      },
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
    })

    // 3. Query existing ratings given by rater in this team
    const existingRatings = await prisma.rating.findMany({
      where: {
        teamId,
        raterId,
      },
      select: {
        rateeId: true,
        score: true,
      },
    })

    const ratingMap = new Map<string, number>()
    existingRatings.forEach((r) => ratingMap.set(r.rateeId, r.score))

    const teammates = members.map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      username: m.user.username,
      avatarUrl: m.user.profilePhoto,
      membershipRole: m.membershipRole,
      hasRated: ratingMap.has(m.user.id),
      ratingScore: ratingMap.get(m.user.id) || null,
    }))

    return { teammates }
  } catch (err: any) {
    console.error('Error in getEligibleTeammatesForRating:', err)
    return { error: err.message || 'Failed to fetch eligible teammates.' }
  }
}
