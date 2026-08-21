'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { MembershipRole } from '@prisma/client'

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

export interface WorkspaceMember {
  id: string
  userId: string
  name: string
  username: string
  avatarUrl: string | null
  department: string | null
  academicYear: number | null
  membershipRole: MembershipRole
  assignedRoleName: string | null
  joinedAt: Date
}

export interface WorkspaceMessage {
  id: string
  content: string
  createdAt: Date
  sender: {
    id: string
    name: string
    username: string
    avatarUrl: string | null
    membershipRole: MembershipRole | null
  }
}

export interface WorkspaceLink {
  id: string
  title: string
  url: string
  createdAt: Date
  creator: {
    id: string
    name: string
    username: string
  }
}

export interface WorkspaceFile {
  id: string
  fileName: string
  fileUrl: string
  createdAt: Date
  uploader: {
    id: string
    name: string
    username: string
  }
}

export interface WorkspaceActivity {
  id: string
  actionType: string
  description: string
  createdAt: Date
  user?: {
    id: string
    name: string
    username: string
  } | null
}

export interface TeamWorkspaceData {
  team: {
    id: string
    name: string
    description: string
    status: string
    event?: {
      id: string
      name: string
      startDate?: Date | null
      endDate?: Date | null
    } | null
  }
  currentMember: {
    id: string
    membershipRole: MembershipRole
    assignedRoleName: string | null
    joinedAt: Date
  }
  members: WorkspaceMember[]
  conversationId: string
  messages: WorkspaceMessage[]
  links: WorkspaceLink[]
  files: WorkspaceFile[]
  activities: WorkspaceActivity[]
}

/**
 * Fetches the entire workspace data for an active team member.
 * Strictly verifies server-side that the requester is an ACTIVE member of the team.
 */
export async function getTeamWorkspace(
  teamId: string,
  providedUserId?: string
): Promise<{ error?: string; workspace?: TeamWorkspaceData }> {
  const userId = await getAuthUserId(providedUserId)
  if (!userId) {
    return { error: 'Unauthorized. Please log in.' }
  }

  try {
    // 1. Verify active membership
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
        status: 'ACTIVE',
      },
      include: {
        role: {
          select: { name: true },
        },
      },
    })

    if (!membership) {
      return {
        error:
          'Access denied. You must be an active team member to access this collaboration workspace.',
      }
    }

    // 2. Fetch Team Details
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    })

    if (!team) {
      return { error: 'Team not found.' }
    }

    // 3. Fetch Active Members (with public profile fields only)
    const activeMembers = await prisma.teamMember.findMany({
      where: {
        teamId,
        status: 'ACTIVE',
      },
      include: {
        role: {
          select: { name: true },
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePhoto: true,
            year: true,
            department: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: [
        { membershipRole: 'asc' }, // LEADER, CO_LEADER, MEMBER
        { joinedAt: 'asc' },
      ],
    })

    const formattedMembers: WorkspaceMember[] = activeMembers.map((m) => ({
      id: m.id,
      userId: m.user.id,
      name: m.user.name,
      username: m.user.username,
      avatarUrl: m.user.profilePhoto,
      department: m.user.department?.name || null,
      academicYear: m.user.year,
      membershipRole: m.membershipRole,
      assignedRoleName: m.role?.name || null,
      joinedAt: m.joinedAt,
    }))

    // Build role map for message sender badges
    const memberRoleMap = new Map<string, MembershipRole>()
    activeMembers.forEach((m) => {
      memberRoleMap.set(m.user.id, m.membershipRole)
    })

    // 4. Ensure conversation exists and load messages
    let conversation = await prisma.conversation.findUnique({
      where: { teamId },
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { teamId },
      })
    }

    const rawMessages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    })

    const formattedMessages: WorkspaceMessage[] = rawMessages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      createdAt: msg.createdAt,
      sender: {
        id: msg.sender.id,
        name: msg.sender.name,
        username: msg.sender.username,
        avatarUrl: msg.sender.profilePhoto,
        membershipRole: memberRoleMap.get(msg.sender.id) || null,
      },
    }))

    // 5. Fetch Team Links
    const rawLinks = await prisma.teamLink.findMany({
      where: { teamId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedLinks: WorkspaceLink[] = rawLinks.map((l) => ({
      id: l.id,
      title: l.title,
      url: l.url,
      createdAt: l.createdAt,
      creator: {
        id: l.creator.id,
        name: l.creator.name,
        username: l.creator.username,
      },
    }))

    // 6. Fetch Team Files
    const rawFiles = await prisma.teamFile.findMany({
      where: { teamId },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedFiles: WorkspaceFile[] = rawFiles.map((f) => ({
      id: f.id,
      fileName: f.fileName,
      fileUrl: f.fileUrl,
      createdAt: f.createdAt,
      uploader: {
        id: f.uploader.id,
        name: f.uploader.name,
        username: f.uploader.username,
      },
    }))

    // 7. Fetch Team Activity Logs
    const rawActivities = await prisma.activityLog.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const formattedActivities: WorkspaceActivity[] = rawActivities.map((a) => ({
      id: a.id,
      actionType: a.actionType,
      description: a.description,
      createdAt: a.createdAt,
      user: a.user
        ? {
            id: a.user.id,
            name: a.user.name,
            username: a.user.username,
          }
        : null,
    }))

    return {
      workspace: {
        team: {
          id: team.id,
          name: team.name,
          description: team.description,
          status: team.status,
          event: team.event || null,
        },
        currentMember: {
          id: membership.id,
          membershipRole: membership.membershipRole,
          assignedRoleName: membership.role?.name || null,
          joinedAt: membership.joinedAt,
        },
        members: formattedMembers,
        conversationId: conversation.id,
        messages: formattedMessages,
        links: formattedLinks,
        files: formattedFiles,
        activities: formattedActivities,
      },
    }
  } catch (err: any) {
    console.error('Error in getTeamWorkspace:', err)
    return { error: err.message || 'Failed to load team workspace.' }
  }
}

/**
 * Sends a message to the team conversation.
 * Authorizes active team membership before inserting.
 */
export async function sendTeamMessage(
  input: {
    teamId: string
    content: string
  },
  providedUserId?: string
): Promise<{ error?: string; message?: WorkspaceMessage }> {
  const userId = await getAuthUserId(providedUserId)
  if (!userId) {
    return { error: 'Unauthorized.' }
  }

  const content = input.content?.trim()
  if (!content || content.length === 0) {
    return { error: 'Message content cannot be empty.' }
  }
  if (content.length > 2000) {
    return { error: 'Message is too long (maximum 2000 characters).' }
  }

  try {
    // 1. Verify membership
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: input.teamId,
        userId,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePhoto: true,
            isSuspended: true,
          },
        },
      },
    })

    if (!membership) {
      return { error: 'You are not an active member of this team.' }
    }

    if (membership.user.isSuspended) {
      return { error: 'Your account is currently suspended. Sending messages is disabled.' }
    }

    // 2. Find or create conversation
    let conversation = await prisma.conversation.findUnique({
      where: { teamId: input.teamId },
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { teamId: input.teamId },
      })
    }

    // 3. Create message
    const msg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        content,
      },
    })

    return {
      message: {
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt,
        sender: {
          id: membership.user.id,
          name: membership.user.name,
          username: membership.user.username,
          avatarUrl: membership.user.profilePhoto,
          membershipRole: membership.membershipRole,
        },
      },
    }
  } catch (err: any) {
    console.error('Error sending team message:', err)
    return { error: err.message || 'Failed to send message.' }
  }
}

/**
 * Adds a shared team resource link.
 * Validates URL and active membership server-side.
 */
export async function addTeamLink(
  input: {
    teamId: string
    title: string
    url: string
  },
  providedUserId?: string
): Promise<{ error?: string; link?: WorkspaceLink }> {
  const userId = await getAuthUserId(providedUserId)
  if (!userId) {
    return { error: 'Unauthorized.' }
  }

  const title = input.title?.trim()
  const rawUrl = input.url?.trim()

  if (!title || title.length === 0 || title.length > 100) {
    return { error: 'Title is required (up to 100 characters).' }
  }

  // Validate URL format
  let formattedUrl = rawUrl
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = `https://${formattedUrl}`
  }

  try {
    const parsed = new URL(formattedUrl)
    if (!parsed.hostname || (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost')) {
      return { error: 'Please enter a valid web URL (e.g. https://github.com/org/repo).' }
    }
  } catch {
    return { error: 'Please enter a valid web URL.' }
  }

  try {
    // 1. Verify active membership
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: input.teamId,
        userId,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            isSuspended: true,
          },
        },
      },
    })

    if (!membership) {
      return { error: 'You are not an active member of this team.' }
    }

    if (membership.user.isSuspended) {
      return { error: 'Your account is currently suspended. Adding links is disabled.' }
    }

    // 2. Create link & log activity
    const [newLink] = await prisma.$transaction([
      prisma.teamLink.create({
        data: {
          teamId: input.teamId,
          creatorId: userId,
          title,
          url: formattedUrl,
        },
      }),
      prisma.activityLog.create({
        data: {
          teamId: input.teamId,
          userId,
          actionType: 'LINK_ADDED',
          description: `${membership.user.name} shared a link: "${title}"`,
        },
      }),
    ])

    return {
      link: {
        id: newLink.id,
        title: newLink.title,
        url: newLink.url,
        createdAt: newLink.createdAt,
        creator: {
          id: membership.user.id,
          name: membership.user.name,
          username: membership.user.username,
        },
      },
    }
  } catch (err: any) {
    console.error('Error adding team link:', err)
    return { error: err.message || 'Failed to add link.' }
  }
}

/**
 * Deletes a shared team link.
 * Permitted only for link creator or team LEADER / CO_LEADER.
 */
export async function deleteTeamLink(
  input: {
    teamId: string
    linkId: string
  },
  providedUserId?: string
): Promise<{ error?: string; success?: boolean }> {
  const userId = await getAuthUserId(providedUserId)
  if (!userId) {
    return { error: 'Unauthorized.' }
  }

  try {
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: input.teamId,
        userId,
        status: 'ACTIVE',
      },
    })

    if (!membership) {
      return { error: 'You are not an active member of this team.' }
    }

    const link = await prisma.teamLink.findUnique({
      where: { id: input.linkId },
    })

    if (!link || link.teamId !== input.teamId) {
      return { error: 'Link not found.' }
    }

    const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isSuspended: true } })
    if (caller?.isSuspended) {
      return { error: 'Your account is currently suspended. Deleting links is disabled.' }
    }
    const isCreator = link.creatorId === userId
    const isLeadership =
      membership.membershipRole === 'LEADER' || membership.membershipRole === 'CO_LEADER'

    if (!isCreator && !isLeadership) {
      return { error: 'You do not have permission to delete this link.' }
    }

    await prisma.teamLink.delete({
      where: { id: input.linkId },
    })

    return { success: true }
  } catch (err: any) {
    console.error('Error deleting team link:', err)
    return { error: err.message || 'Failed to delete link.' }
  }
}

/**
 * Adds a shared team file reference.
 * Validates active membership and URL format.
 */
export async function addTeamFile(
  input: {
    teamId: string
    fileName: string
    fileUrl: string
  },
  providedUserId?: string
): Promise<{ error?: string; file?: WorkspaceFile }> {
  const userId = await getAuthUserId(providedUserId)
  if (!userId) {
    return { error: 'Unauthorized.' }
  }

  const fileName = input.fileName?.trim()
  const rawUrl = input.fileUrl?.trim()

  if (!fileName || fileName.length === 0 || fileName.length > 150) {
    return { error: 'File name is required (up to 150 characters).' }
  }

  let formattedUrl = rawUrl
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = `https://${formattedUrl}`
  }

  try {
    const parsed = new URL(formattedUrl)
    if (!parsed.hostname || (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost')) {
      return { error: 'Please enter a valid file URL (e.g. https://drive.google.com/file).' }
    }
  } catch {
    return { error: 'Please enter a valid file URL.' }
  }

  try {
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: input.teamId,
        userId,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            isSuspended: true,
          },
        },
      },
    })

    if (!membership) {
      return { error: 'You are not an active member of this team.' }
    }

    if (membership.user.isSuspended) {
      return { error: 'Your account is currently suspended. Uploading files is disabled.' }
    }

    const [newFile] = await prisma.$transaction([
      prisma.teamFile.create({
        data: {
          teamId: input.teamId,
          uploaderId: userId,
          fileName,
          fileUrl: formattedUrl,
        },
      }),
      prisma.activityLog.create({
        data: {
          teamId: input.teamId,
          userId,
          actionType: 'FILE_ADDED',
          description: `${membership.user.name} shared a file: "${fileName}"`,
        },
      }),
    ])

    return {
      file: {
        id: newFile.id,
        fileName: newFile.fileName,
        fileUrl: newFile.fileUrl,
        createdAt: newFile.createdAt,
        uploader: {
          id: membership.user.id,
          name: membership.user.name,
          username: membership.user.username,
        },
      },
    }
  } catch (err: any) {
    console.error('Error adding team file:', err)
    return { error: err.message || 'Failed to add file.' }
  }
}

/**
 * Deletes a shared team file reference.
 * Permitted only for file uploader or team LEADER / CO_LEADER.
 */
export async function deleteTeamFile(
  input: {
    teamId: string
    fileId: string
  },
  providedUserId?: string
): Promise<{ error?: string; success?: boolean }> {
  const userId = await getAuthUserId(providedUserId)
  if (!userId) {
    return { error: 'Unauthorized.' }
  }

  try {
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: input.teamId,
        userId,
        status: 'ACTIVE',
      },
    })

    if (!membership) {
      return { error: 'You are not an active member of this team.' }
    }

    const file = await prisma.teamFile.findUnique({
      where: { id: input.fileId },
    })

    if (!file || file.teamId !== input.teamId) {
      return { error: 'File not found.' }
    }

    const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isSuspended: true } })
    if (caller?.isSuspended) {
      return { error: 'Your account is currently suspended. Deleting files is disabled.' }
    }
    const isUploader = file.uploaderId === userId
    const isLeadership =
      membership.membershipRole === 'LEADER' || membership.membershipRole === 'CO_LEADER'

    if (!isUploader && !isLeadership) {
      return { error: 'You do not have permission to delete this file.' }
    }

    await prisma.teamFile.delete({
      where: { id: input.fileId },
    })

    return { success: true }
  } catch (err: any) {
    console.error('Error deleting team file:', err)
    return { error: err.message || 'Failed to delete file.' }
  }
}
