import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import {
  getTeamWorkspace,
  sendTeamMessage,
  addTeamLink,
  deleteTeamLink,
  addTeamFile,
  deleteTeamFile,
} from '../src/app/actions/workspace'

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

async function runWorkspaceTests() {
  console.log('\n==================================================')
  console.log('STARTING TEAM COLLABORATION WORKSPACE INTEGRATION TESTS')
  console.log('==================================================\n')

  const timestamp = Date.now()

  // 1. Setup College and Department
  const college = await prisma.college.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Workspace Univ',
      domain: 'work.edu',
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

  // 2. Setup Users: Leader, Active Member, Inactive Former Member, Outsider
  const leaderUser = await prisma.user.create({
    data: {
      username: `ws_leader_${timestamp}`,
      name: 'Workspace Squad Leader',
      verificationStatus: 'APPROVED',
      collegeId: college.id,
      departmentId: department.id,
      privateData: {
        create: {
          collegeEmail: `leader_${timestamp}@work.edu`,
          erp: `ERP_LEADER_${timestamp}`,
        },
      },
    },
  })

  const memberUser = await prisma.user.create({
    data: {
      username: `ws_member_${timestamp}`,
      name: 'Workspace Active Teammate',
      verificationStatus: 'APPROVED',
      collegeId: college.id,
      departmentId: department.id,
      privateData: {
        create: {
          collegeEmail: `member_${timestamp}@work.edu`,
          erp: `ERP_MEMBER_${timestamp}`,
        },
      },
    },
  })

  const formerMember = await prisma.user.create({
    data: {
      username: `ws_former_${timestamp}`,
      name: 'Former Team Member',
      verificationStatus: 'APPROVED',
      collegeId: college.id,
      departmentId: department.id,
    },
  })

  const outsiderUser = await prisma.user.create({
    data: {
      username: `ws_outsider_${timestamp}`,
      name: 'Outsider Non-Member',
      verificationStatus: 'APPROVED',
      collegeId: college.id,
      departmentId: department.id,
    },
  })

  // 3. Setup Team A and Team B (for cross-team data isolation tests)
  const teamA = await prisma.$transaction(async (tx) => {
    const t = await tx.team.create({
      data: {
        name: `HyperScale AI Squad ${timestamp}`,
        description: 'Building collaborative workspace engine',
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

    await tx.teamMember.create({
      data: {
        teamId: t.id,
        userId: memberUser.id,
        membershipRole: 'MEMBER',
        status: 'ACTIVE',
      },
    })

    await tx.teamMember.create({
      data: {
        teamId: t.id,
        userId: formerMember.id,
        membershipRole: 'MEMBER',
        status: 'LEFT',
      },
    })

    await tx.conversation.create({
      data: { teamId: t.id },
    })

    return t
  })

  const teamB = await prisma.$transaction(async (tx) => {
    const t = await tx.team.create({
      data: {
        name: `Robotics Core Team ${timestamp}`,
        description: 'Hardware controllers and robotics',
        status: 'ACTIVE',
      },
    })

    await tx.teamMember.create({
      data: {
        teamId: t.id,
        userId: outsiderUser.id,
        membershipRole: 'LEADER',
        status: 'ACTIVE',
      },
    })

    await tx.conversation.create({
      data: { teamId: t.id },
    })

    return t
  })

  // ==========================================
  // TEST GROUP 1: Access Control & Privacy
  // ==========================================
  console.log('--- TEST GROUP 1: Access Control & Privacy ---')

  // 1. Leader accesses Team A workspace
  const leaderWs = await getTeamWorkspace(teamA.id, leaderUser.id)
  assert(!!leaderWs.workspace, 'Active leader successfully accessed team workspace')
  assert(leaderWs.workspace?.team.name === teamA.name, 'Workspace team metadata matches')
  assert(leaderWs.workspace?.members.length === 2, 'Workspace contains exactly 2 active members (inactive excluded)')

  // 2. Privacy verification: private fields must not exist on member objects
  const memberObj: any = leaderWs.workspace?.members[0]
  assert(memberObj.collegeEmail === undefined, 'Private college email is strictly omitted from member roster')
  assert(memberObj.erp === undefined, 'Private ERP is strictly omitted from member roster')

  // 3. Active member accesses Team A workspace
  const memberWs = await getTeamWorkspace(teamA.id, memberUser.id)
  assert(!!memberWs.workspace, 'Active member successfully accessed team workspace')
  assert(memberWs.workspace?.currentMember.membershipRole === 'MEMBER', 'Current member role is correctly identified as MEMBER')

  // 4. Outsider attempts access to Team A workspace
  const outsiderWs = await getTeamWorkspace(teamA.id, outsiderUser.id)
  assert(!!outsiderWs.error, 'Outsider non-member strictly blocked from Team A workspace')

  // 5. Inactive former member attempts access to Team A workspace
  const formerWs = await getTeamWorkspace(teamA.id, formerMember.id)
  assert(!!formerWs.error, 'Inactive former member strictly blocked from workspace')

  // ==========================================
  // TEST GROUP 2: Conversation & Messaging
  // ==========================================
  console.log('\n--- TEST GROUP 2: Conversation & Messaging ---')

  // 1. Leader sends message
  const msg1Res = await sendTeamMessage(
    { teamId: teamA.id, content: 'Welcome to our squad workspace!' },
    leaderUser.id
  )
  assert(!!msg1Res.message, 'Leader sent chat message successfully')
  assert(msg1Res.message?.content === 'Welcome to our squad workspace!', 'Message content matches')
  assert(msg1Res.message?.sender.membershipRole === 'LEADER', 'Sender role attached as LEADER')

  // 2. Member sends message
  const msg2Res = await sendTeamMessage(
    { teamId: teamA.id, content: 'Excited to build! Setting up the repository now.' },
    memberUser.id
  )
  assert(!!msg2Res.message, 'Member sent chat message successfully')

  // 3. Outsider attempts to post message to Team A
  const badMsgRes = await sendTeamMessage(
    { teamId: teamA.id, content: 'Hacking message into team A' },
    outsiderUser.id
  )
  assert(!!badMsgRes.error, 'Outsider blocked from sending message to unauthorized team')

  // 4. Empty message rejection
  const emptyMsgRes = await sendTeamMessage(
    { teamId: teamA.id, content: '   ' },
    leaderUser.id
  )
  assert(!!emptyMsgRes.error, 'Empty message rejected safely')

  // ==========================================
  // TEST GROUP 3: Shared Team Links
  // ==========================================
  console.log('\n--- TEST GROUP 3: Shared Team Links ---')

  // 1. Member adds GitHub link
  const linkRes = await addTeamLink(
    { teamId: teamA.id, title: 'GitHub Repository', url: 'https://github.com/org/project' },
    memberUser.id
  )
  assert(!!linkRes.link, 'Member added shared GitHub repository link')
  assert(linkRes.link?.url === 'https://github.com/org/project', 'Link URL matches')

  // 2. Invalid URL rejection
  const badUrlRes = await addTeamLink(
    { teamId: teamA.id, title: 'Broken Link', url: 'not-a-valid-url-format' },
    memberUser.id
  )
  assert(!!badUrlRes.error, 'Invalid URL rejected safely')

  // 3. Outsider attempts to add link to Team A
  const badLinkRes = await addTeamLink(
    { teamId: teamA.id, title: 'Malicious Link', url: 'https://spam.com' },
    outsiderUser.id
  )
  assert(!!badLinkRes.error, 'Outsider blocked from adding link to unauthorized team')

  // 4. Outsider attempts to delete Team A link
  const badDelLink = await deleteTeamLink(
    { teamId: teamA.id, linkId: linkRes.link!.id },
    outsiderUser.id
  )
  assert(!!badDelLink.error, 'Outsider blocked from deleting team link')

  // 5. Leader deletes Team A link (leadership permission)
  const leaderDelLink = await deleteTeamLink(
    { teamId: teamA.id, linkId: linkRes.link!.id },
    leaderUser.id
  )
  assert(leaderDelLink.success === true, 'Team Leader successfully deleted shared resource link')

  // ==========================================
  // TEST GROUP 4: Shared Team Files
  // ==========================================
  console.log('\n--- TEST GROUP 4: Shared Team Files ---')

  // 1. Member adds file reference
  const fileRes = await addTeamFile(
    { teamId: teamA.id, fileName: 'system-architecture.pdf', fileUrl: 'https://drive.google.com/file/d/123' },
    memberUser.id
  )
  assert(!!fileRes.file, 'Member added shared file resource')

  // 2. File creator deletes file
  const delFileRes = await deleteTeamFile(
    { teamId: teamA.id, fileId: fileRes.file!.id },
    memberUser.id
  )
  assert(delFileRes.success === true, 'Uploader successfully deleted shared file')

  // ==========================================
  // TEST GROUP 5: Cross-Team Data Isolation
  // ==========================================
  console.log('\n--- TEST GROUP 5: Cross-Team Data Isolation ---')

  // Post message and link in Team B
  await sendTeamMessage({ teamId: teamB.id, content: 'Team B Secret Message' }, outsiderUser.id)
  await addTeamLink({ teamId: teamB.id, title: 'Team B Specs', url: 'https://specs.team-b.org' }, outsiderUser.id)

  // Re-fetch Team A workspace
  const freshTeamAWs = await getTeamWorkspace(teamA.id, leaderUser.id)
  const teamAMsgContents = freshTeamAWs.workspace?.messages.map((m) => m.content) || []
  assert(!teamAMsgContents.includes('Team B Secret Message'), 'Team A feed strictly excludes Team B messages')

  const teamALinkTitles = freshTeamAWs.workspace?.links.map((l) => l.title) || []
  assert(!teamALinkTitles.includes('Team B Specs'), 'Team A links strictly exclude Team B links')

  // ==========================================
  // TEST GROUP 6: Cleanup
  // ==========================================
  await prisma.activityLog.deleteMany({ where: { teamId: { in: [teamA.id, teamB.id] } } })
  await prisma.teamFile.deleteMany({ where: { teamId: { in: [teamA.id, teamB.id] } } })
  await prisma.teamLink.deleteMany({ where: { teamId: { in: [teamA.id, teamB.id] } } })
  await prisma.message.deleteMany({
    where: {
      conversation: { teamId: { in: [teamA.id, teamB.id] } },
    },
  })
  await prisma.conversation.deleteMany({ where: { teamId: { in: [teamA.id, teamB.id] } } })
  await prisma.teamMember.deleteMany({ where: { teamId: { in: [teamA.id, teamB.id] } } })
  await prisma.team.deleteMany({ where: { id: { in: [teamA.id, teamB.id] } } })
  await prisma.userPrivate.deleteMany({
    where: { userId: { in: [leaderUser.id, memberUser.id, formerMember.id, outsiderUser.id] } },
  })
  await prisma.user.deleteMany({
    where: { id: { in: [leaderUser.id, memberUser.id, formerMember.id, outsiderUser.id] } },
  })

  console.log('\n==================================================')
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('==================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runWorkspaceTests().catch((err) => {
  console.error('Fatal error in workspace tests:', err)
  process.exit(1)
})
