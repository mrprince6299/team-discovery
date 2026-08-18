import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import {
  createTeamRole,
  updateTeamRole,
  closeTeamRole,
  deleteTeamRole,
  expireOverdueRoles,
} from '../src/app/actions/roles'
import { createApplication, acceptApplication } from '../src/app/actions/applications'
import { createInvitation, acceptInvitation } from '../src/app/actions/invitations'

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

async function runRoleLifecycleTests() {
  console.log('\n==================================================')
  console.log('STARTING ROLE LIFECYCLE & LEADER CONTROLS TESTS')
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

  // 2. Setup Base Skills
  const skillReact = await prisma.skill.upsert({
    where: { name: `React_${timestamp}` },
    update: {},
    create: { name: `React_${timestamp}` },
  })

  const skillNode = await prisma.skill.upsert({
    where: { name: `Node_${timestamp}` },
    update: {},
    create: { name: `Node_${timestamp}` },
  })

  // 3. Setup Test Users
  const leaderUser = await prisma.user.create({
    data: {
      username: `rl_leader_${timestamp}`,
      name: 'Leader Alice',
      collegeId: college.id,
      departmentId: department.id,
      year: 4,
      verificationStatus: 'APPROVED',
    },
  })

  const applicantUser1 = await prisma.user.create({
    data: {
      username: `rl_app1_${timestamp}`,
      name: 'Applicant Bob',
      collegeId: college.id,
      departmentId: department.id,
      year: 2,
      verificationStatus: 'APPROVED',
    },
  })

  const applicantUser2 = await prisma.user.create({
    data: {
      username: `rl_app2_${timestamp}`,
      name: 'Applicant Charlie',
      collegeId: college.id,
      departmentId: department.id,
      year: 3,
      verificationStatus: 'APPROVED',
    },
  })

  const outsiderUser = await prisma.user.create({
    data: {
      username: `rl_outsider_${timestamp}`,
      name: 'Outsider Dave',
      collegeId: college.id,
      departmentId: department.id,
      year: 1,
      verificationStatus: 'APPROVED',
    },
  })

  // 4. Setup Team & Leader Membership
  const team = await prisma.team.create({
    data: {
      name: `Lifecycle Team ${timestamp}`,
      description: 'Testing recruitment role lifecycle controls',
      status: 'ACTIVE',
      members: {
        create: {
          userId: leaderUser.id,
          membershipRole: 'LEADER',
          status: 'ACTIVE',
        },
      },
    },
  })

  try {
    // ----------------------------------------------------
    // TEST GROUP 1: Role Creation & Validation
    // ----------------------------------------------------
    console.log('--- TEST GROUP 1: Role Creation & Validation ---')

    // Reject role creation without required skills
    const emptySkillRole = await createTeamRole({
      teamId: team.id,
      name: 'Invalid Role',
      seatsRequired: 1,
      expiry: new Date(Date.now() + 86400000),
      requiredSkillIds: [],
      leaderUserId: leaderUser.id,
    })
    assert(!!emptySkillRole.error, 'Role creation without required skills is strictly rejected')

    // Reject role creation with 0 seats
    const zeroSeatRole = await createTeamRole({
      teamId: team.id,
      name: 'Zero Seat Role',
      seatsRequired: 0,
      expiry: new Date(Date.now() + 86400000),
      requiredSkillIds: [skillReact.id],
      leaderUserId: leaderUser.id,
    })
    assert(!!zeroSeatRole.error, 'Role creation with 0 seats required is strictly rejected')

    // Create valid Role A (2 seats required)
    const validRoleA = await createTeamRole({
      teamId: team.id,
      name: 'Frontend Engineer',
      seatsRequired: 2,
      expiry: new Date(Date.now() + 7 * 86400000),
      requiredSkillIds: [skillReact.id],
      preferredSkillIds: [skillNode.id],
      leaderUserId: leaderUser.id,
    })
    assert(!validRoleA.error && !!validRoleA.role, 'Role A created successfully by authorized leader')
    const roleAId = validRoleA.role!.id

    // ----------------------------------------------------
    // TEST GROUP 2: Role Editing & Occupancy Bounds
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 2: Role Editing & Occupancy Bounds ---')

    // Unauthorized user cannot edit role
    const unauthEdit = await updateTeamRole({
      roleId: roleAId,
      name: 'Hacked Role Title',
      leaderUserId: outsiderUser.id,
    })
    assert(!!unauthEdit.error, 'Unauthorized user strictly blocked from updating team role')

    // Leader updates role title and requirements
    const leaderEdit = await updateTeamRole({
      roleId: roleAId,
      name: 'Senior Frontend Engineer',
      seatsRequired: 2,
      requiredSkillIds: [skillReact.id],
      preferredSkillIds: [skillNode.id],
      leaderUserId: leaderUser.id,
    })
    assert(!leaderEdit.error, 'Authorized leader successfully updated role title & preferences')
    assert(leaderEdit.role?.name === 'Senior Frontend Engineer', 'Role name updated accurately in database')

    // Applicant 1 applies and gets accepted (1 seat occupied)
    const app1 = await createApplication({
      teamId: team.id,
      roleId: roleAId,
      userId: applicantUser1.id,
    })
    assert(!app1.error, 'Applicant 1 submitted application for Role A')
    const accept1 = await acceptApplication(app1.application!.id, leaderUser.id)
    assert(!('error' in accept1), 'Leader accepted Applicant 1 into Role A')

    // Verify role status is now PARTIALLY_FILLED (1/2 seats)
    const roleAPartial = await prisma.teamRole.findUnique({ where: { id: roleAId } })
    assert(roleAPartial?.status === 'PARTIALLY_FILLED', 'Role A transitioned to PARTIALLY_FILLED (1/2 seats occupied)')

    // Attempt to reduce seatsRequired to 0 (below occupied count of 1) -> must fail
    const reduceBelowOccupied = await updateTeamRole({
      roleId: roleAId,
      seatsRequired: 0,
      leaderUserId: leaderUser.id,
    })
    assert(!!reduceBelowOccupied.error, 'Cannot reduce seatsRequired below currently occupied seats (1)')

    // ----------------------------------------------------
    // TEST GROUP 3: Role & Team FULL Transitions
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 3: Role & Team FULL Transitions ---')

    // Reduce seatsRequired to 1 (which matches current occupied count of 1) -> role becomes FULL
    const reduceToFull = await updateTeamRole({
      roleId: roleAId,
      seatsRequired: 1,
      leaderUserId: leaderUser.id,
    })
    assert(!reduceToFull.error, 'Updated seatsRequired to 1')
    assert(reduceToFull.role?.status === 'FULL', 'Role A transitioned to FULL because occupied seats (1) == seatsRequired (1)')

    // Team status transitions to FULL because its only active role is FULL
    const teamState1 = await prisma.team.findUnique({ where: { id: team.id } })
    assert(teamState1?.status === 'FULL', 'Team transitioned to FULL because all recruitment roles are FULL')

    // Adding a new open Role B (1 seat required) reverts team to ACTIVE
    const validRoleB = await createTeamRole({
      teamId: team.id,
      name: 'Backend Engineer',
      seatsRequired: 1,
      expiry: new Date(Date.now() + 7 * 86400000),
      requiredSkillIds: [skillNode.id],
      leaderUserId: leaderUser.id,
    })
    assert(!validRoleB.error && !!validRoleB.role, 'Created open Role B')
    const roleBId = validRoleB.role!.id

    const teamState2 = await prisma.team.findUnique({ where: { id: team.id } })
    assert(teamState2?.status === 'ACTIVE', 'Team reverted to ACTIVE upon adding new open recruitment role')

    // ----------------------------------------------------
    // TEST GROUP 4: Manual Role Closure & Auto-Closure
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 4: Manual Role Closure & Auto-Closure ---')

    // Applicant 2 submits application for Role B
    const app2 = await createApplication({
      teamId: team.id,
      roleId: roleBId,
      userId: applicantUser2.id,
    })
    assert(!app2.error, 'Applicant 2 submitted application for Role B')

    // Leader sends invitation to Outsider Dave for Role B
    const invite1 = await createInvitation({
      teamId: team.id,
      roleId: roleBId,
      recipientId: outsiderUser.id,
      senderId: leaderUser.id,
    })
    assert(!invite1.error, 'Leader sent invitation for Role B')

    // Outsider cannot close Role B
    const unauthClose = await closeTeamRole({
      roleId: roleBId,
      leaderUserId: outsiderUser.id,
    })
    assert(!!unauthClose.error, 'Outsider blocked from closing team role')

    // Leader closes Role B
    const leaderClose = await closeTeamRole({
      roleId: roleBId,
      leaderUserId: leaderUser.id,
    })
    assert(!leaderClose.error, 'Authorized leader successfully closed Role B')

    // Verify Role B is CLOSED
    const roleBClosed = await prisma.teamRole.findUnique({ where: { id: roleBId } })
    assert(roleBClosed?.status === 'CLOSED', 'Role B status transitioned to CLOSED')

    // Verify pending application for Role B was AUTO_CLOSED
    const app2Status = await prisma.application.findUnique({ where: { id: app2.application!.id } })
    assert(app2Status?.status === 'AUTO_CLOSED', 'Pending application 2 was AUTO_CLOSED upon role closure')

    // Verify in-app notification was triggered for Applicant 2
    const notificationApp2 = await prisma.notification.findFirst({
      where: {
        userId: applicantUser2.id,
        type: 'APPLICATION_AUTO_CLOSED',
      },
    })
    assert(!!notificationApp2, 'In-app notification APPLICATION_AUTO_CLOSED generated for applicant')

    // Verify pending invitation for Role B was EXPIRED
    const invite1Status = await prisma.invitation.findUnique({ where: { id: invite1.invitation!.id } })
    assert(invite1Status?.status === 'EXPIRED', 'Pending invitation was marked EXPIRED upon role closure')

    // New applications to closed Role B are strictly rejected
    const appOnClosed = await createApplication({
      teamId: team.id,
      roleId: roleBId,
      userId: applicantUser2.id,
    })
    assert(!!appOnClosed.error, 'New application on CLOSED role is strictly rejected')

    // ----------------------------------------------------
    // TEST GROUP 5: Role Expiry Automation
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 5: Role Expiry Automation ---')

    // Create Role C with overdue expiry in the past
    const pastDate = new Date(Date.now() - 3600000) // 1 hour ago
    const roleC = await prisma.teamRole.create({
      data: {
        teamId: team.id,
        name: 'DevOps Specialist',
        seatsRequired: 1,
        expiry: pastDate,
        status: 'ACTIVE',
        skills: {
          create: {
            skillId: skillNode.id,
            requirementType: 'REQUIRED',
          },
        },
      },
    })

    // Create pending application on Role C
    const appC = await prisma.application.create({
      data: {
        teamId: team.id,
        roleId: roleC.id,
        userId: applicantUser2.id,
        status: 'PENDING',
      },
    })

    // Execute server-side role expiry job
    const expiryRes = await expireOverdueRoles()
    assert(!expiryRes.error, 'expireOverdueRoles job executed without errors')
    assert(expiryRes.expiredCount! >= 1, 'Overdue role count >= 1 processed')

    // Verify Role C transitioned to EXPIRED
    const roleCStatus = await prisma.teamRole.findUnique({ where: { id: roleC.id } })
    assert(roleCStatus?.status === 'EXPIRED', 'Overdue Role C transitioned to EXPIRED')

    // Verify pending application on Role C was AUTO_CLOSED
    const appCStatus = await prisma.application.findUnique({ where: { id: appC.id } })
    assert(appCStatus?.status === 'AUTO_CLOSED', 'Pending application on expired role was AUTO_CLOSED')

    // Verify expiry job is idempotent (running again returns 0 additional expired roles)
    const secondExpiryRes = await expireOverdueRoles()
    assert(secondExpiryRes.expiredCount === 0, 'Idempotent role expiry job processes 0 already-expired roles')

    // New applications to expired role are rejected
    const appOnExpired = await createApplication({
      teamId: team.id,
      roleId: roleC.id,
      userId: applicantUser1.id,
    })
    assert(!!appOnExpired.error, 'New application on EXPIRED role is strictly rejected')

    // ----------------------------------------------------
    // TEST GROUP 6: Role Deletion Safeguards
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 6: Role Deletion Safeguards ---')

    // Cannot delete Role A because it has an active member (Applicant 1)
    const deleteOccupied = await deleteTeamRole({
      roleId: roleAId,
      leaderUserId: leaderUser.id,
    })
    assert(!!deleteOccupied.error, 'Cannot delete role with active members')

    // Can delete unoccupied Role C
    const deleteUnoccupied = await deleteTeamRole({
      roleId: roleC.id,
      leaderUserId: leaderUser.id,
    })
    assert(!deleteUnoccupied.error, 'Unoccupied Role C deleted successfully')

    const roleCDeleted = await prisma.teamRole.findUnique({ where: { id: roleC.id } })
    assert(!roleCDeleted, 'Role C record successfully removed from database')

  } finally {
    // Teardown
    console.log('\n--- Cleaning up test records ---')
    await prisma.notification.deleteMany({
      where: { userId: { in: [leaderUser.id, applicantUser1.id, applicantUser2.id, outsiderUser.id] } },
    })
    await prisma.teamMember.deleteMany({ where: { teamId: team.id } })
    await prisma.roleSkill.deleteMany({ where: { role: { teamId: team.id } } })
    await prisma.application.deleteMany({ where: { teamId: team.id } })
    await prisma.invitation.deleteMany({ where: { teamId: team.id } })
    await prisma.teamRole.deleteMany({ where: { teamId: team.id } })
    await prisma.team.deleteMany({ where: { id: team.id } })
    await prisma.skill.deleteMany({ where: { id: { in: [skillReact.id, skillNode.id] } } })
    await prisma.user.deleteMany({
      where: { id: { in: [leaderUser.id, applicantUser1.id, applicantUser2.id, outsiderUser.id] } },
    })
  }

  console.log('\n==================================================')
  console.log(`ROLE LIFECYCLE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('==================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runRoleLifecycleTests().catch((err) => {
  console.error('Test runner threw error:', err)
  process.exit(1)
})
