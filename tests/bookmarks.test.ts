import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import {
  toggleBookmark,
  getMyBookmarks,
  checkBookmarkStatus,
} from '../src/app/actions/bookmarks'
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

async function runBookmarksTests() {
  console.log('\n==================================================')
  console.log('STARTING BOOKMARK & SAVED ITEMS INTEGRATION TESTS')
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
      username: `bm_user_a_${timestamp}`,
      name: 'Alice Developer',
      collegeId: college.id,
      departmentId: department.id,
      year: 3,
      verificationStatus: 'APPROVED',
      bio: 'Full stack engineer',
      availability: 'AVAILABLE',
    },
  })

  const userB = await prisma.user.create({
    data: {
      username: `bm_user_b_${timestamp}`,
      name: 'Bob Designer',
      collegeId: college.id,
      departmentId: department.id,
      year: 4,
      verificationStatus: 'APPROVED',
      bio: 'UI/UX specialist',
      availability: 'LOOKING_FOR_TEAM',
    },
  })

  const userC = await prisma.user.create({
    data: {
      username: `bm_user_c_${timestamp}`,
      name: 'Charlie Candidate',
      collegeId: college.id,
      departmentId: department.id,
      year: 2,
      verificationStatus: 'PENDING',
      bio: 'Machine learning explorer',
      availability: 'AVAILABLE',
    },
  })

  // 3. Setup Team
  const team = await prisma.team.create({
    data: {
      name: `Neural Crafters ${timestamp}`,
      description: 'Building deep neural networks for computer vision',
      status: 'ACTIVE',
    },
  })

  // 4. Setup Public and Private Projects
  const publicProject = await prisma.project.create({
    data: {
      userId: userB.id,
      title: `Decentralized Exchange ${timestamp}`,
      description: 'High frequency order book on Solana',
      role: 'Lead Architect',
      isPrivate: false,
      date: new Date(),
    },
  })

  const privateProject = await prisma.project.create({
    data: {
      userId: userB.id,
      title: `Top Secret Stealth Build ${timestamp}`,
      description: 'Unannounced startup prototype',
      role: 'Founder',
      isPrivate: true,
      date: new Date(),
    },
  })

  try {
    // ----------------------------------------------------
    // TEST GROUP 1: User / Candidate Bookmarking
    // ----------------------------------------------------
    console.log('--- TEST GROUP 1: User / Candidate Bookmarking ---')

    // Check status before bookmarking
    const statusBefore = await checkBookmarkStatus(
      { targetType: 'USER', targetId: userC.id },
      userA.id
    )
    assert(!statusBefore.isBookmarked, 'Initial status: userC is not bookmarked by userA')

    // Create USER bookmark
    const toggleUserRes = await toggleBookmark(
      { targetType: 'USER', targetId: userC.id },
      userA.id
    )
    assert(!toggleUserRes.error, 'toggleBookmark for USER completed without error')
    assert(toggleUserRes.isBookmarked === true, 'USER bookmark successfully created (isBookmarked = true)')

    // Verify status after bookmarking
    const statusAfter = await checkBookmarkStatus(
      { targetType: 'USER', targetId: userC.id },
      userA.id
    )
    assert(statusAfter.isBookmarked === true, 'checkBookmarkStatus confirms userC is bookmarked by userA')

    // Toggle again to remove USER bookmark
    const toggleUserRemove = await toggleBookmark(
      { targetType: 'USER', targetId: userC.id },
      userA.id
    )
    assert(toggleUserRemove.isBookmarked === false, 'USER bookmark successfully removed upon second toggle (isBookmarked = false)')

    // Restore USER bookmark for downstream list tests
    await toggleBookmark({ targetType: 'USER', targetId: userC.id }, userA.id)

    // ----------------------------------------------------
    // TEST GROUP 2: Team Bookmarking
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 2: Team Bookmarking ---')

    const toggleTeamRes = await toggleBookmark(
      { targetType: 'TEAM', targetId: team.id },
      userA.id
    )
    assert(!toggleTeamRes.error && toggleTeamRes.isBookmarked === true, 'TEAM bookmark successfully created')

    const teamStatus = await checkBookmarkStatus(
      { targetType: 'TEAM', targetId: team.id },
      userA.id
    )
    assert(teamStatus.isBookmarked === true, 'TEAM bookmark status verified as true')

    // ----------------------------------------------------
    // TEST GROUP 3: Project Bookmarking & Privacy Barrier
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 3: Project Bookmarking & Privacy Barrier ---')

    // Bookmark public project
    const togglePublicProj = await toggleBookmark(
      { targetType: 'PROJECT', targetId: publicProject.id },
      userA.id
    )
    assert(!togglePublicProj.error && togglePublicProj.isBookmarked === true, 'Public project successfully bookmarked')

    // Attempt to bookmark someone else's private project (must fail)
    const togglePrivateProj = await toggleBookmark(
      { targetType: 'PROJECT', targetId: privateProject.id },
      userA.id
    )
    assert(!!togglePrivateProj.error, 'Bookmarking another users private project is strictly rejected')
    assert(togglePrivateProj.error === 'Cannot bookmark a private project.', 'Correct security error returned for private project')

    // Creator bookmarking their own private project is allowed
    const creatorBookmarkPrivate = await toggleBookmark(
      { targetType: 'PROJECT', targetId: privateProject.id },
      userB.id
    )
    assert(!creatorBookmarkPrivate.error && creatorBookmarkPrivate.isBookmarked === true, 'Project owner can bookmark their own private project')

    // ----------------------------------------------------
    // TEST GROUP 4: Validation & Unsupported Types
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 4: Validation & Unsupported Types ---')

    // Reject EVENT targetType
    const eventBookmark = await toggleBookmark(
      { targetType: 'EVENT' as any, targetId: '00000000-0000-0000-0000-000000000001' },
      userA.id
    )
    assert(!!eventBookmark.error, 'EVENT bookmarking is strictly rejected (out of scope)')

    // Reject invalid targetId
    const invalidIdBookmark = await toggleBookmark(
      { targetType: 'USER', targetId: 'not-a-valid-uuid' },
      userA.id
    )
    assert(!!invalidIdBookmark.error, 'Invalid UUID targetId rejected safely by Zod')

    // Reject nonexistent target
    const nonexistentBookmark = await toggleBookmark(
      { targetType: 'USER', targetId: '00000000-0000-0000-0000-000000000099' },
      userA.id
    )
    assert(!!nonexistentBookmark.error, 'Nonexistent target rejected safely')

    // ----------------------------------------------------
    // TEST GROUP 5: getMyBookmarks & Filtering
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 5: getMyBookmarks & Filtering ---')

    const allBookmarksA = await getMyBookmarks('ALL', userA.id)
    assert(!allBookmarksA.error && !!allBookmarksA.data, 'getMyBookmarks returned successfully for User A')
    assert(allBookmarksA.data?.length === 3, 'User A has exactly 3 saved items (1 User, 1 Team, 1 Project)')

    const userBookmarksA = await getMyBookmarks('USER', userA.id)
    assert(userBookmarksA.data?.length === 1, 'Filter USER returns exactly 1 item')
    assert(userBookmarksA.data?.[0].user?.name === 'Charlie Candidate', 'USER item contains correct candidate name')
    assert(userBookmarksA.data?.[0].user?.username === `bm_user_c_${timestamp}`, 'USER item contains correct username')

    const teamBookmarksA = await getMyBookmarks('TEAM', userA.id)
    assert(teamBookmarksA.data?.length === 1, 'Filter TEAM returns exactly 1 item')
    assert(teamBookmarksA.data?.[0].team?.name === `Neural Crafters ${timestamp}`, 'TEAM item contains correct team name')

    const projectBookmarksA = await getMyBookmarks('PROJECT', userA.id)
    assert(projectBookmarksA.data?.length === 1, 'Filter PROJECT returns exactly 1 item')
    assert(projectBookmarksA.data?.[0].project?.title === `Decentralized Exchange ${timestamp}`, 'PROJECT item contains correct project title')

    // ----------------------------------------------------
    // TEST GROUP 6: User Isolation & Dashboard Sync
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 6: User Isolation & Dashboard Sync ---')

    // User B bookmarks
    const allBookmarksB = await getMyBookmarks('ALL', userB.id)
    assert(allBookmarksB.data?.length === 1, 'User B has exactly 1 saved item (their private project)')
    assert(allBookmarksB.data?.[0].targetId === privateProject.id, 'User B sees only their own bookmark')

    // Unauthenticated request rejection
    const unauthBookmarks = await getMyBookmarks('ALL')
    assert(!!unauthBookmarks.error, 'Unauthenticated getMyBookmarks is strictly rejected')

    // Dashboard Saved Items count synchronization
    const dashResA = await getDashboardData(userA.id)
    assert(dashResA.data?.metrics.savedItemsCount === 3, 'Dashboard Saved Items count accurately reflects 3 bookmarks')

    // Delete one bookmark and verify dashboard count drops
    await toggleBookmark({ targetType: 'PROJECT', targetId: publicProject.id }, userA.id)
    const dashResAUpdated = await getDashboardData(userA.id)
    assert(dashResAUpdated.data?.metrics.savedItemsCount === 2, 'Dashboard Saved Items count updates to 2 after bookmark removal')

    // ----------------------------------------------------
    // TEST GROUP 7: Data Redaction & Security
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 7: Data Redaction & Security ---')

    const userPayload: any = userBookmarksA.data?.[0].user
    assert(!userPayload?.collegeEmail, 'Security: collegeEmail is strictly omitted from saved user item')
    assert(!userPayload?.erp, 'Security: ERP is strictly omitted from saved user item')
    assert(!userPayload?.verificationDocument, 'Security: verificationDocument is strictly omitted')

    // ----------------------------------------------------
    // TEST GROUP 8: Concurrent Toggle Safety
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 8: Concurrent Toggle Safety ---')

    // Execute 4 concurrent toggle calls for the same target
    const concurrentResults = await Promise.all([
      toggleBookmark({ targetType: 'USER', targetId: userB.id }, userA.id),
      toggleBookmark({ targetType: 'USER', targetId: userB.id }, userA.id),
      toggleBookmark({ targetType: 'USER', targetId: userB.id }, userA.id),
      toggleBookmark({ targetType: 'USER', targetId: userB.id }, userA.id),
    ])

    // Verify all completed without throwing unhandled exceptions
    const hadUnhandledError = concurrentResults.some((r) => r.error && !r.error.includes('bookmark'))
    assert(!hadUnhandledError, 'Concurrent toggle operations completed safely without database exceptions')

    // Verify DB state is consistent (at most 1 record exists)
    const finalCount = await prisma.bookmark.count({
      where: { userId: userA.id, targetType: 'USER', targetId: userB.id },
    })
    assert(finalCount <= 1, 'Concurrent toggle leaves at most 1 bookmark record in database')

  } finally {
    // Teardown
    console.log('\n--- Cleaning up test records ---')
    await prisma.bookmark.deleteMany({ where: { userId: { in: [userA.id, userB.id, userC.id] } } })
    await prisma.project.deleteMany({ where: { id: { in: [publicProject.id, privateProject.id] } } })
    await prisma.team.deleteMany({ where: { id: team.id } })
    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id, userC.id] } } })
  }

  console.log('\n==================================================')
  console.log(`BOOKMARK TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('==================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runBookmarksTests().catch((err) => {
  console.error('Test runner threw error:', err)
  process.exit(1)
})
