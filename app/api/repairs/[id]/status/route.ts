import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { audit } from '@/lib/audit'
const allowed=['DIAGNOSTIC','WAITING_APPROVAL','WAITING_PART','REPAIRING','READY','DELIVERED','CANCELLED'] as const
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const s=await getSession();if(!s)return new NextResponse('Unauthorized',{status:401});const {id}=await params;const f=await req.formData();const status=String(f.get('status'));if(!allowed.includes(status as any))return new NextResponse('Invalid status',{status:400})
 const old=await prisma.repair.findUnique({where:{id}});if(!old)return new NextResponse('Not found',{status:404})
 const warrantyDays=Number(f.get('warrantyDays')||old.warrantyDays||90);const now=new Date();const warrantyUntil=status==='DELIVERED'?new Date(now.getTime()+warrantyDays*86400000):old.warrantyUntil
 const promisedRaw=String(f.get('promisedAt')||'')
 await prisma.repair.update({where:{id},data:{status:status as any,total:Number(f.get('total')||0),diagnostic:String(f.get('diagnostic')||'')||null,workDone:String(f.get('workDone')||'')||null,internalNotes:String(f.get('internalNotes')||'')||null,publicNotes:String(f.get('publicNotes')||'')||null,warrantyDays,promisedAt:promisedRaw?new Date(promisedRaw):null,deliveredAt:status==='DELIVERED'?(old.deliveredAt||now):old.deliveredAt,warrantyUntil,events:status!==old.status?{create:{type:'STATUS',title:`Statut : ${status}`,detail:String(f.get('publicNotes')||'')||null,userId:s.id}}:undefined}})
 if(status!==old.status)await audit({userId:s.id,action:'STATUS_CHANGE',entity:'Repair',entityId:id,detail:`${old.status} → ${status}`})
 return NextResponse.redirect(new URL(`/repairs/${id}`,req.url),303)
}
