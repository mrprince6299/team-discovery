import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  createInternalNotification,
} from '../src/app/actions/notifications'
import { createApplication, acceptApplication, withdrawApplication } from '../src/app/actions/applications'
import { createInvitation, acceptInvitation } from '../src/app/actions/invitations'
import { submitPeerRating } from '../src/app/actions/ratings'

let passed = 0
let failed = 0

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${msg}`)
    passed++
  } else {
    console.error(`  ❌ FAIL: ${msg}`)
    failed++
  }
}

async function runNotificationsTests() {
  console.log('\n==================================================')
  console.log('STARTING NOTIFICATIONS ENGINE INTEGRATION TESTS')
  console.log('==================================================\n')

  const timestamp = Date.now()

  // 1. Setup Base College & Department
  const college = await prisma.college.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Tech Discovery University',
      domain: 'discovery.edu',
    },
  })

  const department = await prisma.department.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      collegeId: college.id,
      name: 'Software Engineering',
    },
  })

  // 2. Create Test Users
  const leaderUser = await prisma.user.create({
    data: {
      username: `leader_notif_${timestamp}`,
      name: 'Leader User',
      collegeId: college.id,
      departmentId: department.id,
      year: 4,
      verificationStatus: 'APPROVED',
      bio: 'Squad lead for notifications testing',
      availability: 'LOOKING_FOR_TEAM',
    },
  })

  const candidateUser1 = await prisma.user.create({
    data: {
      username: `cand1_notif_${timestamp}`,
      name: 'Candidate One',
      collegeId: college.id,
      departmentId: department.id,
      year: 3,
      verificationStatus: 'APPROVED',
      bio: 'Full-stack builder',
      availability: 'AVAILABLE',
    },
  })

  const candidateUser2 = await prisma.user.create({
    data: {
      username: `cand2_notif_${timestamp}`,
      name: 'Candidate Two',
      collegeId: college.id,
      departmentId: department.id,
      year: 2,
      verificationStatus: 'APPROVED',
      bio: 'Frontend enthusiast',
      availability: 'AVAILABLE',
    },
  })

  // Add required skill for candidateUser1 to be eligible to apply
  const skill = await prisma.skill.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'TypeScript',
      isCustom: false,
    },
  })

  await prisma.userSkill.create({
    data: {
      userId: candidateUser1.id,
      skillId: skill.id,
      level: 'ADVANCED',
    },
  })

  // 3. Create Team and Recruitment Role
  const team = await prisma.team.create({
    data: {
      name: `Falcon Squad ${timestamp}`,
      description: 'Building next-gen notification engine',
      status: 'ACTIVE',
    },
  })

  await prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId: leaderUser.id,
      membershipRole: 'LEADER',
      status: 'ACTIVE',
    },
  })

  await prisma.conversation.create({
    data: {
      teamId: team.id,
    },
  })

  const role = await prisma.teamRole.create({
    data: {
      teamId: team.id,
      name: 'Full Stack Engineer',
      seatsRequired: 1,
      expiry: new Date(Date.now() + 86400000 * 7),
      status: 'ACTIVE',
    },
  })

  await prisma.roleSkill.create({
    data: {
      roleId: role.id,
      skillId: skill.id,
      requirementType: 'REQUIRED',
    },
  })

  try {
    // ----------------------------------------------------
    // TEST GROUP 1: Direct CRUD & Isolation
    // ----------------------------------------------------
    console.log('--- TEST GROUP 1: Direct CRUD & Isolation ---')

    const createRes = await createInternalNotification({
      userId: candidateUser1.id,
      type: 'ANNOUNCEMENT',
      title: 'Welcome to Team Discovery',
      content: 'Your profile is ready for teammate discovery.',
      referenceType: 'SYSTEM',
      referenceId: 'welcome',
    })
    assert(createRes.success === true && !!createRes.id, 'Internal notification created successfully')

    const myNotifs = await getMyNotifications('ALL', candidateUser1.id)
    assert(myNotifs.notifications?.length === 1, 'Authenticated user can retrieve own notifications')
    assert(myNotifs.notifications?.[0]?.title === 'Welcome to Team Discovery', 'Notification content matches')
    assert(myNotifs.unreadCount === 1, 'Unread count is accurate (1 unread)')

    // Isolation: Candidate 2 cannot see Candidate 1's notifications
    const cand2Notifs = await getMyNotifications('ALL', candidateUser2.id)
    assert(cand2Notifs.notifications?.length === 0, 'Data Isolation: Candidate 2 cannot view Candidate 1 notifications')

    const unreadCountCand1 = await getUnreadNotificationCount(candidateUser1.id)
    assert(unreadCountCand1.unreadCount === 1, 'getUnreadNotificationCount returns 1')

    // Mark as read
    const notifId = createRes.id!
    const markRes = await markNotificationRead(notifId, candidateUser1.id)
    assert(markRes.success === true, 'markNotificationRead succeeded')

    const myNotifsAfterRead = await getMyNotifications('ALL', candidateUser1.id)
    assert(myNotifsAfterRead.notifications?.[0]?.isRead === true, 'Notification is marked as read')
    assert(myNotifsAfterRead.unreadCount === 0, 'Unread count dropped to 0')

    // Idempotent mark as read
    const markAgain = await markNotificationRead(notifId, candidateUser1.id)
    assert(markAgain.success === true, 'markNotificationRead is idempotent')

    // Mark all read with multiple notifications
    await createInternalNotification({
      userId: candidateUser1.id,
      type: 'ALERT',
      title: 'Alert 1',
      content: 'Unread alert 1',
      referenceType: 'SYSTEM',
      referenceId: 'alert1',
    })
    await createInternalNotification({
      userId: candidateUser1.id,
      type: 'ALERT',
      title: 'Alert 2',
      content: 'Unread alert 2',
      referenceType: 'SYSTEM',
      referenceId: 'alert2',
    })

    const countBeforeMarkAll = await getUnreadNotificationCount(candidateUser1.id)
    assert(countBeforeMarkAll.unreadCount === 2, 'Unread count is 2 before markAllNotificationsRead')

    const markAllRes = await markAllNotificationsRead(candidateUser1.id)
    assert(markAllRes.success === true && markAllRes.updatedCount === 2, 'markAllNotificationsRead updated all unread items')

    const countAfterMarkAll = await getUnreadNotificationCount(candidateUser1.id)
    assert(countAfterMarkAll.unreadCount === 0, 'Unread count is 0 after markAllNotificationsRead')

    // Delete notification
    const deleteRes = await deleteNotification(notifId, candidateUser1.id)
    assert(deleteRes.success === true, 'deleteNotification succeeded for owner')

    // Unauthorized delete
    const unauthDelete = await deleteNotification(myNotifsAfterRead.notifications![0].id, candidateUser2.id)
    assert(!!unauthDelete.error, 'Unauthorized user blocked from deleting other users notification')

    // ----------------------------------------------------
    // TEST GROUP 2: Trigger on Application Lifecycle
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 2: Trigger on Application Lifecycle ---')

    // Clean leader notifications before test
    await prisma.notification.deleteMany({ where: { userId: leaderUser.id } })

    // Candidate 1 applies to team
    const applyRes = await createApplication({
      teamId: team.id,
      roleId: role.id,
      userId: candidateUser1.id,
      message: 'Excited to join the squad!',
    })
    assert(applyRes.success === true, 'Application created successfully')

    const leaderNotifs = await getMyNotifications('ALL', leaderUser.id)
    const appReceivedNotif = leaderNotifs.notifications?.find((n) => n.type === 'APPLICATION_RECEIVED')
    assert(!!appReceivedNotif, 'APPLICATION_RECEIVED notification triggered for team leader')
    assert(appReceivedNotif?.title === 'New Application Received', 'Notification title is accurate')

    // Leader accepts Candidate 1 into the role (which fills the role and team)
    const acceptRes = await acceptApplication(applyRes.application!.id, leaderUser.id)
    assert(!('error' in acceptRes), 'Leader accepted application')

    const cand1Notifs = await getMyNotifications('ALL', candidateUser1.id)
    const appAcceptedNotif = cand1Notifs.notifications?.find((n) => n.type === 'APPLICATION_ACCEPTED')
    assert(!!appAcceptedNotif, 'APPLICATION_ACCEPTED notification triggered for applicant')

    // Check ROLE_FILLED notification for leader
    const updatedLeaderNotifs = await getMyNotifications('ALL', leaderUser.id)
    const roleFilledNotif = updatedLeaderNotifs.notifications?.find((n) => n.type === 'ROLE_FILLED')
    assert(!!roleFilledNotif, 'ROLE_FILLED notification triggered for leader when role seats filled')

    // ----------------------------------------------------
    // TEST GROUP 3: Trigger on Invitation Lifecycle
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 3: Trigger on Invitation Lifecycle ---')

    // Create another role for invitation and ensure team is ACTIVE
    await prisma.team.update({
      where: { id: team.id },
      data: { status: 'ACTIVE' },
    })

    const role2 = await prisma.teamRole.create({
      data: {
        teamId: team.id,
        name: 'UI/UX Designer',
        seatsRequired: 1,
        expiry: new Date(Date.now() + 86400000 * 7),
        status: 'ACTIVE',
      },
    })
    await prisma.roleSkill.create({
      data: {
        roleId: role2.id,
        skillId: skill.id,
        requirementType: 'REQUIRED',
      },
    })

    const inviteRes = await createInvitation({
      teamId: team.id,
      roleId: role2.id,
      recipientId: candidateUser2.id,
      senderId: leaderUser.id,
      message: 'Join us as UI/UX Designer!',
    })
    assert(inviteRes.success === true, 'Invitation created successfully')

    const cand2NotifsAfterInvite = await getMyNotifications('ALL', candidateUser2.id)
    const inviteReceivedNotif = cand2NotifsAfterInvite.notifications?.find((n) => n.type === 'INVITATION_RECEIVED')
    assert(!!inviteReceivedNotif, 'INVITATION_RECEIVED notification triggered for invitee')

    // Candidate 2 accepts invitation
    const acceptInviteRes = await acceptInvitation(inviteRes.invitation!.id, candidateUser2.id)
    assert(!('error' in acceptInviteRes), 'Candidate 2 accepted invitation')

    const leaderNotifsAfterAccept = await getMyNotifications('ALL', leaderUser.id)
    const inviteAcceptedNotif = leaderNotifsAfterAccept.notifications?.find((n) => n.type === 'INVITATION_ACCEPTED')
    assert(!!inviteAcceptedNotif, 'INVITATION_ACCEPTED notification triggered for sender on accept')

    // ----------------------------------------------------
    // TEST GROUP 4: Trigger on Peer Rating Lifecycle
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 4: Trigger on Peer Rating Lifecycle ---')

    const ratingRes = await submitPeerRating(
      {
        teamId: team.id,
        rateeId: candidateUser1.id,
        score: 5,
        feedback: 'Outstanding collaboration and code quality!',
      },
      leaderUser.id
    )
    assert(!ratingRes.error, 'Leader submitted 5-star rating for Candidate 1')

    const cand1NotifsAfterRating = await getMyNotifications('ALL', candidateUser1.id)
    const ratingNotif = cand1NotifsAfterRating.notifications?.find((n) => n.type === 'RATING_RECEIVED')
    assert(!!ratingNotif, 'RATING_RECEIVED notification triggered for ratee')
    assert(ratingNotif?.title === 'New Peer Review Received', 'Rating notification title is accurate')

  } finally {
    // Teardown
    console.log('\n--- Cleaning up test records ---')
    await prisma.notification.deleteMany({
      where: {
        userId: { in: [leaderUser.id, candidateUser1.id, candidateUser2.id] },
      },
    })
    await prisma.rating.deleteMany({ where: { teamId: team.id } })
    await prisma.activityLog.deleteMany({ where: { teamId: team.id } })
    await prisma.teamMember.deleteMany({ where: { teamId: team.id } })
    await prisma.application.deleteMany({ where: { teamId: team.id } })
    await prisma.invitation.deleteMany({ where: { teamId: team.id } })
    await prisma.roleSkill.deleteMany({ where: { role: { teamId: team.id } } })
    await prisma.teamRole.deleteMany({ where: { teamId: team.id } })
    await prisma.conversation.deleteMany({ where: { teamId: team.id } })
    await prisma.team.deleteMany({ where: { id: team.id } })
    await prisma.userSkill.deleteMany({ where: { userId: candidateUser1.id } })
    await prisma.user.deleteMany({
      where: { id: { in: [leaderUser.id, candidateUser1.id, candidateUser2.id] } },
    })
  }

  console.log('\n==================================================')
  console.log(`NOTIFICATIONS TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('==================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runNotificationsTests().catch((err) => {
  console.error('Test runner threw error:', err)
  process.exit(1)
})
