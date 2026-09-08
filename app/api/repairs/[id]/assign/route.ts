import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { audit } from '@/lib/audit'

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  const s=await getSession(); if(!s)return new NextResponse('Unauthorized',{status:401})
  const {id}=await params
  const f=await req.formData()
  const assignedToId=String(f.get('assignedToId')||'')||null
  if(assignedToId){
    const tech=await prisma.user.findFirst({where:{id:assignedToId,active:true}})
    if(!tech)return new NextResponse('Technicien invalide',{status:400})
  }
  const old=await prisma.repair.findUnique({where:{id},include:{assignedTo:true}})
  if(!old)return new NextResponse('Not found',{status:404})
  const updated=await prisma.repair.update({where:{id},data:{assignedToId,events:{create:{type:'NOTE',title:'Technicien modifié',detail:assignedToId?'Dossier réassigné':'Dossier non assigné',userId:s.id}}},include:{assignedTo:true}})
  await audit({userId:s.id,action:'UPDATE',entity:'Repair',entityId:id,detail:`Technicien: ${old.assignedTo?.name||'—'} → ${updated.assignedTo?.name||'—'}`})
  return NextResponse.redirect(new URL(`/repairs/${id}`,req.url),303)
}
