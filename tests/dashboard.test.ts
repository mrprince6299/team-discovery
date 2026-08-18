import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import { getDashboardData } from '../src/app/actions/dashboard'

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

async function runDashboardTests() {
  console.log('\n==================================================')
  console.log('STARTING COMMAND CENTER DASHBOARD INTEGRATION TESTS')
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

  // 2. Setup Test Users
  const userA = await prisma.user.create({
    data: {
      username: `dash_user_a_${timestamp}`,
      name: 'Alex Rivera',
      collegeId: college.id,
      departmentId: department.id,
      year: 3,
      verificationStatus: 'APPROVED',
      bio: 'Full-stack builder and hackathon enthusiast',
      availability: 'LOOKING_FOR_TEAM',
    },
  })

  const userB = await prisma.user.create({
    data: {
      username: `dash_user_b_${timestamp}`,
      name: 'Beatrix Vance',
      collegeId: college.id,
      departmentId: department.id,
      year: 4,
      verificationStatus: 'APPROVED',
      bio: 'UI/UX lead',
      availability: 'AVAILABLE',
    },
  })

  // 3. Setup Event
  const event = await prisma.event.create({
    data: {
      name: `AI Global Hackathon ${timestamp}`,
      description: 'Building collaborative AI agents',
      startDate: new Date(Date.now() + 86400000 * 3),
      endDate: new Date(Date.now() + 86400000 * 5),
      registrationDeadline: new Date(Date.now() + 86400000 * 2),
      rules: '1. Open source code\n2. Real-time demo required',
      teamSizeInfo: '2-4 Members',
      status: 'PUBLISHED',
    },
  })

  // 4. Setup Team & Roles
  const team = await prisma.team.create({
    data: {
      name: `Apex Innovators ${timestamp}`,
      description: 'Autonomous agents for team matching',
      eventId: event.id,
      status: 'ACTIVE',
    },
  })

  // User A is Leader of Team
  await prisma.teamMember.create({
    data: {
      teamId: team.id,
      eventId: event.id,
      userId: userA.id,
      membershipRole: 'LEADER',
      status: 'ACTIVE',
    },
  })

  const role = await prisma.teamRole.create({
    data: {
      teamId: team.id,
      name: 'Frontend Architect',
      seatsRequired: 1,
      expiry: new Date(Date.now() + 86400000 * 7),
      status: 'ACTIVE',
    },
  })

  // Another team where User B is leader, User A has a pending application
  const teamB = await prisma.team.create({
    data: {
      name: `Cyber Vanguard ${timestamp}`,
      description: 'Security and resilience platform',
      status: 'ACTIVE',
    },
  })

  await prisma.teamMember.create({
    data: {
      teamId: teamB.id,
      userId: userB.id,
      membershipRole: 'LEADER',
      status: 'ACTIVE',
    },
  })

  const roleB = await prisma.teamRole.create({
    data: {
      teamId: teamB.id,
      name: 'Security Engineer',
      seatsRequired: 1,
      expiry: new Date(Date.now() + 86400000 * 7),
      status: 'ACTIVE',
    },
  })

  // Pending application from User A to Team B
  const application = await prisma.application.create({
    data: {
      teamId: teamB.id,
      roleId: roleB.id,
      userId: userA.id,
      message: 'Excited to help with security audits!',
      status: 'PENDING',
    },
  })

  // Pending invitation from User B to User A
  const invitation = await prisma.invitation.create({
    data: {
      teamId: teamB.id,
      roleId: roleB.id,
      senderId: userB.id,
      recipientId: userA.id,
      message: 'Would love your frontend expertise!',
      expiry: new Date(Date.now() + 86400000 * 3),
      status: 'PENDING',
    },
  })

  // Peer review for User A from User B
  const rating = await prisma.rating.create({
    data: {
      teamId: team.id,
      raterId: userB.id,
      rateeId: userA.id,
      score: 5,
      feedback: 'Incredible technical velocity and leadership.',
    },
  })

  // Bookmark for User A
  const bookmark = await prisma.bookmark.create({
    data: {
      userId: userA.id,
      targetType: 'TEAM',
      targetId: teamB.id,
    },
  })

  // Unread notification for User A
  const notification = await prisma.notification.create({
    data: {
      userId: userA.id,
      type: 'ANNOUNCEMENT',
      title: 'Hackathon Registration Confirmed',
      content: 'Apex Innovators is confirmed for AI Global Hackathon.',
      referenceType: 'EVENT',
      referenceId: event.id,
      isRead: false,
    },
  })

  // Activity log in Team
  const activityLog = await prisma.activityLog.create({
    data: {
      teamId: team.id,
      userId: userA.id,
      actionType: 'MEMBER_JOINED',
      description: 'Alex Rivera formed the squad.',
    },
  })

  try {
    // ----------------------------------------------------
    // TEST GROUP 1: Authentication & Authorization
    // ----------------------------------------------------
    console.log('--- TEST GROUP 1: Authentication & Authorization ---')

    // Unauthenticated access
    const unauthRes = await getDashboardData()
    assert(!!unauthRes.error, 'Unauthenticated user is strictly rejected with error')

    // Authenticated access for User A
    const dashResA = await getDashboardData(userA.id)
    assert(!dashResA.error && !!dashResA.data, 'Authenticated dashboard data retrieved successfully for User A')
    assert(dashResA.data?.user.name === 'Alex Rivera', 'Dashboard returns correct user name')
    assert(dashResA.data?.user.username === `dash_user_a_${timestamp}`, 'Dashboard returns correct username')
    assert(dashResA.data?.user.verificationStatus === 'APPROVED', 'Dashboard returns correct verificationStatus')

    // ----------------------------------------------------
    // TEST GROUP 2: Metrics Aggregation
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 2: Metrics Aggregation ---')

    const metricsA = dashResA.data!.metrics
    assert(metricsA.activeSquadsCount === 1, 'Metrics: activeSquadsCount is exactly 1')
    assert(metricsA.pendingApplicationsCount === 1, 'Metrics: pendingApplicationsCount is exactly 1')
    assert(metricsA.pendingInvitationsCount === 1, 'Metrics: pendingInvitationsCount is exactly 1')
    assert(metricsA.savedItemsCount === 1, 'Metrics: savedItemsCount is exactly 1')
    assert(metricsA.peerReviewsCount === 1, 'Metrics: peerReviewsCount is exactly 1')
    assert(metricsA.avgRating === 5, 'Metrics: avgRating calculated as 5.0')
    assert(dashResA.data!.user.unreadNotificationsCount === 1, 'User unreadNotificationsCount is exactly 1')

    // ----------------------------------------------------
    // TEST GROUP 3: Active Squads Aggregation
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 3: Active Squads Aggregation ---')

    const squadsA = dashResA.data!.activeSquads
    assert(squadsA.length === 1, 'Active squads list contains 1 team')
    assert(squadsA[0].id === team.id, 'Squad ID matches target team')
    assert(squadsA[0].name === `Apex Innovators ${timestamp}`, 'Squad name matches')
    assert(squadsA[0].membershipRole === 'LEADER', 'Membership role is LEADER')
    assert(squadsA[0].memberCount === 1, 'Member count is 1')
    assert(squadsA[0].event?.id === event.id, 'Squad event association matches')

    // ----------------------------------------------------
    // TEST GROUP 4: Pending Items & Events
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 4: Pending Items & Events ---')

    const appsA = dashResA.data!.pendingApplications
    assert(appsA.length === 1, 'Pending applications contains 1 application')
    assert(appsA[0].teamName === `Cyber Vanguard ${timestamp}`, 'Application team matches')
    assert(appsA[0].roleName === 'Security Engineer', 'Application role matches')

    const invitesA = dashResA.data!.pendingInvitations
    assert(invitesA.length === 1, 'Pending invitations contains 1 invitation')
    assert(invitesA[0].teamName === `Cyber Vanguard ${timestamp}`, 'Invitation team matches')
    assert(invitesA[0].senderName === 'Beatrix Vance', 'Invitation sender matches')

    const eventsA = dashResA.data!.registeredEvents
    assert(eventsA.length === 1, 'Registered events contains 1 event')
    assert(eventsA[0].id === event.id, 'Event ID matches')
    assert(eventsA[0].name === `AI Global Hackathon ${timestamp}`, 'Event name matches')

    // ----------------------------------------------------
    // TEST GROUP 5: Recent Activity & Security
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 5: Recent Activity & Security ---')

    const activityA = dashResA.data!.recentActivity
    assert(activityA.length >= 1, 'Recent activity stream contains at least 1 entry')
    assert(activityA[0].actionType === 'MEMBER_JOINED', 'Activity actionType matches')

    // Security check: Verify no private fields leaked
    const userPayload: any = dashResA.data!.user
    assert(!userPayload.collegeEmail, 'Security: collegeEmail is strictly omitted')
    assert(!userPayload.erp, 'Security: ERP is strictly omitted')
    assert(!userPayload.verificationDocument, 'Security: verificationDocument is strictly omitted')

    // ----------------------------------------------------
    // TEST GROUP 6: User Isolation & Zero State
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 6: User Isolation & Zero State ---')

    // Create fresh third user with zero activity
    const userC = await prisma.user.create({
      data: {
        username: `dash_user_c_${timestamp}`,
        name: 'Charlie Zero',
        collegeId: college.id,
        departmentId: department.id,
        year: 1,
        verificationStatus: 'PENDING',
        bio: 'Just getting started',
        availability: 'AVAILABLE',
      },
    })

    const dashResC = await getDashboardData(userC.id)
    assert(!dashResC.error && !!dashResC.data, 'User C dashboard retrieved cleanly')

    const metricsC = dashResC.data!.metrics
    assert(metricsC.activeSquadsCount === 0, 'Zero State: activeSquadsCount is 0')
    assert(metricsC.pendingApplicationsCount === 0, 'Zero State: pendingApplicationsCount is 0')
    assert(metricsC.pendingInvitationsCount === 0, 'Zero State: pendingInvitationsCount is 0')
    assert(metricsC.savedItemsCount === 0, 'Zero State: savedItemsCount is 0')
    assert(metricsC.peerReviewsCount === 0, 'Zero State: peerReviewsCount is 0')
    assert(metricsC.avgRating === null, 'Zero State: avgRating is cleanly null')
    assert(dashResC.data!.activeSquads.length === 0, 'Zero State: activeSquads array is empty')
    assert(dashResC.data!.pendingApplications.length === 0, 'Zero State: pendingApplications array is empty')
    assert(dashResC.data!.pendingInvitations.length === 0, 'Zero State: pendingInvitations array is empty')
    assert(dashResC.data!.registeredEvents.length === 0, 'Zero State: registeredEvents array is empty')
    assert(dashResC.data!.recentActivity.length === 0, 'Zero State: recentActivity array is empty')

    // Clean user C
    await prisma.user.delete({ where: { id: userC.id } })

  } finally {
    // Teardown
    console.log('\n--- Cleaning up test records ---')
    await prisma.activityLog.deleteMany({ where: { teamId: { in: [team.id, teamB.id] } } })
    await prisma.notification.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } })
    await prisma.bookmark.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } })
    await prisma.rating.deleteMany({ where: { teamId: { in: [team.id, teamB.id] } } })
    await prisma.application.deleteMany({ where: { teamId: { in: [team.id, teamB.id] } } })
    await prisma.invitation.deleteMany({ where: { teamId: { in: [team.id, teamB.id] } } })
    await prisma.teamMember.deleteMany({ where: { teamId: { in: [team.id, teamB.id] } } })
    await prisma.teamRole.deleteMany({ where: { teamId: { in: [team.id, teamB.id] } } })
    await prisma.team.deleteMany({ where: { id: { in: [team.id, teamB.id] } } })
    await prisma.event.deleteMany({ where: { id: event.id } })
    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } })
  }

  console.log('\n==================================================')
  console.log(`DASHBOARD TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('==================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runDashboardTests().catch((err) => {
  console.error('Test runner threw error:', err)
  process.exit(1)
})
