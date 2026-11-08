import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.SEED_ADMIN_PASSWORD
  if (!email || !password || password.length < 16 || !email.includes('@')) {
    throw new Error('Set SEED_ADMIN_EMAIL and a unique SEED_ADMIN_PASSWORD of at least 16 characters before seeding')
  }
  const exists = await prisma.user.findUnique({where:{email}})
  if (exists) {
    console.log('Administrator already exists. No password or role was changed.')
    return
  }
  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.create({data:{name:'Administrateur',email,passwordHash,role:Role.ADMIN}})
  console.log('Administrator account created.')
}
main().finally(()=>prisma.$disconnect())
