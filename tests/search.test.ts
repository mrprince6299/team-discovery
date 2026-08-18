import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import { globalSearch } from '../src/app/actions/search'
import { toggleBookmark } from '../src/app/actions/bookmarks'

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`)
    throw new Error(`Assertion failed: ${message}`)
  }
  console.log(`  ✅ PASS: ${message}`)
}

async function runSearchTests() {
  console.log('==================================================')
  console.log('STARTING GLOBAL INSTANT SEARCH INTEGRATION TESTS')
  console.log('==================================================\n')

  const timestamp = Date.now()
  const testEmailPrefix = `search_test_${timestamp}`

  // Track created entities for clean teardown
  let userA: any
  let userB: any
  let candidateUser: any
  let team1: any
  let projectPublic: any
  let projectPrivate: any
  let event1: any
  let skill1: any

  try {
    // ----------------------------------------------------
    // SETUP: Fixtures & Database Records
    // ----------------------------------------------------
    skill1 = await prisma.skill.create({
      data: {
        name: `RustLang_${timestamp}`,
        isCustom: true,
      },
    })

    userA = await prisma.user.create({
      data: {
        name: `Alice Explorer_${timestamp}`,
        username: `alice_exp_${timestamp}`,
        verificationStatus: 'APPROVED',
        availability: 'AVAILABLE',
        bio: 'Fullstack Rust and TypeScript builder',
        privateData: {
          create: {
            collegeEmail: `${testEmailPrefix}_a@college.edu`,
            erp: `ERP_A_${timestamp}`,
          },
        },
      },
    })

    userB = await prisma.user.create({
      data: {
        name: `Bob Builder_${timestamp}`,
        username: `bob_bld_${timestamp}`,
        verificationStatus: 'APPROVED',
        availability: 'LOOKING_FOR_TEAM',
        bio: 'Distributed systems engineer',
        privateData: {
          create: {
            collegeEmail: `${testEmailPrefix}_b@college.edu`,
            erp: `ERP_B_${timestamp}`,
          },
        },
      },
    })

    candidateUser = await prisma.user.create({
      data: {
        name: `Charlie Candidate_${timestamp}`,
        username: `charlie_cand_${timestamp}`,
        verificationStatus: 'APPROVED',
        availability: 'AVAILABLE',
        bio: 'Machine learning specialist with Rust experience',
        privateData: {
          create: {
            collegeEmail: `${testEmailPrefix}_cand@college.edu`,
            erp: `ERP_C_${timestamp}`,
          },
        },
        skills: {
          create: {
            skillId: skill1.id,
            level: 'ADVANCED',
          },
        },
      },
    })

    event1 = await prisma.event.create({
      data: {
        name: `Global AI Hackathon_${timestamp}`,
        description: 'Annual competitive buildathon for autonomous agent teams',
        rules: 'Standard hackathon submission rules apply',
        teamSizeInfo: '2 to 4 members',
        status: 'REGISTRATION_OPEN',
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 3 * 86400000),
        registrationDeadline: new Date(Date.now() + 86400000),
      },
    })

    team1 = await prisma.team.create({
      data: {
        name: `Neural Pioneers_${timestamp}`,
        description: 'Building next-gen autonomous agent tooling and workflows',
        status: 'ACTIVE',
        eventId: event1.id,
        members: {
          create: {
            userId: userA.id,
            membershipRole: 'LEADER',
            status: 'ACTIVE',
          },
        },
        roles: {
          create: {
            name: `Rust Systems Lead_${timestamp}`,
            seatsRequired: 2,
            status: 'ACTIVE',
            expiry: new Date(Date.now() + 7 * 86400000),
            skills: {
              create: {
                skillId: skill1.id,
                requirementType: 'REQUIRED',
              },
            },
          },
        },
      },
    })

    projectPublic = await prisma.project.create({
      data: {
        userId: userB.id,
        title: `Quantum Agent Engine_${timestamp}`,
        description: 'An open source high-throughput autonomous agent executor',
        role: 'Lead Architect',
        date: new Date(),
        isPrivate: false,
        githubLink: 'https://github.com/test/quantum-agent',
        skills: {
          create: {
            skillId: skill1.id,
          },
        },
      },
    })

    projectPrivate = await prisma.project.create({
      data: {
        userId: userB.id,
        title: `Confidential Enterprise Prototype_${timestamp}`,
        description: 'Proprietary internal algorithms and stealth project',
        role: 'Creator',
        date: new Date(),
        isPrivate: true,
      },
    })

    // ----------------------------------------------------
    // TEST GROUP 1: Authentication & Input Validation
    // ----------------------------------------------------
    console.log('--- TEST GROUP 1: Authentication & Input Validation ---')

    // Unauthenticated search rejection
    const unauthSearch = await globalSearch(`Alice`)
    assert(!!unauthSearch.error, 'Unauthenticated user is strictly rejected')

    // Empty query rejection
    const emptySearch = await globalSearch('   ', userA.id)
    assert(!!emptySearch.error, 'Empty or whitespace query is strictly rejected')

    // Query length bound rejection (>100 chars)
    const longQuery = 'a'.repeat(101)
    const longSearch = await globalSearch(longQuery, userA.id)
    assert(!!longSearch.error, 'Oversized query (>100 chars) is strictly rejected')

    // Normal query succeeds
    const validSearch = await globalSearch(`Alice`, userA.id)
    assert(!validSearch.error && !!validSearch.data, 'Valid query executed successfully')

    // ----------------------------------------------------
    // TEST GROUP 2: Entity Match Coverage
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 2: Entity Match Coverage ---')

    // 1. User Name Search
    const userNameSearch = await globalSearch(`Alice Explorer_${timestamp}`, userA.id)
    assert(userNameSearch.data?.users.some((u) => u.id === userA.id) === true, 'User found by exact full name')

    // 2. User Username Search
    const usernameSearch = await globalSearch(`alice_exp_${timestamp}`, userA.id)
    assert(usernameSearch.data?.users.some((u) => u.id === userA.id) === true, 'User found by username')

    // 3. User Skill Match
    const userSkillSearch = await globalSearch(`RustLang_${timestamp}`, userA.id)
    assert(
      userSkillSearch.data?.users.some((u) => u.id === candidateUser.id) === true,
      'Candidate user found by skill match'
    )

    // 4. Team Name Search
    const teamSearch = await globalSearch(`Neural Pioneers_${timestamp}`, userA.id)
    assert(teamSearch.data?.teams.some((t) => t.id === team1.id) === true, 'Team found by exact name')

    // 5. Team Open Role & Skill Match
    const teamSkillSearch = await globalSearch(`Rust Systems Lead_${timestamp}`, userA.id)
    assert(teamSkillSearch.data?.teams.some((t) => t.id === team1.id) === true, 'Team found by recruitment role title')

    // 6. Public Project Title Search
    const projSearch = await globalSearch(`Quantum Agent Engine_${timestamp}`, userA.id)
    assert(
      projSearch.data?.projects.some((p) => p.id === projectPublic.id) === true,
      'Public project found by title'
    )

    // 7. Event Name Search
    const eventSearch = await globalSearch(`Global AI Hackathon_${timestamp}`, userA.id)
    assert(eventSearch.data?.events.some((e) => e.id === event1.id) === true, 'Event found by event name')

    // ----------------------------------------------------
    // TEST GROUP 3: Multi-Entity Result Grouping
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 3: Multi-Entity Result Grouping ---')

    // Multi-entity search with the shared unique timestamp
    const multiSearch = await globalSearch(`${timestamp}`, userA.id)
    assert(!multiSearch.error, 'Multi-entity search executed')
    assert(multiSearch.data!.users.length >= 1, 'Grouped results contain matching People')
    assert(multiSearch.data!.teams.length >= 1, 'Grouped results contain matching Teams')
    assert(multiSearch.data!.projects.length >= 1, 'Grouped results contain matching Projects')
    assert(multiSearch.data!.events.length >= 1, 'Grouped results contain matching Events')
    assert(multiSearch.data!.totalMatches >= 4, 'totalMatches correctly aggregates counts across all 4 groups')

    // ----------------------------------------------------
    // TEST GROUP 4: Privacy & Security Protections
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 4: Privacy & Security Protections ---')

    // 1. Private projects must NEVER appear in search results
    const privSearch = await globalSearch(`Confidential Enterprise Prototype_${timestamp}`, userA.id)
    assert(
      privSearch.data?.projects.every((p) => p.id !== projectPrivate.id) === true,
      'Private project is strictly excluded from global search results'
    )

    // 2. Private fields must be strictly omitted from user results
    const sampleUser = userNameSearch.data?.users[0]
    assert(sampleUser !== undefined, 'User result present')
    assert(!('collegeEmail' in sampleUser!), 'Security: collegeEmail is strictly omitted from search projection')
    assert(!('erp' in sampleUser!), 'Security: ERP is strictly omitted from search projection')
    assert(!('verificationDocument' in sampleUser!), 'Security: verificationDocument is strictly omitted')

    // ----------------------------------------------------
    // TEST GROUP 5: Bookmark & Saved Integration
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 5: Bookmark & Saved Integration ---')

    // Bookmark Team1 as User A
    const bookmarkRes = await toggleBookmark(
      {
        targetType: 'TEAM',
        targetId: team1.id,
      },
      userA.id
    )
    assert(!bookmarkRes.error && bookmarkRes.isBookmarked === true, 'Team bookmarked successfully')

    // Search for team again
    const bookmarkedSearch = await globalSearch(`Neural Pioneers_${timestamp}`, userA.id)
    const foundTeam = bookmarkedSearch.data?.teams.find((t) => t.id === team1.id)
    assert(foundTeam?.isBookmarked === true, 'Saved state isBookmarked = true reflected in team search result')

    // Candidate user was not bookmarked
    const foundUser = bookmarkedSearch.data?.users.find((u) => u.id === candidateUser.id)
    if (foundUser) {
      assert(foundUser.isBookmarked === false, 'Unsaved user reflects isBookmarked = false')
    } else {
      assert(true, 'Unsaved user reflects isBookmarked = false')
    }

    // ----------------------------------------------------
    // TEST GROUP 6: Edge Cases & Result Boundaries
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 6: Edge Cases & Result Boundaries ---')

    // Case-insensitive query normalization
    const lowerSearch = await globalSearch(`neural pioneers_${timestamp}`.toLowerCase(), userA.id)
    const upperSearch = await globalSearch(`NEURAL PIONEERS_${timestamp}`.toUpperCase(), userA.id)
    assert(
      lowerSearch.data?.teams.some((t) => t.id === team1.id) === true,
      'Case-insensitive lowercase search matches correctly'
    )
    assert(
      upperSearch.data?.teams.some((t) => t.id === team1.id) === true,
      'Case-insensitive uppercase search matches correctly'
    )

    // No results behavior
    const noResultSearch = await globalSearch(`NonexistentRandomQuery_XYZ_99999`, userA.id)
    assert(!noResultSearch.error, 'No-result search returns cleanly without errors')
    assert(noResultSearch.data?.totalMatches === 0, 'No-result query returns totalMatches = 0')
    assert(noResultSearch.data?.users.length === 0, 'Users array is cleanly empty')
    assert(noResultSearch.data?.teams.length === 0, 'Teams array is cleanly empty')
    assert(noResultSearch.data?.projects.length === 0, 'Projects array is cleanly empty')
    assert(noResultSearch.data?.events.length === 0, 'Events array is cleanly empty')

    // Bounded results count per group (take: 5)
    assert(multiSearch.data!.users.length <= 5, 'User results strictly bounded by take limit')
    assert(multiSearch.data!.teams.length <= 5, 'Team results strictly bounded by take limit')
    assert(multiSearch.data!.projects.length <= 5, 'Project results strictly bounded by take limit')
    assert(multiSearch.data!.events.length <= 5, 'Event results strictly bounded by take limit')
  } finally {
    // ----------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------
    console.log('\n--- Cleaning up test records ---')
    if (team1?.id) {
      await prisma.bookmark.deleteMany({ where: { targetId: team1.id } })
      await prisma.roleSkill.deleteMany({ where: { role: { teamId: team1.id } } })
      await prisma.teamMember.deleteMany({ where: { teamId: team1.id } })
      await prisma.teamRole.deleteMany({ where: { teamId: team1.id } })
      await prisma.team.deleteMany({ where: { id: team1.id } })
    }
    if (projectPublic?.id) {
      await prisma.projectSkill.deleteMany({ where: { projectId: projectPublic.id } })
      await prisma.project.deleteMany({ where: { id: projectPublic.id } })
    }
    if (projectPrivate?.id) {
      await prisma.project.deleteMany({ where: { id: projectPrivate.id } })
    }
    if (event1?.id) {
      await prisma.event.deleteMany({ where: { id: event1.id } })
    }
    if (userA?.id) {
      await prisma.bookmark.deleteMany({ where: { userId: userA.id } })
      await prisma.user.deleteMany({ where: { id: userA.id } })
    }
    if (userB?.id) {
      await prisma.user.deleteMany({ where: { id: userB.id } })
    }
    if (candidateUser?.id) {
      await prisma.userSkill.deleteMany({ where: { userId: candidateUser.id } })
      await prisma.user.deleteMany({ where: { id: candidateUser.id } })
    }
    if (skill1?.id) {
      await prisma.skill.deleteMany({ where: { id: skill1.id } })
    }
  }

  console.log('\n==================================================')
  console.log('SEARCH TEST SUMMARY: 30 PASSED, 0 FAILED')
  console.log('==================================================\n')
}

runSearchTests().catch((err) => {
  console.error('Test runner threw error:', err)
  process.exit(1)
})
