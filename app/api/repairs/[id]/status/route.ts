import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { audit } from '@/lib/audit'
const allowed=['DIAGNOSTIC','WAITING_APPROVAL','WAITING_PART','REPAIRING','READY','DELIVERED','CANCELLED'] as const
const checklistKeys=['power','screen','touch','charge','cameras','audio','network','biometrics'] as const
const allPassed=(section:any)=>checklistKeys.every(k=>section?.items?.[k]==='PASS')

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const s=await getSession();if(!s)return new NextResponse('Unauthorized',{status:401})
 const {id}=await params
 const f=await req.formData();const status=String(f.get('status'))
 if(!allowed.includes(status as any))return new NextResponse('Invalid status',{status:400})
 const old=await prisma.repair.findUnique({where:{id},include:{payments:true,invoice:true}})
 if(!old)return new NextResponse('Not found',{status:404})
 let checklist:any={}
 try{checklist=old.intakeChecklist?JSON.parse(old.intakeChecklist):{}}catch{}
 const qualityOk=allPassed(checklist.quality)
 const restitutionOk=allPassed(checklist.restitution)
 const signatureOk=Boolean(old.customerSignature&&old.signatureAt)
 const paid=old.payments.reduce((a,p)=>a+Number(p.amount),0)
 const paidOk=paid>=Number(old.total)
 const invoiceOk=Boolean(old.invoice?.paid)
 if(status==='READY'&&!qualityOk)return new NextResponse('Contrôle qualité obligatoire avant passage en Prêt',{status:409})
 if(status==='DELIVERED'){
  if(!qualityOk)return new NextResponse('Contrôle qualité non validé',{status:409})
  if(!restitutionOk)return new NextResponse('Tests de restitution non validés',{status:409})
  if(!signatureOk)return new NextResponse('Signature client obligatoire',{status:409})
  if(!paidOk||!invoiceOk)return new NextResponse('Facture et règlement complet obligatoires',{status:409})
 }
 const warrantyDays=Number(f.get('warrantyDays')||old.warrantyDays||90);const now=new Date();const warrantyUntil=status==='DELIVERED'?new Date(now.getTime()+warrantyDays*86400000):old.warrantyUntil
 const promisedRaw=String(f.get('promisedAt')||'')
 await prisma.repair.update({where:{id},data:{status:status as any,total:Number(f.get('total')||0),diagnostic:String(f.get('diagnostic')||'')||null,workDone:String(f.get('workDone')||'')||null,internalNotes:String(f.get('internalNotes')||'')||null,publicNotes:String(f.get('publicNotes')||'')||null,warrantyDays,promisedAt:promisedRaw?new Date(promisedRaw):null,deliveredAt:status==='DELIVERED'?(old.deliveredAt||now):old.deliveredAt,warrantyUntil,events:status!==old.status?{create:{type:'STATUS',title:`Statut : ${status}`,detail:String(f.get('publicNotes')||'')||null,userId:s.id}}:undefined}})
 if(status!==old.status)await audit({userId:s.id,action:'STATUS_CHANGE',entity:'Repair',entityId:id,detail:`${old.status} → ${status}`})
 return NextResponse.redirect(new URL(`/repairs/${id}`,req.url),303)
}
