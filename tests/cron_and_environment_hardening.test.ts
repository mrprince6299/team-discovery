import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import { createApplication } from '../src/app/actions/applications'
import { createInvitation } from '../src/app/actions/invitations'
import { createTeam } from '../src/app/actions/teams'
import { getTeamWorkspace } from '../src/app/actions/workspace'
import { GET, POST } from '../src/app/api/cron/expire-roles/route'
import { NextRequest } from 'next/server'

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`)
    throw new Error(`Assertion failed: ${message}`)
  }
  console.log(`  ✅ PASS: ${message}`)
}

async function runHardeningTests() {
  console.log('\n==================================================')
  console.log('STARTING ENVIRONMENT HARDENING & CRON INTEGRATION TESTS')
  console.log('==================================================\n')

  const timestamp = Date.now()
  let user1: any = null
  let user2: any = null
  let team1: any = null
  let role1: any = null

  try {
    // Fixtures
    user1 = await prisma.user.create({
      data: {
        username: `harden_u1_${timestamp}`,
        name: 'Hardening User One',
      },
    })

    user2 = await prisma.user.create({
      data: {
        username: `harden_u2_${timestamp}`,
        name: 'Hardening User Two',
      },
    })

    team1 = await prisma.team.create({
      data: {
        name: `Hardening Team_${timestamp}`,
        description: 'Team for hardening audit tests',
        status: 'ACTIVE',
        members: {
          create: {
            userId: user1.id,
            membershipRole: 'LEADER',
            status: 'ACTIVE',
          },
        },
      },
    })

    role1 = await prisma.teamRole.create({
      data: {
        teamId: team1.id,
        name: 'Backend Hardener',
        seatsRequired: 1,
        expiry: new Date(Date.now() + 86400000),
        status: 'ACTIVE',
      },
    })

    // ----------------------------------------------------
    // TEST GROUP 1: Test User Override Behavior in Development vs Production
    // ----------------------------------------------------
    console.log('--- TEST GROUP 1: Test User Override Security ---')

    // In non-production mode, test override is respected for fixture execution
    const devWorkspace = await getTeamWorkspace(team1.id, user1.id)
    assert(!devWorkspace.error && devWorkspace.workspace?.team.id === team1.id, 'Non-production test override resolves authenticated user for testing')

    // Simulate production environment
    const originalEnv = process.env.NODE_ENV
    ;(process.env as any).NODE_ENV = 'production'

    try {
      // 1. Applications test override in production
      const prodAppRes = await createApplication({
        teamId: team1.id,
        roleId: role1.id,
        userId: user2.id, // Client attempts to supply userId parameter in production
      })
      if (!prodAppRes.error) {
        console.log('prodAppRes result:', prodAppRes)
      }
      assert(
        !!prodAppRes.error,
        'Production mode strictly ignores client-supplied userId in createApplication'
      )

      // 2. Invitations test override in production
      const prodInviteRes = await createInvitation({
        teamId: team1.id,
        roleId: role1.id,
        senderId: user1.id, // Client attempts to supply senderId parameter in production
        recipientId: user2.id,
      })
      assert(
        !!prodInviteRes.error && prodInviteRes.error.toLowerCase().includes('unauthorized'),
        'Production mode strictly ignores client-supplied senderId in createInvitation'
      )

      // 3. Teams create test override in production
      const prodTeamRes = await createTeam({
        name: `Spoofed Team ${timestamp}`,
        description: 'Should fail',
        leaderUserId: user1.id, // Client attempts to supply leaderUserId in production
      })
      assert(
        !!prodTeamRes.error && prodTeamRes.error.toLowerCase().includes('unauthorized'),
        'Production mode strictly ignores client-supplied leaderUserId in createTeam'
      )

      // 4. Workspace test override in production
      const prodWorkspaceRes = await getTeamWorkspace(team1.id, user1.id)
      assert(
        !!prodWorkspaceRes.error && prodWorkspaceRes.error.toLowerCase().includes('unauthorized'),
        'Production mode strictly ignores client-supplied userId in getTeamWorkspace'
      )
    } finally {
      // Restore NODE_ENV
      ;(process.env as any).NODE_ENV = originalEnv
    }

    // ----------------------------------------------------
    // TEST GROUP 2: Production Cron Endpoint Authorization
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 2: Production Cron Endpoint Authorization ---')

    process.env.CRON_SECRET = 'test-secure-cron-secret-32-chars-long'

    // 1. Request with no authorization header
    const unauthReq = new NextRequest('http://localhost:3000/api/cron/expire-roles')
    const unauthRes = await GET(unauthReq)
    assert(unauthRes.status === 401, 'Cron endpoint rejects request with missing authorization (401)')

    // 2. Request with invalid bearer token
    const wrongTokenReq = new NextRequest('http://localhost:3000/api/cron/expire-roles', {
      headers: {
        authorization: 'Bearer invalid-wrong-token',
      },
    })
    const wrongTokenRes = await GET(wrongTokenReq)
    assert(wrongTokenRes.status === 401, 'Cron endpoint rejects request with invalid bearer token (401)')

    // 3. Request with valid bearer token
    const validBearerReq = new NextRequest('http://localhost:3000/api/cron/expire-roles', {
      headers: {
        authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    })
    const validBearerRes = await GET(validBearerReq)
    const validBearerJson = await validBearerRes.json()
    assert(validBearerRes.status === 200, 'Cron endpoint accepts request with valid Bearer token (200)')
    assert(validBearerJson.success === true, 'Cron endpoint response returns success: true')
    assert(typeof validBearerJson.expiredCount === 'number', 'Cron endpoint returns numeric expiredCount')

    // 4. Request with valid custom header (POST)
    const validPostReq = new NextRequest('http://localhost:3000/api/cron/expire-roles', {
      method: 'POST',
      headers: {
        'x-cron-secret': process.env.CRON_SECRET,
      },
    })
    const validPostRes = await POST(validPostReq)
    const validPostJson = await validPostRes.json()
    assert(validPostRes.status === 200, 'POST cron endpoint accepts request with x-cron-secret header (200)')
    assert(validPostJson.success === true, 'POST cron response returns success: true')

    // 5. Verify Idempotency on repeated execution
    const repeatedReq = new NextRequest('http://localhost:3000/api/cron/expire-roles', {
      headers: {
        authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    })
    const repeatedRes = await GET(repeatedReq)
    const repeatedJson = await repeatedRes.json()
    assert(repeatedRes.status === 200, 'Repeated cron invocation executes cleanly')
    assert(repeatedJson.success === true, 'Repeated cron invocation is idempotent')

  } finally {
    console.log('\n--- Cleaning up test records ---')
    if (role1) {
      await prisma.roleSkill.deleteMany({ where: { roleId: role1.id } })
      await prisma.teamRole.deleteMany({ where: { id: role1.id } })
    }
    if (team1) {
      await prisma.teamMember.deleteMany({ where: { teamId: team1.id } })
      await prisma.team.deleteMany({ where: { id: team1.id } })
    }
    if (user1) await prisma.user.deleteMany({ where: { id: user1.id } })
    if (user2) await prisma.user.deleteMany({ where: { id: user2.id } })
  }

  console.log('\n==================================================')
  console.log('HARDENING & CRON TESTS COMPLETE: ALL PASSED')
  console.log('==================================================\n')
}

runHardeningTests().catch((err) => {
  console.error('Test runner threw error:', err)
  process.exit(1)
})
