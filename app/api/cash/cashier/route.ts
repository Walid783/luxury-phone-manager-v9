import {NextResponse} from 'next/server'
import {prisma} from '@/lib/prisma'
import {getSession} from '@/lib/auth'
import {audit} from '@/lib/audit'

export async function POST(req:Request){
 const s=await getSession()
 if(!s)return new NextResponse('Unauthorized',{status:401})
 if(s.role!=='ADMIN')return new NextResponse('Forbidden',{status:403})
 const f=await req.formData()
 const userId=String(f.get('userId')||'')
 const [cs,user]=await Promise.all([
  prisma.cashSession.findFirst({where:{status:'OPEN'}}),
  prisma.user.findFirst({where:{id:userId,active:true}})
 ])
 if(!cs||!user)return NextResponse.redirect(new URL('/cash?error=cashier',req.url),303)
 await prisma.cashSession.update({where:{id:cs.id},data:{openedById:user.id}})
 await audit({userId:s.id,action:'UPDATE',entity:'CashSession',entityId:cs.id,detail:`Opérateur de caisse changé vers ${user.name}`})
 return NextResponse.redirect(new URL('/cash?cashier=1',req.url),303)
}
