import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import { getMatchedCandidatesForRole, getMyActiveRecruitmentRoles } from '../src/app/actions/matching'
import { createTeam } from '../src/app/actions/teams'
import { createTeamRole } from '../src/app/actions/roles'

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

async function runDiscoveryTests() {
  console.log('\n==================================================')
  console.log('STARTING DISCOVERY & MATCHING INTEGRATION TESTS')
  console.log('==================================================\n')

  // Setup test environment
  const timestamp = Date.now()

  // 1. College and Department
  const college = await prisma.college.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Discovery Test University',
      domain: 'discovery.edu',
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

  // 2. Skills and Taxonomy Relationship
  const skillPyTorch = await prisma.skill.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      name: `PyTorch-${timestamp}`,
      isCustom: false,
    },
  })

  const skillTensorFlow = await prisma.skill.upsert({
    where: { id: '00000000-0000-0000-0000-000000000011' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000011',
      name: `TensorFlow-${timestamp}`,
      isCustom: false,
    },
  })

  // 3. Test Users: Leader, ExactCandidate, RelatedCandidate, InterestCandidate, NoMatchCandidate
  const leaderUser = await prisma.user.create({
    data: {
      username: `leader_${timestamp}`,
      name: 'Leader User',
      verificationStatus: 'APPROVED',
      collegeId: college.id,
      departmentId: department.id,
    },
  })

  // Connect PyTorch <-> TensorFlow as related
  await prisma.skillRelationship.upsert({
    where: {
      sourceSkillId_relatedSkillId: {
        sourceSkillId: skillPyTorch.id,
        relatedSkillId: skillTensorFlow.id,
      },
    },
    update: {},
    create: {
      sourceSkillId: skillPyTorch.id,
      relatedSkillId: skillTensorFlow.id,
      relationshipStrength: 80,
      createdById: leaderUser.id,
    },
  })

  const exactCandidate = await prisma.user.create({
    data: {
      username: `exact_${timestamp}`,
      name: 'Exact Match Candidate',
      verificationStatus: 'APPROVED',
      availability: 'LOOKING_FOR_TEAM',
      collegeId: college.id,
      departmentId: department.id,
      skills: {
        create: {
          skillId: skillPyTorch.id,
          level: 'ADVANCED',
        },
      },
    },
  })

  const relatedCandidate = await prisma.user.create({
    data: {
      username: `related_${timestamp}`,
      name: 'Related Match Candidate',
      verificationStatus: 'APPROVED',
      availability: 'AVAILABLE',
      collegeId: college.id,
      departmentId: department.id,
      skills: {
        create: {
          skillId: skillTensorFlow.id,
          level: 'INTERMEDIATE',
        },
      },
    },
  })

  const interestCandidate = await prisma.user.create({
    data: {
      username: `interest_${timestamp}`,
      name: 'Interest Only Candidate',
      verificationStatus: 'APPROVED',
      availability: 'AVAILABLE',
      collegeId: college.id,
      departmentId: department.id,
      interests: {
        create: {
          skillId: skillPyTorch.id,
        },
      },
    },
  })

  const noMatchCandidate = await prisma.user.create({
    data: {
      username: `nomatch_${timestamp}`,
      name: 'No Match Candidate',
      verificationStatus: 'APPROVED',
      availability: 'AVAILABLE',
      collegeId: college.id,
      departmentId: department.id,
    },
  })

  // 4. Create Team and Recruitment Role requiring PyTorch
  const teamRes = await createTeam({
    name: `Discovery Test Team ${timestamp}`,
    description: 'Testing teammate discovery and match classification',
    leaderUserId: leaderUser.id,
  })

  assert(!!teamRes.team, 'Team created with active leader')

  const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const roleRes = await createTeamRole({
    teamId: teamRes.team!.id,
    name: 'AI / ML Engineer',
    seatsRequired: 2,
    preferredLevel: 'ADVANCED',
    preferredExperience: 'SOME_EXPERIENCE',
    expiry: expiryDate,
    requiredSkillIds: [skillPyTorch.id],
    leaderUserId: leaderUser.id,
  })

  assert(!!roleRes.role, 'Team role created requiring PyTorch')

  // 5. Query matching engine for role
  const matchResult = await getMatchedCandidatesForRole(roleRes.role!.id)

  // Verify EXACT bucket
  const foundExact = matchResult.EXACT.find((c: any) => c.id === exactCandidate.id)
  assert(!!foundExact, 'ExactCandidate correctly placed in EXACT matches')
  assert(foundExact?.matchCategory === 'EXACT', 'Exact candidate has matchCategory EXACT')
  assert(foundExact?.matchMetrics.requiredCoverage === 1, 'Exact candidate has requiredCoverage = 1')

  // Verify RELATED bucket
  const foundRelated = matchResult.RELATED.find((c: any) => c.id === relatedCandidate.id)
  assert(!!foundRelated, 'RelatedCandidate correctly placed in RELATED matches')
  assert(foundRelated?.matchCategory === 'RELATED', 'Related candidate has matchCategory RELATED')

  // Verify INTEREST_ONLY bucket
  const foundInterest = matchResult.INTEREST_ONLY.find((c: any) => c.id === interestCandidate.id)
  assert(!!foundInterest, 'InterestCandidate correctly placed in INTEREST_ONLY matches')
  assert(foundInterest?.matchCategory === 'INTEREST_ONLY', 'Interest candidate has matchCategory INTEREST_ONLY')

  // Verify NO MATCH exclusion
  const foundNoMatch = [
    ...matchResult.EXACT,
    ...matchResult.RELATED,
    ...matchResult.INTEREST_ONLY,
  ].find((c: any) => c.id === noMatchCandidate.id)
  assert(!foundNoMatch, 'NoMatchCandidate is strictly excluded from all match results')

  // 6. Test getMyActiveRecruitmentRoles helper with authenticated user
  const activeRoles = await getMyActiveRecruitmentRoles()
  assert(Array.isArray(activeRoles), 'getMyActiveRecruitmentRoles returns array')

  // 7. Cleanup
  await prisma.teamRole.deleteMany({ where: { teamId: teamRes.team!.id } })
  await prisma.teamMember.deleteMany({ where: { teamId: teamRes.team!.id } })
  await prisma.team.delete({ where: { id: teamRes.team!.id } })
  await prisma.userSkill.deleteMany({
    where: { userId: { in: [exactCandidate.id, relatedCandidate.id] } },
  })
  await prisma.userInterest.deleteMany({
    where: { userId: { in: [interestCandidate.id] } },
  })
  await prisma.skillRelationship.deleteMany({
    where: {
      sourceSkillId: skillPyTorch.id,
      relatedSkillId: skillTensorFlow.id,
    },
  })
  await prisma.user.deleteMany({
    where: {
      id: {
        in: [
          leaderUser.id,
          exactCandidate.id,
          relatedCandidate.id,
          interestCandidate.id,
          noMatchCandidate.id,
        ],
      },
    },
  })
  await prisma.skill.deleteMany({
    where: { id: { in: [skillPyTorch.id, skillTensorFlow.id] } },
  })

  console.log('\n==================================================')
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('==================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runDiscoveryTests().catch((err) => {
  console.error('Fatal error during discovery tests:', err)
  process.exit(1)
})
