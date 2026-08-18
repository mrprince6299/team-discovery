import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import {
  createApplication,
  acceptApplication,
  rejectApplication,
  withdrawApplication,
  getMyApplications,
} from '../src/app/actions/applications'
import {
  createInvitation,
  acceptInvitation,
  declineInvitation,
  getMyInvitations,
} from '../src/app/actions/invitations'

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

async function runApplicationsAndInvitationsTests() {
  console.log('\n==================================================')
  console.log('STARTING APPLICATION & INVITATION INTEGRATION TESTS')
  console.log('==================================================\n')

  const timestamp = Date.now()

  // 1. Setup College and Department
  const college = await prisma.college.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Apps Test University',
      domain: 'apps.edu',
    },
  })

  const department = await prisma.department.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      collegeId: college.id,
      name: 'Computer Science',
    },
  })

  // 2. Setup Skill
  const skill = await prisma.skill.upsert({
    where: { id: '00000000-0000-0000-0000-000000000030' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000030',
      name: `Python-AI-${timestamp}`,
      isCustom: false,
    },
  })

  // 3. Setup Users: Leader, Applicant 1, Applicant 2, Invitee
  const leaderUser = await prisma.user.create({
    data: {
      username: `leader_${timestamp}`,
      name: 'Squad Leader User',
      verificationStatus: 'APPROVED',
      collegeId: college.id,
      departmentId: department.id,
    },
  })

  const applicant1 = await prisma.user.create({
    data: {
      username: `applicant1_${timestamp}`,
      name: 'Applicant Candidate One',
      verificationStatus: 'APPROVED',
      availability: 'LOOKING_FOR_TEAM',
      collegeId: college.id,
      departmentId: department.id,
      skills: {
        create: {
          skillId: skill.id,
          level: 'ADVANCED',
        },
      },
    },
  })

  const applicant2 = await prisma.user.create({
    data: {
      username: `applicant2_${timestamp}`,
      name: 'Applicant Candidate Two',
      verificationStatus: 'APPROVED',
      availability: 'LOOKING_FOR_TEAM',
      collegeId: college.id,
      departmentId: department.id,
    },
  })

  const inviteeUser = await prisma.user.create({
    data: {
      username: `invitee_${timestamp}`,
      name: 'Direct Invitee Candidate',
      verificationStatus: 'APPROVED',
      availability: 'LOOKING_FOR_TEAM',
      collegeId: college.id,
      departmentId: department.id,
    },
  })

  // 4. Setup Team and Role
  const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const team = await prisma.$transaction(async (tx) => {
    const t = await tx.team.create({
      data: {
        name: `Neural Squad ${timestamp}`,
        description: 'Building autonomous agents',
        status: 'ACTIVE',
      },
    })

    await tx.teamMember.create({
      data: {
        teamId: t.id,
        userId: leaderUser.id,
        membershipRole: 'LEADER',
        status: 'ACTIVE',
      },
    })

    await tx.conversation.create({
      data: { teamId: t.id },
    })

    const role = await tx.teamRole.create({
      data: {
        teamId: t.id,
        name: 'AI Engineer',
        seatsRequired: 1,
        preferredLevel: 'ADVANCED',
        expiry: expiryDate,
        status: 'ACTIVE',
      },
    })

    await tx.roleSkill.create({
      data: {
        roleId: role.id,
        skillId: skill.id,
        requirementType: 'REQUIRED',
      },
    })

    return { id: t.id, roleId: role.id }
  })

  // ==========================================
  // TEST GROUP 1: Applications Workflow
  // ==========================================
  console.log('--- TEST GROUP 1: Applications Workflow ---')

  // 1. Applicant 1 applies
  const app1 = await createApplication({
    teamId: team.id,
    roleId: team.roleId,
    userId: applicant1.id,
    message: 'I specialize in Python and AI algorithms.',
  })
  assert(!!app1.application, 'Applicant 1 created application successfully')
  assert(app1.application?.status === 'PENDING', 'Application 1 is PENDING')

  // 2. Applicant 2 applies
  const app2 = await createApplication({
    teamId: team.id,
    roleId: team.roleId,
    userId: applicant2.id,
    message: 'Passionate about deep learning architectures.',
  })
  assert(!!app2.application, 'Applicant 2 created application successfully')

  // 3. Test Applicant 2 Withdraws application
  const withdrawRes = await withdrawApplication(app2.application!.id, applicant2.id)
  assert(withdrawRes.success === true, 'Applicant 2 withdrew their application')

  const updatedApp2 = await prisma.application.findUnique({
    where: { id: app2.application!.id },
  })
  assert(updatedApp2?.status === 'WITHDRAWN', 'Application 2 status transitioned to WITHDRAWN')

  // 4. Unauthorized withdrawal attempt
  const badWithdraw = await withdrawApplication(app1.application!.id, applicant2.id)
  assert(!!badWithdraw.error, 'Unauthorized user blocked from withdrawing others application')

  // 5. Leader accepts Applicant 1
  const acceptRes = await acceptApplication(app1.application!.id, leaderUser.id) as any
  assert(acceptRes.success === true, 'Leader accepted Applicant 1 into the team')
  assert(acceptRes.roleStatus === 'FULL', 'Role transitioned to FULL status upon filling last seat')

  const memberRecord = await prisma.teamMember.findFirst({
    where: { teamId: team.id, userId: applicant1.id, status: 'ACTIVE' },
  })
  assert(!!memberRecord, 'Applicant 1 registered as active team member')

  // ==========================================
  // TEST GROUP 2: Invitations Workflow
  // ==========================================
  console.log('\n--- TEST GROUP 2: Invitations Workflow ---')

  // Create a 2nd role for invitations test and update team status
  await prisma.team.update({ where: { id: team.id }, data: { status: 'ACTIVE' } })
  const role2 = await prisma.teamRole.create({
    data: {
      teamId: team.id,
      name: 'System Architect',
      seatsRequired: 1,
      expiry: expiryDate,
      status: 'ACTIVE',
    },
  })

  // 1. Leader sends invitation to inviteeUser
  const invRes = await createInvitation({
    teamId: team.id,
    roleId: role2.id,
    recipientId: inviteeUser.id,
    senderId: leaderUser.id,
    message: 'We would love to have you lead architecture!',
  })
  assert(!!invRes.invitation, 'Leader sent invitation successfully')
  assert(invRes.invitation?.status === 'PENDING', 'Invitation is in PENDING state')

  // 2. Unauthorized accept attempt
  const badAccept = await acceptInvitation(invRes.invitation!.id, applicant2.id) as any
  assert(!!badAccept.error, 'Non-recipient blocked from accepting invitation')

  // 3. Invitee accepts invitation
  const acceptInvRes = await acceptInvitation(invRes.invitation!.id, inviteeUser.id) as any
  assert(acceptInvRes.success === true, 'Invitee accepted invitation successfully')
  assert(acceptInvRes.roleStatus === 'FULL', 'Role 2 transitioned to FULL upon acceptance')

  const inviteeMember = await prisma.teamMember.findFirst({
    where: { teamId: team.id, userId: inviteeUser.id, status: 'ACTIVE' },
  })
  assert(!!inviteeMember, 'Invitee registered as active team member')

  // ==========================================
  // TEST GROUP 3: Decline Invitation
  // ==========================================
  console.log('\n--- TEST GROUP 3: Decline Invitation ---')

  await prisma.team.update({ where: { id: team.id }, data: { status: 'ACTIVE' } })
  const role3 = await prisma.teamRole.create({
    data: {
      teamId: team.id,
      name: 'Design Lead',
      seatsRequired: 1,
      expiry: expiryDate,
      status: 'ACTIVE',
    },
  })

  const inv2Res = await createInvitation({
    teamId: team.id,
    roleId: role3.id,
    recipientId: applicant2.id,
    senderId: leaderUser.id,
    message: 'Join us for UX design!',
  })

  const declineRes = await declineInvitation(inv2Res.invitation!.id, applicant2.id)
  assert(declineRes.success === true, 'Applicant 2 declined invitation')

  const declinedInv = await prisma.invitation.findUnique({
    where: { id: inv2Res.invitation!.id },
  })
  assert(declinedInv?.status === 'DECLINED', 'Invitation status is DECLINED')

  // ==========================================
  // TEST GROUP 4: Cleanup
  // ==========================================
  await prisma.invitation.deleteMany({ where: { teamId: team.id } })
  await prisma.application.deleteMany({ where: { teamId: team.id } })
  await prisma.roleSkill.deleteMany({
    where: { roleId: { in: [team.roleId, role2.id, role3.id] } },
  })
  await prisma.teamRole.deleteMany({ where: { teamId: team.id } })
  await prisma.teamMember.deleteMany({ where: { teamId: team.id } })
  await prisma.conversation.deleteMany({ where: { teamId: team.id } })
  await prisma.team.delete({ where: { id: team.id } })
  await prisma.userSkill.deleteMany({ where: { userId: applicant1.id } })
  await prisma.user.deleteMany({
    where: { id: { in: [leaderUser.id, applicant1.id, applicant2.id, inviteeUser.id] } },
  })
  await prisma.skill.deleteMany({ where: { id: skill.id } })

  console.log('\n==================================================')
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('==================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runApplicationsAndInvitationsTests().catch((err) => {
  console.error('Fatal error in application and invitation tests:', err)
  process.exit(1)
})
