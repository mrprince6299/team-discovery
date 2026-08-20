'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Availability, SkillLevel } from '@prisma/client'
import { AUTHORITATIVE_SKILLS, formatProfileBio } from '@/lib/constants/options'

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export async function getMyProfile() {
  const authUser = await getAuthenticatedUser()

  const profile = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: {
      college: true,
      department: true,
      privateData: true,
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
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
        },
        orderBy: { date: 'desc' },
      },
      achievements: {
        orderBy: { date: 'desc' },
      },
      ratingsReceived: {
        include: {
          rater: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      },
    },
  })

  if (!profile) {
    throw new Error('User profile not found')
  }

  // Calculate rating summary
  const totalRatings = profile.ratingsReceived.length
  const avgRating = totalRatings > 0
    ? profile.ratingsReceived.reduce((acc, r) => acc + r.score, 0) / totalRatings
    : 0

  return {
    ...profile,
    stats: {
      totalRatings,
      avgRating: Number(avgRating.toFixed(1)),
    },
  }
}

export async function getPublicProfile(userId: string) {
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      profilePhoto: true,
      bio: true,
      year: true,
      availability: true,
      verificationStatus: true,
      createdAt: true,
      college: {
        select: {
          name: true,
          domain: true,
        },
      },
      department: {
        select: {
          name: true,
        },
      },
      skills: {
        select: {
          level: true,
          skill: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      interests: {
        select: {
          skill: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      projects: {
        where: {
          isPrivate: false,
        },
        select: {
          id: true,
          title: true,
          description: true,
          role: true,
          githubLink: true,
          figmaLink: true,
          demoLink: true,
          date: true,
          skills: {
            select: {
              skill: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { date: 'desc' },
      },
      achievements: {
        select: {
          id: true,
          title: true,
          description: true,
          date: true,
          link: true,
        },
        orderBy: { date: 'desc' },
      },
      ratingsReceived: {
        select: {
          id: true,
          score: true,
          feedback: true,
          createdAt: true,
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
        orderBy: { createdAt: 'desc' },
      },
      privateData: {
        select: {
          collegeEmail: true,
          erp: true,
        },
      },
    },
  })

  if (!profile) {
    return null
  }

  const totalRatings = profile.ratingsReceived.length
  const avgRating = totalRatings > 0
    ? profile.ratingsReceived.reduce((acc: number, r: { score: number }) => acc + r.score, 0) / totalRatings
    : 0

  return {
    ...profile,
    stats: {
      totalRatings,
      avgRating: Number(avgRating.toFixed(1)),
    },
  }
}

export async function ensureDepartmentAndCollege(data: {
  collegeName?: string | null
  programName?: string | null
  branchName?: string | null
}): Promise<{ collegeId: string | null; departmentId: string | null }> {
  let collegeId: string | null = null
  let departmentId: string | null = null

  try {
    // 1. Resolve or create College if entered
    if (data.collegeName && data.collegeName.trim()) {
      const collegeTrimmed = data.collegeName.trim()
      const existingCollege = await prisma.college.findFirst({
        where: { name: { equals: collegeTrimmed, mode: 'insensitive' } },
      })
      if (existingCollege) {
        collegeId = existingCollege.id
      } else {
        const domain = collegeTrimmed.toLowerCase().replace(/[^a-z0-9]/g, '') + '.edu'
        const newCollege = await prisma.college.create({
          data: {
            name: collegeTrimmed,
            domain: domain.slice(0, 50) || 'college.edu',
          },
        })
        collegeId = newCollege.id
      }
    }

    // 2. Resolve or create Department
    const program = data.programName?.trim()
    const branch = data.branchName?.trim()
    if (program || branch) {
      const deptName = program && branch ? `${program} - ${branch}` : (branch || program || 'General')

      // Ensure a collegeId exists for department foreign key constraint
      if (!collegeId) {
        const defaultCollege = await prisma.college.findFirst()
        if (defaultCollege) {
          collegeId = defaultCollege.id
        } else {
          const newDef = await prisma.college.create({
            data: {
              name: 'General University',
              domain: 'general.edu',
            },
          })
          collegeId = newDef.id
        }
      }

      const existingDept = await prisma.department.findFirst({
        where: {
          collegeId: collegeId,
          name: { equals: deptName, mode: 'insensitive' },
        },
      })

      if (existingDept) {
        departmentId = existingDept.id
      } else {
        const createdDept = await prisma.department.create({
          data: {
            name: deptName,
            collegeId: collegeId,
          },
        })
        departmentId = createdDept.id
      }
    }
  } catch (err) {
    console.error('Error ensuring department/college:', err)
  }

  return { collegeId, departmentId }
}

export async function updateBasicProfile(data: {
  name: string
  bio?: string | null
  availability: Availability
  year?: number | null
  departmentId?: string | null
  collegeId?: string | null
  collegeName?: string | null
  programName?: string | null
  branchName?: string | null
  role?: string | null
  profilePhoto?: string | null
  erp?: string | null
  collegeEmail?: string | null
}) {
  const authUser = await getAuthenticatedUser()

  if (!data.name || data.name.trim().length === 0) {
    return { error: 'Full name is required' }
  }

  try {
    let finalCollegeId = data.collegeId || null
    let finalDeptId = data.departmentId || null

    if (data.programName || data.branchName || data.collegeName) {
      const ensured = await ensureDepartmentAndCollege({
        collegeName: data.collegeName,
        programName: data.programName,
        branchName: data.branchName,
      })
      if (ensured.collegeId) finalCollegeId = ensured.collegeId
      if (ensured.departmentId) finalDeptId = ensured.departmentId
    }

    const formattedBio = formatProfileBio(data.role, data.bio)

    const updated = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        name: data.name.trim(),
        bio: formattedBio || null,
        availability: data.availability,
        year: data.year ?? null,
        departmentId: finalDeptId,
        collegeId: finalCollegeId,
        profilePhoto: data.profilePhoto?.trim() || null,
      },
    })

    if (data.erp !== undefined || data.collegeEmail !== undefined) {
      const erpVal = data.erp?.trim()
      const emailVal = data.collegeEmail?.trim()
      try {
        await prisma.userPrivate.upsert({
          where: { userId: authUser.id },
          update: {
            ...(erpVal ? { erp: erpVal } : {}),
            ...(emailVal ? { collegeEmail: emailVal } : {}),
          },
          create: {
            userId: authUser.id,
            erp: erpVal || ('ERP_' + authUser.id.slice(0, 8).toUpperCase()),
            collegeEmail: emailVal || authUser.email || ('student_' + authUser.id.slice(0, 8) + '@college.edu'),
          },
        })
      } catch (privErr) {
        console.error('Error updating private data:', privErr)
      }
    }

    revalidatePath('/profile')
    revalidatePath(`/users/${authUser.id}`)
    revalidatePath('/verify/student')
    return { success: true, user: updated }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to update profile' }
  }
}

export async function getAllAvailableSkills() {
  try {
    const existing = await prisma.skill.findMany({
      where: { isCustom: false },
      orderBy: { name: 'asc' },
    })

    // If database skills are sparse, sync authoritative skills
    const existingNames = new Set(existing.map((s) => s.name.toLowerCase()))
    const missing = AUTHORITATIVE_SKILLS.filter(
      (auth) => !existingNames.has(auth.name.toLowerCase())
    )

    if (missing.length > 0) {
      await prisma.skill.createMany({
        data: missing.map((m) => ({
          name: m.name,
          isCustom: false,
        })),
        skipDuplicates: true,
      })

      return await prisma.skill.findMany({
        where: { isCustom: false },
        orderBy: { name: 'asc' },
      })
    }

    return existing
  } catch {
    return AUTHORITATIVE_SKILLS.map((s, idx) => ({
      id: `fallback-${idx}`,
      name: s.name,
      isCustom: false,
    }))
  }
}

export async function ensureSkillByName(name: string): Promise<{ id: string; name: string } | null> {
  const trimmed = name.trim()
  if (!trimmed) return null

  try {
    const existing = await prisma.skill.findFirst({
      where: { name: { equals: trimmed, mode: 'insensitive' } },
    })
    if (existing) return existing

    const created = await prisma.skill.create({
      data: {
        name: trimmed,
        isCustom: true,
      },
    })
    return created
  } catch {
    return null
  }
}

export async function getAllCollegesAndDepartments() {
  const colleges = await prisma.college.findMany({
    include: {
      departments: {
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  })
  return colleges
}

export async function addUserSkillsBatch(
  skills: Array<{ skillIdOrName: string; level?: SkillLevel }>
) {
  const authUser = await getAuthenticatedUser()

  if (!skills || skills.length === 0) {
    return { error: 'No skills provided' }
  }

  try {
    let addedCount = 0
    for (const item of skills) {
      const skillIdOrName = item.skillIdOrName
      const level = item.level || 'INTERMEDIATE'

      let resolvedSkillId = skillIdOrName
      if (skillIdOrName.startsWith('auth-') || skillIdOrName.startsWith('custom-')) {
        const rawName = skillIdOrName.replace(/^(auth|custom)-/, '')
        const ensured = await ensureSkillByName(rawName)
        if (ensured) resolvedSkillId = ensured.id
      } else {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(skillIdOrName)
        if (!isUuid) {
          const ensured = await ensureSkillByName(skillIdOrName)
          if (ensured) resolvedSkillId = ensured.id
        }
      }

      await prisma.userSkill.upsert({
        where: {
          userId_skillId: {
            userId: authUser.id,
            skillId: resolvedSkillId,
          },
        },
        update: { level },
        create: {
          userId: authUser.id,
          skillId: resolvedSkillId,
          level,
        },
      })
      addedCount++
    }

    revalidatePath('/profile')
    revalidatePath(`/users/${authUser.id}`)
    return { success: true, addedCount }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to add skills in batch' }
  }
}

export async function addUserSkill(skillIdOrName: string, level: SkillLevel) {
  const authUser = await getAuthenticatedUser()

  if (!skillIdOrName || !level) {
    return { error: 'Skill and level are required' }
  }

  try {
    let resolvedSkillId = skillIdOrName
    if (skillIdOrName.startsWith('auth-') || skillIdOrName.startsWith('custom-')) {
      const rawName = skillIdOrName.replace(/^(auth|custom)-/, '')
      const ensured = await ensureSkillByName(rawName)
      if (ensured) resolvedSkillId = ensured.id
    } else {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(skillIdOrName)
      if (!isUuid) {
        const ensured = await ensureSkillByName(skillIdOrName)
        if (ensured) resolvedSkillId = ensured.id
      }
    }

    await prisma.userSkill.upsert({
      where: {
        userId_skillId: {
          userId: authUser.id,
          skillId: resolvedSkillId,
        },
      },
      update: { level },
      create: {
        userId: authUser.id,
        skillId: resolvedSkillId,
        level,
      },
    })

    revalidatePath('/profile')
    revalidatePath(`/users/${authUser.id}`)
    return { success: true, skillId: resolvedSkillId }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to add skill' }
  }
}

export async function removeUserSkill(skillId: string) {
  const authUser = await getAuthenticatedUser()

  try {
    await prisma.userSkill.deleteMany({
      where: {
        userId: authUser.id,
        skillId,
      },
    })

    revalidatePath('/profile')
    revalidatePath(`/users/${authUser.id}`)
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to remove skill' }
  }
}

export async function addUserInterest(skillIdOrName: string) {
  const authUser = await getAuthenticatedUser()

  if (!skillIdOrName) {
    return { error: 'Interest is required' }
  }

  try {
    let resolvedSkillId = skillIdOrName
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(skillIdOrName)
    if (skillIdOrName.startsWith('auth-') || skillIdOrName.startsWith('custom-') || !isUuid) {
      const rawName = skillIdOrName.replace(/^(auth|custom)-/, '')
      const ensured = await ensureSkillByName(rawName)
      if (ensured) resolvedSkillId = ensured.id
    }

    await prisma.userInterest.upsert({
      where: {
        userId_skillId: {
          userId: authUser.id,
          skillId: resolvedSkillId,
        },
      },
      update: {},
      create: {
        userId: authUser.id,
        skillId: resolvedSkillId,
      },
    })

    revalidatePath('/profile')
    revalidatePath(`/users/${authUser.id}`)
    return { success: true, skillId: resolvedSkillId }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to add interest' }
  }
}

export async function removeUserInterest(skillId: string) {
  const authUser = await getAuthenticatedUser()

  try {
    await prisma.userInterest.deleteMany({
      where: {
        userId: authUser.id,
        skillId,
      },
    })

    revalidatePath('/profile')
    revalidatePath(`/users/${authUser.id}`)
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to remove interest' }
  }
}

export async function createProject(data: {
  title: string
  description: string
  role: string
  date: string
  githubLink?: string | null
  figmaLink?: string | null
  demoLink?: string | null
  isPrivate?: boolean
  skillIds?: string[]
}) {
  const authUser = await getAuthenticatedUser()

  if (!data.title?.trim() || !data.description?.trim() || !data.role?.trim()) {
    return { error: 'Title, description, and role are required' }
  }

  try {
    const project = await prisma.project.create({
      data: {
        userId: authUser.id,
        title: data.title.trim(),
        description: data.description.trim(),
        role: data.role.trim(),
        date: new Date(data.date || Date.now()),
        githubLink: data.githubLink?.trim() || null,
        figmaLink: data.figmaLink?.trim() || null,
        demoLink: data.demoLink?.trim() || null,
        isPrivate: data.isPrivate ?? false,
        skills: data.skillIds && data.skillIds.length > 0
          ? {
              create: data.skillIds.map((skillId) => ({
                skillId,
              })),
            }
          : undefined,
      },
    })

    revalidatePath('/profile')
    revalidatePath(`/users/${authUser.id}`)
    return { success: true, project }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to create project' }
  }
}

export async function deleteProject(projectId: string) {
  const authUser = await getAuthenticatedUser()

  try {
    // Ensure ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: authUser.id },
    })

    if (!project) {
      return { error: 'Project not found or unauthorized' }
    }

    await prisma.project.delete({
      where: { id: projectId },
    })

    revalidatePath('/profile')
    revalidatePath(`/users/${authUser.id}`)
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to delete project' }
  }
}

export async function createAchievement(data: {
  title: string
  description: string
  date: string
  link?: string | null
}) {
  const authUser = await getAuthenticatedUser()

  if (!data.title?.trim() || !data.description?.trim()) {
    return { error: 'Title and description are required' }
  }

  try {
    const achievement = await prisma.achievement.create({
      data: {
        userId: authUser.id,
        title: data.title.trim(),
        description: data.description.trim(),
        date: new Date(data.date || Date.now()),
        link: data.link?.trim() || null,
      },
    })

    revalidatePath('/profile')
    revalidatePath(`/users/${authUser.id}`)
    return { success: true, achievement }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to create achievement' }
  }
}

export async function deleteAchievement(achievementId: string) {
  const authUser = await getAuthenticatedUser()

  try {
    const achievement = await prisma.achievement.findFirst({
      where: { id: achievementId, userId: authUser.id },
    })

    if (!achievement) {
      return { error: 'Achievement not found or unauthorized' }
    }

    await prisma.achievement.delete({
      where: { id: achievementId },
    })

    revalidatePath('/profile')
    revalidatePath(`/users/${authUser.id}`)
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to delete achievement' }
  }
}
