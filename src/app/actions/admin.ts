'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { isCurrentUserAdmin } from '@/app/actions/verification'
import {
  AUTHORITATIVE_SKILLS,
  AUTHORITATIVE_ROLES,
  AUTHORITATIVE_PROGRAMS,
  AUTHORITATIVE_DEPARTMENTS,
  parseProfileRole,
} from '@/lib/constants/options'
import { parseProgramAndBranch, checkVerificationReadiness } from '@/lib/verification'

/**
 * 1. Admin Dashboard Overview Metrics
 */
export async function getAdminDashboardOverview() {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  const [
    totalStudents,
    totalAdmins,
    pendingVerification,
    verifiedStudents,
    rejectedVerification,
    totalTeams,
    activeTeams,
    pendingApplications,
    pendingInvitations,
    recentRequests,
  ] = await Promise.all([
    prisma.user.count({ where: { roles: { none: { role: 'ADMIN' } } } }),
    prisma.userRole.count({ where: { role: 'ADMIN' } }),
    prisma.verificationRequest.count({
      where: {
        status: 'PENDING',
        user: { roles: { none: { role: 'ADMIN' } } },
      },
    }),
    prisma.user.count({
      where: {
        verificationStatus: 'APPROVED',
        roles: { none: { role: 'ADMIN' } },
      },
    }),
    prisma.verificationRequest.count({
      where: {
        status: 'REJECTED',
        user: { roles: { none: { role: 'ADMIN' } } },
      },
    }),
    prisma.team.count(),
    prisma.team.count({ where: { status: 'ACTIVE' } }),
    prisma.application.count({ where: { status: 'PENDING' } }),
    prisma.invitation.count({ where: { status: 'PENDING' } }),
    prisma.verificationRequest.findMany({
      where: {
        user: { roles: { none: { role: 'ADMIN' } } },
      },
      take: 6,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePhoto: true,
            department: { select: { name: true } },
            college: { select: { name: true } },
          },
        },
      },
    }),
  ])

  return {
    metrics: {
      totalStudents,
      totalAdmins,
      pendingVerification,
      verifiedStudents,
      rejectedVerification,
      totalTeams,
      activeTeams,
      pendingApplications,
      pendingInvitations,
    },
    recentRequests: recentRequests.map((r) => ({
      id: r.id,
      userId: r.user.id,
      name: r.user.name,
      username: r.user.username,
      avatarUrl: r.user.profilePhoto,
      status: r.status,
      college: r.user.college?.name || 'Not specified',
      department: r.user.department?.name || 'Not specified',
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
  }
}

/**
 * 2. User Management List Action
 */
export async function getAdminUsersList() {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  const rawUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      college: { select: { name: true } },
      department: { select: { name: true } },
      privateData: { select: { collegeEmail: true, erp: true } },
      roles: { select: { role: true } },
      skills: {
        include: {
          skill: { select: { name: true, isCustom: true } },
        },
      },
      interests: {
        include: {
          skill: { select: { name: true } },
        },
      },
      teamMemberships: {
        where: { status: 'ACTIVE' },
        include: {
          team: { select: { id: true, name: true } },
        },
      },
      verificationReq: {
        select: { status: true, createdAt: true, updatedAt: true },
      },
    },
  })

  const users = rawUsers.map((u) => {
    const { role } = parseProfileRole(u.bio)
    const { program, branch } = parseProgramAndBranch(u.department?.name)
    const readiness = checkVerificationReadiness({
      name: u.name,
      bio: u.bio,
      year: u.year,
      availability: u.availability,
      department: u.department,
      college: u.college,
      skills: u.skills,
      interests: u.interests,
      privateData: u.privateData,
    })

    return {
      id: u.id,
      name: u.name,
      username: u.username,
      avatarUrl: u.profilePhoto,
      bio: u.bio,
      year: u.year,
      verificationStatus: u.verificationStatus,
      availability: u.availability,
      createdAt: u.createdAt,
      college: u.college?.name || 'Not specified',
      department: u.department?.name || 'Not specified',
      program: program || 'Not specified',
      branch: branch || 'Not specified',
      collegeEmail: u.privateData?.collegeEmail || null,
      erp: u.privateData?.erp || null,
      primaryRole: role || 'Member',
      isAdmin: u.roles.some((r) => r.role === 'ADMIN'),
      readinessPercentage: readiness.percentage,
      isVerificationReady: readiness.isReady,
      skills: u.skills.map((s) => ({
        name: s.skill.name,
        level: s.level,
        isCustom: s.skill.isCustom,
      })),
      interests: u.interests.map((i) => i.skill.name),
      activeTeams: u.teamMemberships.map((tm) => ({
        id: tm.team.id,
        name: tm.team.name,
      })),
    }
  })

  const nonAdminStudents = users.filter((u) => !u.isAdmin)
  const counts = {
    totalStudents: nonAdminStudents.length,
    verified: nonAdminStudents.filter((u) => u.verificationStatus === 'APPROVED').length,
    pending: nonAdminStudents.filter((u) => u.verificationStatus === 'PENDING').length,
    admins: users.filter((u) => u.isAdmin).length,
  }

  return { users, counts }
}

/**
 * 3. Team Management List Action
 */
export async function getAdminTeamsList() {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  const rawTeams = await prisma.team.findMany({
    orderBy: { id: 'desc' },
    include: {
      event: { select: { id: true, name: true, status: true } },
      members: {
        where: { status: 'ACTIVE' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              profilePhoto: true,
              verificationStatus: true,
            },
          },
          role: { select: { id: true, name: true } },
        },
      },
      roles: {
        include: {
          skills: {
            include: {
              skill: { select: { name: true } },
            },
          },
          members: {
            where: { status: 'ACTIVE' },
          },
        },
      },
      applications: {
        select: { id: true, status: true },
      },
      invitations: {
        select: { id: true, status: true },
      },
    },
  })

  const teams = rawTeams.map((t) => {
    const leaderMember = t.members.find((m) => m.membershipRole === 'LEADER')
    const totalRequiredSeats = t.roles.reduce((acc, r) => acc + r.seatsRequired, 0)

    return {
      id: t.id,
      name: t.name,
      description: t.description,
      status: t.status,
      eventName: t.event?.name || 'General Project',
      eventId: t.event?.id || null,
      leader: leaderMember
        ? {
            id: leaderMember.user.id,
            name: leaderMember.user.name,
            username: leaderMember.user.username,
            avatarUrl: leaderMember.user.profilePhoto,
            isVerified: leaderMember.user.verificationStatus === 'APPROVED',
          }
        : null,
      memberCount: t.members.length,
      totalSeats: totalRequiredSeats + (leaderMember ? 1 : 0),
      members: t.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        username: m.user.username,
        avatarUrl: m.user.profilePhoto,
        roleName: m.role?.name || m.membershipRole,
        membershipRole: m.membershipRole,
        isVerified: m.user.verificationStatus === 'APPROVED',
      })),
      roles: t.roles.map((r) => ({
        id: r.id,
        name: r.name,
        status: r.status,
        seatsRequired: r.seatsRequired,
        filledSeats: r.members.length,
        skills: r.skills.map((s) => s.skill.name),
      })),
      pendingApplicationsCount: t.applications.filter((a) => a.status === 'PENDING').length,
      pendingInvitationsCount: t.invitations.filter((i) => i.status === 'PENDING').length,
    }
  })

  const counts = {
    total: teams.length,
    active: teams.filter((t) => t.status === 'ACTIVE').length,
    full: teams.filter((t) => t.status === 'FULL').length,
    closed: teams.filter((t) => t.status === 'CLOSED').length,
    draft: teams.filter((t) => t.status === 'DRAFT').length,
  }

  return { teams, counts }
}

/**
 * 4. Platform & Verification Analytics Action
 */
export async function getAdminAnalytics() {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  const [
    totalStudents,
    totalAdmins,
    verifiedStudents,
    pendingStudents,
    totalTeams,
    activeTeams,
    fullTeams,
    closedTeams,
    draftTeams,
    totalApplications,
    acceptedApplications,
    pendingApplications,
    rejectedApplications,
    totalInvitations,
    acceptedInvitations,
    pendingInvitations,
    totalVerificationRequests,
    approvedVerificationRequests,
    pendingVerificationRequests,
    rejectedVerificationRequests,
    totalNotifications,
    readNotifications,
    totalMessages,
    totalFiles,
    totalLinks,
    ratings,
  ] = await Promise.all([
    prisma.user.count({ where: { roles: { none: { role: 'ADMIN' } } } }),
    prisma.userRole.count({ where: { role: 'ADMIN' } }),
    prisma.user.count({
      where: {
        verificationStatus: 'APPROVED',
        roles: { none: { role: 'ADMIN' } },
      },
    }),
    prisma.user.count({
      where: {
        verificationStatus: 'PENDING',
        roles: { none: { role: 'ADMIN' } },
      },
    }),
    prisma.team.count(),
    prisma.team.count({ where: { status: 'ACTIVE' } }),
    prisma.team.count({ where: { status: 'FULL' } }),
    prisma.team.count({ where: { status: 'CLOSED' } }),
    prisma.team.count({ where: { status: 'DRAFT' } }),
    prisma.application.count(),
    prisma.application.count({ where: { status: 'ACCEPTED' } }),
    prisma.application.count({ where: { status: 'PENDING' } }),
    prisma.application.count({ where: { status: 'REJECTED' } }),
    prisma.invitation.count(),
    prisma.invitation.count({ where: { status: 'ACCEPTED' } }),
    prisma.invitation.count({ where: { status: 'PENDING' } }),
    prisma.verificationRequest.count({
      where: {
        user: { roles: { none: { role: 'ADMIN' } } },
      },
    }),
    prisma.verificationRequest.count({
      where: {
        status: 'APPROVED',
        user: { roles: { none: { role: 'ADMIN' } } },
      },
    }),
    prisma.verificationRequest.count({
      where: {
        status: 'PENDING',
        user: { roles: { none: { role: 'ADMIN' } } },
      },
    }),
    prisma.verificationRequest.count({
      where: {
        status: 'REJECTED',
        user: { roles: { none: { role: 'ADMIN' } } },
      },
    }),
    prisma.notification.count(),
    prisma.notification.count({ where: { isRead: true } }),
    prisma.message.count(),
    prisma.teamFile.count(),
    prisma.teamLink.count(),
    prisma.rating.findMany({ select: { score: true } }),
  ])

  const totalRatingsCount = ratings.length
  const avgRatingScore =
    totalRatingsCount > 0
      ? Number((ratings.reduce((acc, r) => acc + r.score, 0) / totalRatingsCount).toFixed(2))
      : 0

  const resolvedVerification = approvedVerificationRequests + rejectedVerificationRequests
  const verificationApprovalRate =
    resolvedVerification > 0
      ? Math.round((approvedVerificationRequests / resolvedVerification) * 100)
      : 0

  const applicationAcceptanceRate =
    totalApplications > 0
      ? Math.round((acceptedApplications / totalApplications) * 100)
      : 0

  return {
    users: {
      total: totalStudents,
      totalStudents,
      totalAdmins,
      verified: verifiedStudents,
      verifiedStudents,
      pending: pendingStudents,
      pendingStudents,
      unverified: totalStudents - verifiedStudents,
      verificationRate: totalStudents > 0 ? Math.round((verifiedStudents / totalStudents) * 100) : 0,
    },
    teams: {
      total: totalTeams,
      active: activeTeams,
      full: fullTeams,
      closed: closedTeams,
      draft: draftTeams,
    },
    recruitment: {
      totalApplications,
      acceptedApplications,
      pendingApplications,
      rejectedApplications,
      applicationAcceptanceRate,
      totalInvitations,
      acceptedInvitations,
      pendingInvitations,
    },
    verification: {
      totalRequests: totalVerificationRequests,
      approved: approvedVerificationRequests,
      pending: pendingVerificationRequests,
      rejected: rejectedVerificationRequests,
      approvalRate: verificationApprovalRate,
      rejectionRate: resolvedVerification > 0 ? 100 - verificationApprovalRate : 0,
    },
    engagement: {
      totalNotifications,
      readNotifications,
      totalMessages,
      totalFiles,
      totalLinks,
      totalRatingsCount,
      avgRatingScore,
    },
  }
}

/**
 * 5. Taxonomy Analytics & Browser Action
 */
export async function getAdminTaxonomy() {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  const [dbSkills, userSkillCounts, roleSkillCounts] = await Promise.all([
    prisma.skill.findMany({
      select: { id: true, name: true, isCustom: true },
      orderBy: { name: 'asc' },
    }),
    prisma.userSkill.groupBy({
      by: ['skillId'],
      where: { user: { roles: { none: { role: 'ADMIN' } } } },
      _count: { userId: true },
    }),
    prisma.roleSkill.groupBy({
      by: ['skillId'],
      _count: { roleId: true },
    }),
  ])

  const userSkillCountMap = new Map(userSkillCounts.map((s) => [s.skillId, s._count.userId]))
  const roleSkillCountMap = new Map(roleSkillCounts.map((s) => [s.skillId, s._count.roleId]))

  const skills = dbSkills.map((s) => ({
    id: s.id,
    name: s.name,
    isCustom: s.isCustom,
    studentCount: userSkillCountMap.get(s.id) || 0,
    squadDemandCount: roleSkillCountMap.get(s.id) || 0,
  }))

  const customSkills = skills.filter((s) => s.isCustom)

  const dbCanonicalSkills = skills.filter((s) => !s.isCustom)
  const canonicalNamesInDb = new Set(dbCanonicalSkills.map((s) => s.name.toLowerCase()))

  // Build combined categories
  const categories: Record<string, string[]> = {}
  for (const item of AUTHORITATIVE_SKILLS) {
    if (!categories[item.category]) {
      categories[item.category] = []
    }
    categories[item.category].push(item.name)
  }

  // Canonical skills list combining database skills and authoritative catalog
  const canonicalSkills = dbCanonicalSkills.map((s) => {
    const authMatch = AUTHORITATIVE_SKILLS.find((a) => a.name.toLowerCase() === s.name.toLowerCase())
    const category = authMatch?.category || 'Backend'
    return {
      id: s.id,
      name: s.name,
      category,
      studentCount: s.studentCount,
      squadDemandCount: s.squadDemandCount,
    }
  })

  // Add any authoritative skills not yet in DB
  for (const auth of AUTHORITATIVE_SKILLS) {
    if (!canonicalNamesInDb.has(auth.name.toLowerCase())) {
      canonicalSkills.push({
        id: 'auth-' + auth.name,
        name: auth.name,
        category: auth.category,
        studentCount: 0,
        squadDemandCount: 0,
      })
    }
  }


  return {
    categories,
    canonicalSkills,
    customSkills,
    canonicalRoles: AUTHORITATIVE_ROLES,
    canonicalPrograms: AUTHORITATIVE_PROGRAMS,
    canonicalDepartments: AUTHORITATIVE_DEPARTMENTS,
    totalSkillsCount: skills.length,
    customSkillsCount: customSkills.length,
  }
}


// ============================================================================
// ADMIN TAXONOMY MUTATION ACTIONS (ADMIN-ONLY)
// ============================================================================

/**
 * Creates a new canonical or custom skill in the database
 */
export async function createAdminSkill(data: {
  name: string
  category?: string
  isCustom?: boolean
}): Promise<{ success?: boolean; error?: string; skill?: any }> {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  const name = data.name?.trim()
  if (!name) {
    return { error: 'Skill name is required.' }
  }

  try {
    const existing = await prisma.skill.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    })

    if (existing) {
      if (existing.isCustom && data.isCustom === false) {
        // Promote existing custom skill
        const updated = await prisma.skill.update({
          where: { id: existing.id },
          data: { isCustom: false },
        })
        revalidatePath('/admin/taxonomy')
        revalidatePath('/profile')
        revalidatePath('/teams/create')
        revalidatePath('/discover')
        return { success: true, skill: updated }
      }
      return { error: `Skill "${name}" already exists in the database.` }
    }

    const created = await prisma.skill.create({
      data: {
        name,
        isCustom: data.isCustom ?? false,
      },
    })

    revalidatePath('/admin/taxonomy')
    revalidatePath('/profile')
    revalidatePath('/teams/create')
    revalidatePath('/discover')

    return { success: true, skill: created }
  } catch (err: any) {
    console.error('Error creating admin skill:', err)
    return { error: err.message || 'Failed to create skill.' }
  }
}

/**
 * Updates or renames a skill
 */
export async function updateAdminSkill(
  id: string,
  data: { name?: string; isCustom?: boolean }
): Promise<{ success?: boolean; error?: string }> {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  try {
    const existing = await prisma.skill.findUnique({ where: { id } })
    if (!existing) {
      return { error: 'Skill not found.' }
    }

    const updateData: any = {}
    if (data.name !== undefined && data.name.trim()) {
      updateData.name = data.name.trim()
    }
    if (data.isCustom !== undefined) {
      updateData.isCustom = data.isCustom
    }

    await prisma.skill.update({
      where: { id },
      data: updateData,
    })

    revalidatePath('/admin/taxonomy')
    revalidatePath('/profile')
    revalidatePath('/teams/create')
    revalidatePath('/discover')

    return { success: true }
  } catch (err: any) {
    console.error('Error updating admin skill:', err)
    return { error: err.message || 'Failed to update skill.' }
  }
}

/**
 * Promotes a custom user-created skill to canonical
 */
export async function promoteCustomSkillToCanonical(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  return updateAdminSkill(id, { isCustom: false })
}

/**
 * Deletes a skill if it has no active references
 */
export async function deleteAdminSkill(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return { error: 'Unauthorized: Admin access required.' }
  }

  try {
    const skill = await prisma.skill.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            userSkills: true,
            roleSkills: true,
            projectSkills: true,
          },
        },
      },
    })

    if (!skill) {
      return { error: 'Skill not found.' }
    }

    const totalUsage =
      skill._count.userSkills + skill._count.roleSkills + skill._count.projectSkills

    if (totalUsage > 0) {
      return {
        error: `Cannot delete skill "${skill.name}" because it is actively used by ${totalUsage} student profiles or squad roles. You can keep it as a custom/inactive skill instead.`,
      }
    }

    await prisma.skill.delete({ where: { id } })

    revalidatePath('/admin/taxonomy')
    revalidatePath('/profile')
    revalidatePath('/teams/create')
    revalidatePath('/discover')

    return { success: true }
  } catch (err: any) {
    console.error('Error deleting admin skill:', err)
    return { error: err.message || 'Failed to delete skill.' }
  }
}
