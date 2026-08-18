'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

async function getAuthUserId(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || null
  } catch {
    return null
  }
}

/**
 * Fetches all active recruitment roles where the current user is a LEADER or CO_LEADER.
 */
export async function getMyActiveRecruitmentRoles() {
  const currentUserId = await getAuthUserId()
  if (!currentUserId) {
    return []
  }

  const leaderMemberships = await prisma.teamMember.findMany({
    where: {
      userId: currentUserId,
      status: 'ACTIVE',
      membershipRole: { in: ['LEADER', 'CO_LEADER'] },
      team: {
        status: { in: ['ACTIVE', 'FULL'] },
      },
    },
    include: {
      team: {
        include: {
          event: {
            select: {
              id: true,
              name: true,
              bannerUrl: true,
            },
          },
          roles: {
            where: {
              status: { in: ['ACTIVE', 'PARTIALLY_FILLED'] },
              expiry: { gt: new Date() },
            },
            include: {
              skills: {
                include: {
                  skill: true,
                },
              },
              members: {
                where: { status: 'ACTIVE' },
              },
            },
            orderBy: { expiry: 'asc' },
          },
        },
      },
    },
  })

  // Flatten out eligible roles with team and event metadata
  const rolesList = []
  for (const membership of leaderMemberships) {
    if (!membership.team?.roles) continue
    for (const role of membership.team.roles) {
      const activeMembersCount = role.members.length
      const remainingSeats = Math.max(0, role.seatsRequired - activeMembersCount)
      rolesList.push({
        id: role.id,
        name: role.name,
        seatsRequired: role.seatsRequired,
        remainingSeats,
        status: role.status,
        preferredLevel: role.preferredLevel,
        preferredExperience: role.preferredExperience,
        preferredAvailability: role.preferredAvailability,
        expiry: role.expiry,
        teamId: membership.team.id,
        teamName: membership.team.name,
        eventName: membership.team.event?.name || 'General Project',
        eventId: membership.team.eventId,
        requiredSkills: role.skills
          .filter((rs: { requirementType: string; skill: { id: string; name: string } }) => rs.requirementType === 'REQUIRED')
          .map((rs: { skill: { id: string; name: string } }) => ({ id: rs.skill.id, name: rs.skill.name })),
        preferredSkills: role.skills
          .filter((rs: { requirementType: string; skill: { id: string; name: string } }) => rs.requirementType === 'PREFERRED')
          .map((rs: { skill: { id: string; name: string } }) => ({ id: rs.skill.id, name: rs.skill.name })),
      })
    }
  }

  return rolesList
}

/**
 * Executes the V1 Matching Engine Algorithm for a specific Team Role.
 * Implements strict classification bucketing (EXACT > RELATED > INTEREST ONLY)
 * and deterministic intra-bucket sorting based on defined business rules.
 */
export async function getMatchedCandidatesForRole(roleId: string) {
  // 1. Fetch Role Requirements
  const role = await prisma.teamRole.findUnique({
    where: { id: roleId },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          eventId: true,
        },
      },
      skills: {
        include: {
          skill: {
            include: {
              relatedFrom: true,
              relatedTo: true,
            },
          },
        },
      },
      members: {
        where: { status: 'ACTIVE' },
      },
    },
  })

  if (!role) throw new Error('Role not found')

  const requiredSkillIds = role.skills
    .filter((rs) => rs.requirementType === 'REQUIRED')
    .map((rs) => rs.skillId)

  // 2. Fetch all candidates who are APPROVED, not TEAM_FULL
  const rawCandidates = await prisma.user.findMany({
    where: {
      verificationStatus: 'APPROVED',
      availability: { not: 'TEAM_FULL' },
      // Exclude those already in the team or with pending/accepted application for this team
      teamMemberships: { none: { teamId: role.teamId, status: 'ACTIVE' } },
      applications: { none: { teamId: role.teamId, status: { in: ['PENDING', 'ACCEPTED'] } } },
    },
    include: {
      department: true,
      college: true,
      skills: {
        include: {
          skill: true,
        },
      },
      interests: {
        include: {
          skill: true,
        },
      },
      projects: {
        where: { isPrivate: false },
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
        },
      },
      achievements: true,
      ratingsReceived: true,
    },
  })

  // 3. Apply Classification Bucketing
  const buckets = {
    EXACT: [] as any[],
    RELATED: [] as any[],
    INTEREST_ONLY: [] as any[],
  }

  // Get related skill mappings with mapping pairs
  const relatedSkillMap = new Map<string, { sourceSkillName: string; relatedSkillName: string }>()
  const relatedSkillIds = new Set<string>()

  role.skills.forEach((rs) => {
    if (rs.requirementType === 'REQUIRED') {
      rs.skill.relatedFrom.forEach((rel) => {
        relatedSkillIds.add(rel.relatedSkillId)
        relatedSkillMap.set(rel.relatedSkillId, {
          sourceSkillName: rs.skill.name,
          relatedSkillName: rs.skill.name,
        })
      })
      rs.skill.relatedTo.forEach((rel) => {
        relatedSkillIds.add(rel.sourceSkillId)
        relatedSkillMap.set(rel.sourceSkillId, {
          sourceSkillName: rs.skill.name,
          relatedSkillName: rs.skill.name,
        })
      })
    }
  })

  const calculateExperience = (projects: any[], relevantSkillIds: string[]) => {
    let relevantCount = 0
    projects.forEach((p) => {
      if (p.skills.some((ps: any) => relevantSkillIds.includes(ps.skillId))) relevantCount++
    })

    if (relevantCount === 0) return 'BEGINNER'
    if (relevantCount === 1) return 'SOME_EXPERIENCE'
    return 'EXPERIENCED'
  }

  const expRank = { BEGINNER: 1, SOME_EXPERIENCE: 2, EXPERIENCED: 3, ANY: 2 }
  const levelRank = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3 }

  for (const candidate of rawCandidates) {
    const candidateSkillIds = candidate.skills.map((s) => s.skillId)
    const candidateInterestIds = candidate.interests.map((i) => i.skillId)

    // Check Classification
    const hasExact = requiredSkillIds.some((id) => candidateSkillIds.includes(id))
    const hasRelated = Array.from(relatedSkillIds).some((id) => candidateSkillIds.includes(id))
    const hasInterest =
      requiredSkillIds.some((id) => candidateInterestIds.includes(id)) ||
      Array.from(relatedSkillIds).some((id) => candidateInterestIds.includes(id))

    if (!hasExact && !hasRelated && !hasInterest) {
      continue // NO MATCH, EXCLUDED from discovery
    }

    // Calculate Deterministic Sorting Factors
    const matchedRequiredSkills = candidate.skills.filter((s) => requiredSkillIds.includes(s.skillId))
    const requiredCoverage = matchedRequiredSkills.length
    const allRelevantIds = [...requiredSkillIds, ...Array.from(relatedSkillIds)]
    const actualExp = calculateExperience(candidate.projects, allRelevantIds)

    let levelFit = 0
    if (role.preferredLevel) {
      const relevantSkills = candidate.skills.filter((s) => allRelevantIds.includes(s.skillId))
      const maxLevelScore = Math.max(0, ...relevantSkills.map((s) => levelRank[s.level]))
      levelFit = maxLevelScore >= levelRank[role.preferredLevel] ? 1 : maxLevelScore === 0 ? 0 : -1
    }

    let expFit = 0
    if (role.preferredExperience && role.preferredExperience !== 'ANY') {
      expFit = expRank[actualExp as keyof typeof expRank] >= expRank[role.preferredExperience] ? 1 : -1
    }

    let availFit = 0
    if (role.preferredAvailability && role.preferredAvailability === candidate.availability) {
      availFit = 1
    }

    const avgRating =
      candidate.ratingsReceived.length > 0
        ? candidate.ratingsReceived.reduce((sum, r) => sum + r.score, 0) / candidate.ratingsReceived.length
        : 0

    // Find specific related skills and matched interests for UI chips
    const matchedRelatedSkills = candidate.skills.filter((s) => relatedSkillIds.has(s.skillId))
    const matchedInterests = candidate.interests.filter(
      (i) => requiredSkillIds.includes(i.skillId) || relatedSkillIds.has(i.skillId)
    )

    const processedCandidate = {
      ...candidate,
      matchCategory: hasExact ? 'EXACT' : hasRelated ? 'RELATED' : 'INTEREST_ONLY',
      experienceLevel: actualExp,
      matchedRequiredSkills: matchedRequiredSkills.map((s) => ({
        id: s.skill.id,
        name: s.skill.name,
        level: s.level,
      })),
      matchedRelatedSkills: matchedRelatedSkills.map((s) => ({
        id: s.skill.id,
        name: s.skill.name,
        level: s.level,
        relatedToRequired: relatedSkillMap.get(s.skillId)?.sourceSkillName,
      })),
      matchedInterests: matchedInterests.map((i) => ({
        id: i.skill.id,
        name: i.skill.name,
      })),
      matchMetrics: {
        requiredCoverage,
        requiredTotal: requiredSkillIds.length,
        levelFit,
        expFit,
        availFit,
        projectCount: candidate.projects.length,
        avgRating: Number(avgRating.toFixed(1)),
        totalRatings: candidate.ratingsReceived.length,
      },
    }

    if (hasExact) buckets.EXACT.push(processedCandidate)
    else if (hasRelated) buckets.RELATED.push(processedCandidate)
    else if (hasInterest) buckets.INTEREST_ONLY.push(processedCandidate)
  }

  // Strict Intra-Bucket Sorting
  const sortCandidates = (a: any, b: any) => {
    if (a.matchMetrics.requiredCoverage !== b.matchMetrics.requiredCoverage)
      return b.matchMetrics.requiredCoverage - a.matchMetrics.requiredCoverage

    if (a.matchMetrics.levelFit !== b.matchMetrics.levelFit)
      return b.matchMetrics.levelFit - a.matchMetrics.levelFit

    if (a.matchMetrics.expFit !== b.matchMetrics.expFit)
      return b.matchMetrics.expFit - a.matchMetrics.expFit

    if (a.matchMetrics.availFit !== b.matchMetrics.availFit)
      return b.matchMetrics.availFit - a.matchMetrics.availFit

    if (a.matchMetrics.projectCount !== b.matchMetrics.projectCount)
      return b.matchMetrics.projectCount - a.matchMetrics.projectCount

    return b.matchMetrics.avgRating - a.matchMetrics.avgRating
  }

  buckets.EXACT.sort(sortCandidates)
  buckets.RELATED.sort(sortCandidates)
  buckets.INTEREST_ONLY.sort(sortCandidates)

  const activeMembersCount = role.members.length
  const remainingSeats = Math.max(0, role.seatsRequired - activeMembersCount)

  return {
    role: {
      id: role.id,
      name: role.name,
      teamId: role.team.id,
      teamName: role.team.name,
      eventId: role.team.eventId,
      seatsRequired: role.seatsRequired,
      remainingSeats,
      status: role.status,
      preferredLevel: role.preferredLevel,
      preferredExperience: role.preferredExperience,
      preferredAvailability: role.preferredAvailability,
      requiredSkills: role.skills
        .filter((rs) => rs.requirementType === 'REQUIRED')
        .map((rs) => ({ id: rs.skill.id, name: rs.skill.name })),
      preferredSkills: role.skills
        .filter((rs) => rs.requirementType === 'PREFERRED')
        .map((rs) => ({ id: rs.skill.id, name: rs.skill.name })),
    },
    buckets,
    EXACT: buckets.EXACT,
    RELATED: buckets.RELATED,
    INTEREST_ONLY: buckets.INTEREST_ONLY,
  }
}
