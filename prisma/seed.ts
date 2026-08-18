import 'dotenv/config'
import { PrismaClient, VerificationStatus, Availability, UserRoleEnum, SkillLevel } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Start seeding...')

  // 1. Create Colleges
  const college1 = await prisma.college.create({
    data: {
      name: 'Global Institute of Technology',
      domain: 'git.edu',
    }
  })
  
  const college2 = await prisma.college.create({
    data: {
      name: 'National University of Sciences',
      domain: 'nus.edu',
    }
  })

  // 2. Create Departments
  const deptCS = await prisma.department.create({
    data: { name: 'Computer Science', collegeId: college1.id }
  })
  const deptEE = await prisma.department.create({
    data: { name: 'Electrical Engineering', collegeId: college1.id }
  })
  const deptDesign = await prisma.department.create({
    data: { name: 'Design and Arts', collegeId: college2.id }
  })

  // 3. Create Skills
  const frontendSkill = await prisma.skill.create({ data: { name: 'Frontend Development', isCustom: false } })
  const backendSkill = await prisma.skill.create({ data: { name: 'Backend Development', isCustom: false } })
  const designSkill = await prisma.skill.create({ data: { name: 'UI/UX Design', isCustom: false } })


  // 4. Create Initial Admin
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      name: 'System Administrator',
      collegeId: college1.id,
      departmentId: deptCS.id,
      year: 4,
      verificationStatus: VerificationStatus.APPROVED,
      availability: Availability.BUSY,
      privateData: {
        create: {
          collegeEmail: 'admin@git.edu',
          erp: 'ADMIN001'
        }
      },
      roles: {
        create: {
          role: UserRoleEnum.ADMIN
        }
      }
    }
  })
  
  // Re-create relationship properly now that admin exists
  await prisma.skillRelationship.create({
    data: {
      sourceSkillId: frontendSkill.id,
      relatedSkillId: designSkill.id,
      relationshipStrength: 80,
      createdById: admin.id
    }
  })

  // 5. Create Mock Users
  await prisma.user.create({
    data: {
      username: 'johndoe',
      name: 'John Doe',
      collegeId: college1.id,
      departmentId: deptCS.id,
      year: 3,
      verificationStatus: VerificationStatus.APPROVED,
      availability: Availability.AVAILABLE,
      privateData: {
        create: {
          collegeEmail: 'john.doe@git.edu',
          erp: 'STD001'
        }
      },
      skills: {
        create: [
          { skillId: frontendSkill.id, level: SkillLevel.ADVANCED },
          { skillId: backendSkill.id, level: SkillLevel.INTERMEDIATE }
        ]
      }
    }
  })

  await prisma.user.create({
    data: {
      username: 'janesmith',
      name: 'Jane Smith',
      collegeId: college2.id,
      departmentId: deptDesign.id,
      year: 2,
      verificationStatus: VerificationStatus.APPROVED,
      availability: Availability.LOOKING_FOR_TEAM,
      privateData: {
        create: {
          collegeEmail: 'jane.smith@nus.edu',
          erp: 'STD002'
        }
      },
      skills: {
        create: [
          { skillId: designSkill.id, level: SkillLevel.ADVANCED }
        ]
      },
      interests: {
        create: [
          { skillId: frontendSkill.id }
        ]
      }
    }
  })

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
