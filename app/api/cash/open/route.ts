import {NextResponse} from 'next/server'
import {prisma} from '@/lib/prisma'
import {getSession} from '@/lib/auth'
import {audit} from '@/lib/audit'

export async function POST(req:Request){
 try{
  const s=await getSession()
  if(!s)return NextResponse.redirect(new URL('/login',req.url),303)
  if(s.role!=='ADMIN')return NextResponse.redirect(new URL('/cash?error=forbidden',req.url),303)

  const dbUser=await prisma.user.findFirst({where:{OR:[{id:s.id},{email:s.email}]},select:{id:true,active:true,role:true}})
  if(!dbUser||!dbUser.active)return NextResponse.redirect(new URL('/login?error=session',req.url),303)
  if(dbUser.role!=='ADMIN')return NextResponse.redirect(new URL('/cash?error=forbidden',req.url),303)

  const open=await prisma.cashSession.findFirst({where:{status:'OPEN'},select:{id:true}})
  if(open)return NextResponse.redirect(new URL('/cash?error=open',req.url),303)

  const f=await req.formData()
  const rawAmount=Number(f.get('openingAmount')||0)
  const openingAmount=Number.isFinite(rawAmount)?Math.max(0,rawAmount):0
  const note=String(f.get('note')||'').trim()||null

  const cs=await prisma.$transaction(async tx=>{
   const session=await tx.cashSession.create({data:{openedById:dbUser.id,openingAmount,note}})
   await tx.cashMovement.create({data:{cashSessionId:session.id,type:'OPENING',amount:openingAmount,label:'Fond de caisse'}})
   return session
  })

  await audit({userId:dbUser.id,action:'CASH_OPEN',entity:'CashSession',entityId:cs.id,detail:`Ouverture ${openingAmount.toFixed(2)} €`})
  return NextResponse.redirect(new URL('/cash?opened=1',req.url),303)
 }catch(error){
  console.error('CASH_OPEN_ERROR',error)
  return NextResponse.redirect(new URL('/cash?error=open_failed',req.url),303)
 }
}
