import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import {
  submitPeerRating,
  getTeammateRatingStatus,
  getEligibleTeammatesForRating,
} from '../src/app/actions/ratings'
import { getEventsCatalog, getEventShowcaseDetails } from '../src/app/actions/events'

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

async function runRatingsAndShowcaseTests() {
  console.log('\n==================================================')
  console.log('STARTING RATINGS & EVENT SHOWCASE INTEGRATION TESTS')
  console.log('==================================================\n')

  const timestamp = Date.now()

  // 1. Setup College and Department
  const college = await prisma.college.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Ratings Test Univ',
      domain: 'rate.edu',
    },
  })

  const department = await prisma.department.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      collegeId: college.id,
      name: 'Computer Engineering',
    },
  })

  // 2. Setup Event
  const event = await prisma.event.create({
    data: {
      name: `AI Innovation Hackathon ${timestamp}`,
      description: '48-hour challenge building agentic systems',
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 172800000),
      registrationDeadline: new Date(Date.now() + 43200000),
      rules: '1. Original builds only\n2. Open source repo required',
      teamSizeInfo: '2 to 4 Builders',
      status: 'REGISTRATION_OPEN',
    },
  })

  // 3. Setup Users
  const userLeader = await prisma.user.create({
    data: {
      username: `rt_leader_${timestamp}`,
      name: 'Squad Captain',
      verificationStatus: 'APPROVED',
      collegeId: college.id,
      departmentId: department.id,
      privateData: {
        create: {
          collegeEmail: `leader_${timestamp}@rate.edu`,
          erp: `ERP_LEADER_${timestamp}`,
        },
      },
    },
  })

  const userTeammate1 = await prisma.user.create({
    data: {
      username: `rt_mate1_${timestamp}`,
      name: 'Frontend Architect',
      verificationStatus: 'APPROVED',
      collegeId: college.id,
      departmentId: department.id,
      privateData: {
        create: {
          collegeEmail: `mate1_${timestamp}@rate.edu`,
          erp: `ERP_MATE1_${timestamp}`,
        },
      },
    },
  })

  const userTeammate2 = await prisma.user.create({
    data: {
      username: `rt_mate2_${timestamp}`,
      name: 'Backend Engineer',
      verificationStatus: 'APPROVED',
      collegeId: college.id,
      departmentId: department.id,
    },
  })

  const userRemoved = await prisma.user.create({
    data: {
      username: `rt_removed_${timestamp}`,
      name: 'Disqualified Member',
      verificationStatus: 'APPROVED',
      collegeId: college.id,
      departmentId: department.id,
    },
  })

  const userOutsider = await prisma.user.create({
    data: {
      username: `rt_outsider_${timestamp}`,
      name: 'Random Outsider',
      verificationStatus: 'APPROVED',
      collegeId: college.id,
      departmentId: department.id,
    },
  })

  // 4. Setup Team with active, left, and removed members
  const team = await prisma.$transaction(async (tx) => {
    const t = await tx.team.create({
      data: {
        name: `Neural Nexus Squad ${timestamp}`,
        description: 'Building edge intelligence agents',
        status: 'ACTIVE',
        eventId: event.id,
      },
    })

    // Leader: ACTIVE
    await tx.teamMember.create({
      data: {
        teamId: t.id,
        userId: userLeader.id,
        membershipRole: 'LEADER',
        status: 'ACTIVE',
      },
    })

    // Teammate 1: ACTIVE
    await tx.teamMember.create({
      data: {
        teamId: t.id,
        userId: userTeammate1.id,
        membershipRole: 'MEMBER',
        status: 'ACTIVE',
      },
    })

    // Teammate 2: LEFT (past member who completed milestone)
    await tx.teamMember.create({
      data: {
        teamId: t.id,
        userId: userTeammate2.id,
        membershipRole: 'MEMBER',
        status: 'LEFT',
      },
    })

    // Removed Member: REMOVED (misconduct)
    await tx.teamMember.create({
      data: {
        teamId: t.id,
        userId: userRemoved.id,
        membershipRole: 'MEMBER',
        status: 'REMOVED',
      },
    })

    // Open Role
    const role = await tx.teamRole.create({
      data: {
        teamId: t.id,
        name: 'AI Pipeline Specialist',
        seatsRequired: 1,
        expiry: new Date(Date.now() + 86400000 * 7),
        status: 'ACTIVE',
      },
    })

    return { ...t, roleId: role.id }
  })

  // ==========================================
  // TEST GROUP 1: Peer Ratings & Eligibility
  // ==========================================
  console.log('--- TEST GROUP 1: Peer Ratings & Eligibility ---')

  // 1. Valid 5-star rating + feedback
  const r1 = await submitPeerRating(
    {
      teamId: team.id,
      rateeId: userTeammate1.id,
      score: 5,
      feedback: 'Outstanding UI engineer! Delivered all components ahead of schedule with great polish.',
    },
    userLeader.id
  )
  assert(!!r1.rating, 'Active leader submitted valid 5-star rating with feedback')
  assert(r1.rating?.score === 5, 'Rating score is exactly 5')
  assert(Boolean(r1.rating?.feedback?.includes('Outstanding UI engineer')), 'Feedback content persisted accurately')

  // 2. Valid rating without feedback (optional feedback support)
  const r2 = await submitPeerRating(
    {
      teamId: team.id,
      rateeId: userLeader.id,
      score: 4,
    },
    userTeammate1.id
  )
  assert(!!r2.rating, 'Teammate submitted valid 4-star rating without written feedback')
  assert(r2.rating?.score === 4, 'Rating score is 4')
  assert(r2.rating?.feedback === null, 'Feedback is cleanly null')

  // 3. Past member (status: LEFT) rates teammate
  const r3 = await submitPeerRating(
    {
      teamId: team.id,
      rateeId: userLeader.id,
      score: 5,
      feedback: 'Great team coordination and clear direction.',
    },
    userTeammate2.id
  )
  assert(!!r3.rating, 'Past member (status: LEFT) successfully submitted peer review')

  // ==========================================
  // TEST GROUP 2: Security & Rejection Cases
  // ==========================================
  console.log('\n--- TEST GROUP 2: Security & Rejection Cases ---')

  // 4. Self-rating rejection
  const selfRes = await submitPeerRating(
    {
      teamId: team.id,
      rateeId: userLeader.id,
      score: 5,
      feedback: 'I am the best leader ever',
    },
    userLeader.id
  )
  assert(!!selfRes.error, 'Self-rating strictly rejected')
  assert(selfRes.error === 'Cannot rate yourself.', 'Accurate self-rating error message returned')

  // 5. Outsider rating rejection
  const outsiderRes = await submitPeerRating(
    {
      teamId: team.id,
      rateeId: userTeammate1.id,
      score: 5,
    },
    userOutsider.id
  )
  assert(!!outsiderRes.error, 'Outsider non-member strictly rejected from rating team member')

  // 6. Removed member rejection
  const removedRes = await submitPeerRating(
    {
      teamId: team.id,
      rateeId: userLeader.id,
      score: 1,
      feedback: 'Retaliatory rating',
    },
    userRemoved.id
  )
  assert(!!removedRes.error, 'Removed member strictly rejected from submitting ratings')

  // 7. Duplicate rating rejection
  const dupRes = await submitPeerRating(
    {
      teamId: team.id,
      rateeId: userTeammate1.id,
      score: 5,
      feedback: 'Spamming second review',
    },
    userLeader.id
  )
  assert(!!dupRes.error, 'Duplicate rating for same peer in same team strictly rejected')

  // 8. Invalid score bounds (score = 0, 6, or float)
  const badScore1 = await submitPeerRating(
    { teamId: team.id, rateeId: userTeammate2.id, score: 0 },
    userLeader.id
  )
  assert(!!badScore1.error, 'Score of 0 rejected')

  const badScore2 = await submitPeerRating(
    { teamId: team.id, rateeId: userTeammate2.id, score: 6 },
    userLeader.id
  )
  assert(!!badScore2.error, 'Score of 6 rejected')

  const badScore3 = await submitPeerRating(
    { teamId: team.id, rateeId: userTeammate2.id, score: 4.5 },
    userLeader.id
  )
  assert(!!badScore3.error, 'Floating-point score (4.5) rejected (must be integer)')

  // 9. Oversized feedback (> 1000 chars)
  const hugeFeedback = 'A'.repeat(1005)
  const hugeRes = await submitPeerRating(
    { teamId: team.id, rateeId: userTeammate2.id, score: 5, feedback: hugeFeedback },
    userLeader.id
  )
  assert(!!hugeRes.error, 'Oversized feedback (>1000 chars) rejected safely')

  // ==========================================
  // TEST GROUP 3: Rating Status & Aggregation
  // ==========================================
  console.log('\n--- TEST GROUP 3: Rating Status & Aggregation ---')

  // 10. getTeammateRatingStatus
  const statusHasRated = await getTeammateRatingStatus(
    { teamId: team.id, rateeId: userTeammate1.id },
    userLeader.id
  )
  assert(statusHasRated.hasRated === true, 'getTeammateRatingStatus confirms leader already rated teammate 1')
  assert(statusHasRated.rating?.score === 5, 'getTeammateRatingStatus returns exact score (5)')

  const statusNotRated = await getTeammateRatingStatus(
    { teamId: team.id, rateeId: userTeammate2.id },
    userLeader.id
  )
  assert(statusNotRated.hasRated === false, 'getTeammateRatingStatus confirms leader has not yet rated teammate 2')

  // 11. getEligibleTeammatesForRating
  const eligibleList = await getEligibleTeammatesForRating(team.id, userLeader.id)
  assert(!!eligibleList.teammates, 'getEligibleTeammatesForRating returned teammates array')
  assert(
    Boolean(eligibleList.teammates?.some((t) => t.userId === userTeammate1.id && t.hasRated === true)),
    'Eligible list reflects teammate 1 as hasRated: true'
  )
  assert(
    Boolean(eligibleList.teammates?.some((t) => t.userId === userTeammate2.id && t.hasRated === false)),
    'Eligible list reflects teammate 2 as hasRated: false'
  )
  assert(
    Boolean(!eligibleList.teammates?.some((t) => t.userId === userRemoved.id)),
    'Removed member is strictly excluded from eligible teammates list'
  )

  // 12. Privacy check: rater response must omit ERP and private email
  const ratingRecord: any = r1.rating
  assert(ratingRecord.rater.collegeEmail === undefined, 'Rater private email is strictly omitted')
  assert(ratingRecord.rater.erp === undefined, 'Rater private ERP is strictly omitted')

  // ==========================================
  // TEST GROUP 4: Event Showcase Actions
  // ==========================================
  console.log('\n--- TEST GROUP 4: Event Showcase Actions ---')

  // 13. getEventsCatalog
  const catalogRes = await getEventsCatalog()
  assert(!!catalogRes.events, 'getEventsCatalog successfully returned events array')
  const currentEvent = catalogRes.events?.find((e) => e.id === event.id)
  assert(!!currentEvent, 'Newly created test event is present in events catalog')
  assert(currentEvent?.teamCount === 1, 'Event catalog correctly reports 1 registered squad')
  assert(currentEvent?.openRoleCount === 1, 'Event catalog correctly reports 1 open recruitment role')

  // 14. getEventShowcaseDetails
  const showcaseRes = await getEventShowcaseDetails(event.id)
  assert(!!showcaseRes.event, 'getEventShowcaseDetails successfully returned event showcase details')
  assert(showcaseRes.event?.name === event.name, 'Event showcase metadata matches')
  assert(showcaseRes.event?.teams.length === 1, 'Event showcase contains 1 registered squad')
  assert(showcaseRes.event?.teams[0].openRoles.length === 1, 'Squad open roles correctly mapped with skills')

  // ==========================================
  // TEST GROUP 5: Cleanup
  // ==========================================
  await prisma.activityLog.deleteMany({ where: { teamId: team.id } })
  await prisma.rating.deleteMany({ where: { teamId: team.id } })
  await prisma.teamRole.deleteMany({ where: { teamId: team.id } })
  await prisma.teamMember.deleteMany({ where: { teamId: team.id } })
  await prisma.team.deleteMany({ where: { id: team.id } })
  await prisma.event.deleteMany({ where: { id: event.id } })
  await prisma.userPrivate.deleteMany({
    where: {
      userId: {
        in: [userLeader.id, userTeammate1.id, userTeammate2.id, userRemoved.id, userOutsider.id],
      },
    },
  })
  await prisma.user.deleteMany({
    where: {
      id: {
        in: [userLeader.id, userTeammate1.id, userTeammate2.id, userRemoved.id, userOutsider.id],
      },
    },
  })

  console.log('\n==================================================')
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('==================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runRatingsAndShowcaseTests().catch((err) => {
  console.error('Fatal error in ratings & showcase tests:', err)
  process.exit(1)
})
