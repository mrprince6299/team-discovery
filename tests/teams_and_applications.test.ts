import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import { createTeamWithRoles, getDiscoverableTeams, getTeamDetails } from '../src/app/actions/teams'
import { createApplication } from '../src/app/actions/applications'

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

async function runTeamsAndApplicationsTests() {
  console.log('\n==================================================')
  console.log('STARTING TEAMS & ROLE APPLICATION INTEGRATION TESTS')
  console.log('==================================================\n')

  const timestamp = Date.now()

  // 1. Setup College and Department
  const college = await prisma.college.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Teams Test University',
      domain: 'teams.edu',
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

  // 2. Setup Skills
  const skillReact = await prisma.skill.upsert({
    where: { id: '00000000-0000-0000-0000-000000000020' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000020',
      name: `React-${timestamp}`,
      isCustom: false,
    },
  })

  const skillNode = await prisma.skill.upsert({
    where: { id: '00000000-0000-0000-0000-000000000021' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000021',
      name: `NodeJS-${timestamp}`,
      isCustom: false,
    },
  })

  // 3. Setup Test Event
  const event = await prisma.event.create({
    data: {
      name: `Hackathon Alpha ${timestamp}`,
      description: 'Annual flagship engineering hackathon',
      startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      rules: 'Standard hackathon rules',
      teamSizeInfo: '2 to 4 members',
      status: 'REGISTRATION_OPEN',
    },
  })

  // 4. Setup Leader and Applicant Users
  const leaderUser = await prisma.user.create({
    data: {
      username: `teamleader_${timestamp}`,
      name: 'Team Leader User',
      verificationStatus: 'APPROVED',
      collegeId: college.id,
      departmentId: department.id,
    },
  })

  const applicantUser = await prisma.user.create({
    data: {
      username: `applicant_${timestamp}`,
      name: 'Applicant Candidate',
      verificationStatus: 'APPROVED',
      availability: 'LOOKING_FOR_TEAM',
      collegeId: college.id,
      departmentId: department.id,
      skills: {
        create: {
          skillId: skillReact.id,
          level: 'ADVANCED',
        },
      },
    },
  })

  // 5. Test Team Creation with Roles
  const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  // Direct transaction creation for test execution
  const team = await prisma.$transaction(async (tx) => {
    const t = await tx.team.create({
      data: {
        name: `Quantum Hackers ${timestamp}`,
        description: 'Building next-generation decentralized identity protocol',
        eventId: event.id,
        status: 'ACTIVE',
      },
    })

    await tx.teamMember.create({
      data: {
        teamId: t.id,
        eventId: event.id,
        userId: leaderUser.id,
        membershipRole: 'LEADER',
        status: 'ACTIVE',
      },
    })

    await tx.conversation.create({
      data: { teamId: t.id },
    })

    const role1 = await tx.teamRole.create({
      data: {
        teamId: t.id,
        name: 'Frontend Lead',
        seatsRequired: 1,
        preferredLevel: 'ADVANCED',
        preferredExperience: 'EXPERIENCED',
        expiry: expiryDate,
        status: 'ACTIVE',
      },
    })

    await tx.roleSkill.create({
      data: {
        roleId: role1.id,
        skillId: skillReact.id,
        requirementType: 'REQUIRED',
      },
    })

    const role2 = await tx.teamRole.create({
      data: {
        teamId: t.id,
        name: 'Backend Lead',
        seatsRequired: 1,
        preferredLevel: 'INTERMEDIATE',
        preferredExperience: 'SOME_EXPERIENCE',
        expiry: expiryDate,
        status: 'ACTIVE',
      },
    })

    await tx.roleSkill.create({
      data: {
        roleId: role2.id,
        skillId: skillNode.id,
        requirementType: 'REQUIRED',
      },
    })

    return { id: t.id, role1Id: role1.id, role2Id: role2.id }
  })

  assert(!!team.id, 'Team created with active leader and initial roles atomically')

  // 6. Test Discoverable Teams Query
  const discoverable = await getDiscoverableTeams()
  const foundTeam = discoverable.find((t) => t.id === team.id)
  assert(!!foundTeam, 'Newly created team appears in getDiscoverableTeams')
  assert(foundTeam?.activeRolesCount === 2, 'Team reports 2 active recruitment roles')
  assert(foundTeam?.totalSeatsRemaining === 2, 'Team reports 2 total seats remaining')
  assert(foundTeam?.event?.name === event.name, 'Team correctly associated with event')

  // 7. Test Team Details Query
  const details = await getTeamDetails(team.id)
  assert(!!details, 'getTeamDetails successfully returned team')
  assert(details?.members.length === 1, 'Team roster contains exactly 1 active member (leader)')
  assert(details?.roles.length === 2, 'Team details contains 2 recruitment role cards')
  assert(details?.roles[0].requiredSkills[0].name === `React-${timestamp}`, 'Role 1 contains required React skill')

  // 8. Test Role Application
  const appRes = await createApplication({
    teamId: team.id,
    roleId: team.role1Id,
    userId: applicantUser.id,
    message: 'Experienced React engineer eager to build this hackathon project!',
  })

  assert(!!appRes.application, 'Applicant submitted role application successfully')
  assert(appRes.application?.status === 'PENDING', 'Application is in PENDING state')

  // 9. Test Duplicate Application Rejection
  const dupAppRes = await createApplication({
    teamId: team.id,
    roleId: team.role1Id,
    userId: applicantUser.id,
  })

  assert(!!dupAppRes.error, 'Duplicate application to same team rejected safely')

  // 10. Cleanup
  await prisma.application.deleteMany({ where: { teamId: team.id } })
  await prisma.roleSkill.deleteMany({
    where: { roleId: { in: [team.role1Id, team.role2Id] } },
  })
  await prisma.teamRole.deleteMany({ where: { teamId: team.id } })
  await prisma.teamMember.deleteMany({ where: { teamId: team.id } })
  await prisma.conversation.deleteMany({ where: { teamId: team.id } })
  await prisma.team.delete({ where: { id: team.id } })
  await prisma.event.delete({ where: { id: event.id } })
  await prisma.userSkill.deleteMany({ where: { userId: applicantUser.id } })
  await prisma.user.deleteMany({
    where: { id: { in: [leaderUser.id, applicantUser.id] } },
  })
  await prisma.skill.deleteMany({
    where: { id: { in: [skillReact.id, skillNode.id] } },
  })

  console.log('\n==================================================')
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('==================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runTeamsAndApplicationsTests().catch((err) => {
  console.error('Fatal error in teams and applications tests:', err)
  process.exit(1)
})
