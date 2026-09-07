import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { audit } from '@/lib/audit'

const allowed=['DIAGNOSTIC','WAITING_APPROVAL','WAITING_PART','REPAIRING','READY','DELIVERED','CANCELLED'] as const

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  const s=await getSession()
  if(!s)return new NextResponse('Unauthorized',{status:401})
  const {id}=await params
  const f=await req.formData()
  const status=String(f.get('status')||'')
  if(!allowed.includes(status as any))return new NextResponse('Invalid status',{status:400})
  const old=await prisma.repair.findUnique({where:{id}})
  if(!old)return new NextResponse('Not found',{status:404})
  const now=new Date()
  const warrantyUntil=status==='DELIVERED' && !old.warrantyUntil
    ? new Date(now.getTime()+Math.max(0,old.warrantyDays)*86400000)
    : old.warrantyUntil
  await prisma.repair.update({
    where:{id},
    data:{
      status:status as any,
      deliveredAt:status==='DELIVERED'?(old.deliveredAt||now):old.deliveredAt,
      warrantyUntil,
      events:status!==old.status?{create:{type:'STATUS',title:`Statut rapide : ${status}`,detail:'Mise à jour depuis la liste atelier',userId:s.id}}:undefined
    }
  })
  if(status!==old.status)await audit({userId:s.id,action:'STATUS_CHANGE',entity:'Repair',entityId:id,detail:`${old.status} → ${status} · rapide`})
  const back=String(f.get('back')||'/repairs')
  return NextResponse.redirect(new URL(back,req.url),303)
}
