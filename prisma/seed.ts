import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()
async function main(){
 const email='admin@luxuryphone.fr'
 const passwordHash=await bcrypt.hash('2026',12)
 await prisma.user.upsert({where:{email}, update:{}, create:{name:'Administrateur',email,passwordHash,role:Role.ADMIN}})
}
main().finally(()=>prisma.$disconnect())
