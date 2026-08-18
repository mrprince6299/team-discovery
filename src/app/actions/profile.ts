'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Availability, SkillLevel } from '@prisma/client'

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

export async function updateBasicProfile(data: {
  name: string
  bio?: string | null
  availability: Availability
  year?: number | null
  departmentId?: string | null
  collegeId?: string | null
  profilePhoto?: string | null
}) {
  const authUser = await getAuthenticatedUser()

  if (!data.name || data.name.trim().length === 0) {
    return { error: 'Full name is required' }
  }

  try {
    const updated = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        name: data.name.trim(),
        bio: data.bio?.trim() || null,
        availability: data.availability,
        year: data.year ?? null,
        departmentId: data.departmentId || null,
        collegeId: data.collegeId || null,
        profilePhoto: data.profilePhoto?.trim() || null,
      },
    })

    revalidatePath('/profile')
    revalidatePath(`/users/${authUser.id}`)
    return { success: true, user: updated }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to update profile' }
  }
}

export async function getAllAvailableSkills() {
  return await prisma.skill.findMany({
    orderBy: { name: 'asc' },
  })
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

export async function addUserSkill(skillId: string, level: SkillLevel) {
  const authUser = await getAuthenticatedUser()

  if (!skillId || !level) {
    return { error: 'Skill and level are required' }
  }

  try {
    await prisma.userSkill.upsert({
      where: {
        userId_skillId: {
          userId: authUser.id,
          skillId,
        },
      },
      update: { level },
      create: {
        userId: authUser.id,
        skillId,
        level,
      },
    })

    revalidatePath('/profile')
    revalidatePath(`/users/${authUser.id}`)
    return { success: true }
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

export async function addUserInterest(skillId: string) {
  const authUser = await getAuthenticatedUser()

  if (!skillId) {
    return { error: 'Skill is required' }
  }

  try {
    await prisma.userInterest.upsert({
      where: {
        userId_skillId: {
          userId: authUser.id,
          skillId,
        },
      },
      update: {},
      create: {
        userId: authUser.id,
        skillId,
      },
    })

    revalidatePath('/profile')
    revalidatePath(`/users/${authUser.id}`)
    return { success: true }
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
