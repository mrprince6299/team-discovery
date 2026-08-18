import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import { createApplication, acceptApplication } from '../src/app/actions/applications'
import { createInvitation, acceptInvitation } from '../src/app/actions/invitations'
import { createTeam, transferLeadership, leaveTeam } from '../src/app/actions/teams'
import { createTeamRole, expireOverdueRoles } from '../src/app/actions/roles'

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

async function runTests() {
  console.log('\n==================================================')
  console.log('STARTING TRANSACTION & CONCURRENCY TEST SUITE')
  console.log('==================================================\n')

  // 0. Setup test users and college
  const college = await prisma.college.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Concurrency Tech',
      domain: 'concurrency.edu'
    }
  })

  const skill = await prisma.skill.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Concurrency TypeScript',
      isCustom: false
    }
  })

  // Helper to create test user
  async function makeUser(prefix: string) {
    const randomId = crypto.randomUUID()
    const user = await prisma.user.create({
      data: {
        id: randomId,
        username: `${prefix}_${randomId.slice(0, 8)}`,
        name: `Test ${prefix}`,
        collegeId: college.id,
        verificationStatus: 'APPROVED',
        availability: 'AVAILABLE'
      }
    })
    await prisma.userPrivate.create({
      data: {
        userId: user.id,
        collegeEmail: `${prefix}_${randomId.slice(0, 8)}@concurrency.edu`,
        erp: `ERP_${randomId.slice(0, 8)}`
      }
    })
    return user
  }

  const leaderUser = await makeUser('leader')
  const applicant1 = await makeUser('app1')
  const applicant2 = await makeUser('app2')
  const invitee1 = await makeUser('inv1')
  const invitee2 = await makeUser('inv2')

  // Create Event
  const testEvent = await prisma.event.create({
    data: {
      name: 'Concurrency Hackathon',
      description: 'Testing race conditions',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      registrationDeadline: new Date(Date.now() + 86400000),
      rules: 'Standard',
      teamSizeInfo: '4 members',
      status: 'REGISTRATION_OPEN'
    }
  })

  console.log('--- TEST GROUP 1: Team & Leadership Integrity ---')
  // 1. Create Team
  const teamRes = await createTeam({
    name: 'Alpha Concurrency Team',
    description: 'Testing team integrity',
    eventId: testEvent.id,
    leaderUserId: leaderUser.id
  })
  assert(teamRes.success === true && !!teamRes.team, 'Team created with active leader atomically')
  const teamId = teamRes.team!.id

  // Check leader constraint
  const leaders = await prisma.teamMember.findMany({
    where: { teamId, status: 'ACTIVE', membershipRole: 'LEADER' }
  })
  assert(leaders.length === 1 && leaders[0].userId === leaderUser.id, 'Exactly one active leader present')

  // Create a 1-seat role
  const roleRes = await createTeamRole({
    teamId,
    name: 'Backend Concurrency Specialist',
    seatsRequired: 1,
    expiry: new Date(Date.now() + 86400000),
    requiredSkillIds: [skill.id],
    leaderUserId: leaderUser.id
  })
  assert(roleRes.success === true && !!roleRes.role, 'Team role created with 1 seat required')
  const roleId = roleRes.role!.id

  console.log('\n--- TEST GROUP 2: Applications & Real Concurrency Race ---')
  // Create applications for applicant1 and applicant2 for the 1-seat role
  const app1Res = await createApplication({
    teamId,
    roleId,
    userId: applicant1.id,
    message: 'I am applicant 1'
  })
  const app2Res = await createApplication({
    teamId,
    roleId,
    userId: applicant2.id,
    message: 'I am applicant 2'
  })
  assert(app1Res.success === true && app2Res.success === true, 'Both applications created as PENDING')

  const app1Id = app1Res.application!.id
  const app2Id = app2Res.application!.id

  // Concurrently attempt to accept both applications on a 1-seat role!
  console.log('  ⚡ Launching concurrent acceptApplication calls via Promise.all...')
  const [res1, res2] = await Promise.all([
    acceptApplication(app1Id, leaderUser.id),
    acceptApplication(app2Id, leaderUser.id)
  ])

  const r1 = res1 as any
  const r2 = res2 as any
  const oneSucceeded = (r1.success && !r2.success) || (!r1.success && r2.success)
  assert(oneSucceeded, 'Row-level locking prevented overbooking: exactly 1 concurrent acceptance succeeded')

  const failedRes = r1.success ? r2 : r1
  const errLower = (failedRes.error || '').toLowerCase()
  assert(
    errLower.includes('full') || errLower.includes('pending') || errLower.includes('closed') || errLower.includes('open'),
    `The rejected concurrent applicant received a safe conflict error: "${failedRes.error}"`
  )

  // Verify Role and Application statuses
  const updatedRole = await prisma.teamRole.findUnique({ where: { id: roleId } })
  assert(updatedRole?.status === 'FULL', 'Role transitioned to FULL status')

  const otherApp = await prisma.application.findUnique({
    where: { id: r1.success ? app2Id : app1Id }
  })
  assert(otherApp?.status === 'AUTO_CLOSED', 'Competing pending application was AUTO_CLOSED upon role becoming FULL')

  console.log('\n--- TEST GROUP 3: One-Team-Per-Event Constraint ---')
  // Accepted user is in Alpha team (for testEvent). Now try to add them to Beta team (same testEvent).
  const otherLeader = await makeUser('other_leader')
  const teamBetaRes = await createTeam({
    name: 'Beta Concurrency Team',
    description: 'Competing team',
    eventId: testEvent.id,
    leaderUserId: otherLeader.id
  })
  const betaTeamId = teamBetaRes.team!.id

  const betaRoleRes = await createTeamRole({
    teamId: betaTeamId,
    name: 'Beta Engineer',
    seatsRequired: 1,
    expiry: new Date(Date.now() + 86400000),
    requiredSkillIds: [skill.id],
    leaderUserId: otherLeader.id
  })
  const betaRoleId = betaRoleRes.role!.id

  const acceptedUserId = (res1 as any).success ? applicant1.id : applicant2.id
  const conflictApp = await createApplication({
    teamId: betaTeamId,
    roleId: betaRoleId,
    userId: acceptedUserId
  })
  assert(
    conflictApp.error?.includes('already an active member of another team'),
    'One-Team-Per-Event enforced at application creation'
  )

  // Also test invitation to same event rejected
  const conflictInvite = await createInvitation({
    teamId: betaTeamId,
    roleId: betaRoleId,
    recipientId: acceptedUserId,
    senderId: otherLeader.id
  })
  assert(
    conflictInvite.error?.includes('already an active member of another team'),
    'One-Team-Per-Event enforced at invitation creation'
  )

  console.log('\n--- TEST GROUP 4: Invitations & Multi-Role Team Status Recalculation ---')
  // Add a second role to Beta team with 1 seat
  const inviteeUser = await makeUser('invitee')
  const inviteRes = await createInvitation({
    teamId: betaTeamId,
    roleId: betaRoleId,
    recipientId: inviteeUser.id,
    senderId: otherLeader.id
  })
  assert((inviteRes as any).success === true, 'Invitation created successfully')

  const acceptInviteRes = await acceptInvitation((inviteRes as any).invitation!.id, inviteeUser.id)
  assert((acceptInviteRes as any).success === true, 'Invitation accepted atomically')

  const updatedBetaRole = await prisma.teamRole.findUnique({ where: { id: betaRoleId } })
  assert(updatedBetaRole?.status === 'FULL', 'Beta role is now FULL')

  const updatedBetaTeam = await prisma.team.findUnique({ where: { id: betaTeamId } })
  assert(updatedBetaTeam?.status === 'FULL', 'Team transitioned to FULL because all active recruitment roles are FULL')

  // Now create another open role in Beta team -> Team should revert to ACTIVE / open
  const betaRole2Res = await createTeamRole({
    teamId: betaTeamId,
    name: 'Beta Frontend Dev',
    seatsRequired: 2,
    expiry: new Date(Date.now() + 86400000),
    requiredSkillIds: [skill.id],
    leaderUserId: otherLeader.id
  })
  const betaTeamAfterNewRole = await prisma.team.findUnique({ where: { id: betaTeamId } })
  assert(betaTeamAfterNewRole?.status === 'ACTIVE', 'Team status transitioned back to ACTIVE when new open role was added')

  console.log('\n--- TEST GROUP 5: Leadership Transfer & Leaving Team ---')
  // While both otherLeader and inviteeUser are active in Beta team, leader attempts to leave without transferring
  const leaderLeaveWhileMembersRes = await leaveTeam({
    teamId: betaTeamId,
    userId: otherLeader.id
  })
  assert(
    (leaderLeaveWhileMembersRes as any).error?.includes('transferring leadership'),
    'Active leader blocked from leaving while other active members remain'
  )

  // Leader transfers leadership to inviteeUser in Beta team
  const transferRes = await transferLeadership({
    teamId: betaTeamId,
    currentLeaderId: otherLeader.id,
    newLeaderId: inviteeUser.id
  })
  assert((transferRes as any).success === true, 'Leadership transferred successfully')

  const betaLeaders = await prisma.teamMember.findMany({
    where: { teamId: betaTeamId, status: 'ACTIVE', membershipRole: 'LEADER' }
  })
  assert(betaLeaders.length === 1 && betaLeaders[0].userId === inviteeUser.id, 'Invitee is now the sole active leader')

  // Former leader can now leave
  const leaveRes = await leaveTeam({
    teamId: betaTeamId,
    userId: otherLeader.id
  })
  assert((leaveRes as any).success === true, 'Former leader left the team safely')

  // Sole remaining leader leaves -> closes team
  const soleLeaderLeaveRes = await leaveTeam({
    teamId: betaTeamId,
    userId: inviteeUser.id
  })
  assert(
    (soleLeaderLeaveRes as any).success === true && (soleLeaderLeaveRes as any).teamClosed === true,
    'Sole remaining leader leaving safely closes the team'
  )

  console.log('\n--- TEST GROUP 6: Role Expiry Automation ---')
  // Create an already-expired role
  const expiredRoleRes = await createTeamRole({
    teamId,
    name: 'Old Expired Role',
    seatsRequired: 1,
    expiry: new Date(Date.now() - 10000), // 10 seconds ago
    requiredSkillIds: [skill.id],
    leaderUserId: leaderUser.id
  })
  const expRoleId = expiredRoleRes.role!.id

  const expCandidate = await makeUser('exp_cand')
  // Try to create application on expired role
  const expApp = await createApplication({
    teamId,
    roleId: expRoleId,
    userId: expCandidate.id
  })
  assert(expApp.error?.includes('expired'), 'Application creation on expired role rejected')

  // Run the idempotent server-side expiry job
  const expiryJobRes = await expireOverdueRoles()
  assert(expiryJobRes.success === true && (expiryJobRes.expiredCount ?? 0) >= 1, 'Idempotent role expiry job executed')

  const expRoleAfterJob = await prisma.teamRole.findUnique({ where: { id: expRoleId } })
  assert(expRoleAfterJob?.status === 'EXPIRED', 'Expired role marked as EXPIRED in database')

  console.log('\n==================================================')
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('==================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runTests()
  .catch((err) => {
    console.error('Fatal test error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
