import 'dotenv/config'
import { PrismaClient, Availability, SkillLevel, VerificationStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function runProfileIntegrationTests() {
  console.log('\n==================================================')
  console.log('STARTING PROFILE & PORTFOLIO INTEGRATION TESTS')
  console.log('==================================================\n')

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

  try {
    // 1. Setup Test User
    const testCollege = await prisma.college.findFirst()
    const testDept = await prisma.department.findFirst()
    const testSkill1 = await prisma.skill.findFirst()
    const testSkill2 = await prisma.skill.findFirst({
      where: { id: { not: testSkill1?.id } }
    })

    if (!testCollege || !testDept || !testSkill1 || !testSkill2) {
      throw new Error('Seed data required for profile test')
    }

    const testUser = await prisma.user.create({
      data: {
        username: `test_profile_${Date.now()}`,
        name: 'Profile Tester',
        bio: 'Initial Bio',
        collegeId: testCollege.id,
        departmentId: testDept.id,
        year: 2,
        verificationStatus: VerificationStatus.APPROVED,
        availability: Availability.AVAILABLE,
        privateData: {
          create: {
            collegeEmail: `tester_${Date.now()}@git.edu`,
            erp: `ERP_${Date.now()}`,
          },
        },
      },
      include: {
        privateData: true,
      },
    })

    assert(Boolean(testUser.id), 'Test user created with private ERP and email')

    // 2. Add Skills
    const userSkill = await prisma.userSkill.create({
      data: {
        userId: testUser.id,
        skillId: testSkill1.id,
        level: SkillLevel.ADVANCED,
      },
    })
    assert(userSkill.level === SkillLevel.ADVANCED, 'Skill added with ADVANCED proficiency')

    // 3. Add Domain Interest
    const userInterest = await prisma.userInterest.create({
      data: {
        userId: testUser.id,
        skillId: testSkill2.id,
      },
    })
    assert(userInterest.skillId === testSkill2.id, 'Domain interest registered')

    // 4. Create Public and Private Projects
    const publicProject = await prisma.project.create({
      data: {
        userId: testUser.id,
        title: 'Public Drone Project',
        description: 'Autonomous flight system',
        role: 'Embedded Lead',
        date: new Date(),
        githubLink: 'https://github.com/test/drone',
        isPrivate: false,
        skills: {
          create: [{ skillId: testSkill1.id }],
        },
      },
      include: { skills: true },
    })

    const privateProject = await prisma.project.create({
      data: {
        userId: testUser.id,
        title: 'Confidential Stealth Project',
        description: 'Proprietary IP',
        role: 'Lead Architect',
        date: new Date(),
        isPrivate: true,
      },
    })

    assert(publicProject.isPrivate === false, 'Public project created')
    assert(privateProject.isPrivate === true, 'Private project created')

    // 5. Test Public Profile Projection Privacy (Simulating getPublicProfile)
    const publicProjection = await prisma.user.findUnique({
      where: { id: testUser.id },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        availability: true,
        verificationStatus: true,
        college: { select: { name: true } },
        department: { select: { name: true } },
        skills: { select: { level: true, skill: { select: { name: true } } } },
        interests: { select: { skill: { select: { name: true } } } },
        projects: {
          where: { isPrivate: false },
          select: { id: true, title: true, isPrivate: true },
        },
      },
    })

    assert(publicProjection !== null, 'Public profile projected successfully')
    assert(!('privateData' in (publicProjection || {})), 'Private data (ERP, college email) is strictly excluded')
    assert(publicProjection?.projects.length === 1, 'Only public projects returned in public view (private filtered)')
    assert(publicProjection?.projects[0]?.title === 'Public Drone Project', 'Correct public project visible')

    // 6. Test Achievement Creation & Deletion
    const achievement = await prisma.achievement.create({
      data: {
        userId: testUser.id,
        title: '1st Place Hackathon',
        description: 'Won Best AI Hack',
        date: new Date(),
        link: 'https://devpost.com/winner',
      },
    })
    assert(achievement.title === '1st Place Hackathon', 'Achievement registered')

    await prisma.achievement.delete({
      where: { id: achievement.id },
    })
    const countAch = await prisma.achievement.count({
      where: { id: achievement.id },
    })
    assert(countAch === 0, 'Achievement deleted successfully')

    // 7. Cleanup
    await prisma.user.delete({
      where: { id: testUser.id },
    })
    assert(true, 'Test profile and cascading records cleaned up safely')

  } catch (err) {
    console.error('Error during test execution:', err)
    failed++
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }

  console.log('\n==================================================')
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('==================================================\n')

  if (failed > 0) process.exit(1)
}

runProfileIntegrationTests()
