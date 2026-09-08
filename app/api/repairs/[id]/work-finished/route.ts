import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { audit } from '@/lib/audit'

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const s=await getSession(); if(!s)return new NextResponse('Unauthorized',{status:401})
 const {id}=await params
 const f=await req.formData(); const note=String(f.get('note')||'')||null
 const repair=await prisma.repair.findUnique({where:{id}}); if(!repair)return new NextResponse('Not found',{status:404})
 await prisma.repairEvent.create({data:{repairId:id,userId:s.id,type:'NOTE',title:'Travail terminé',detail:note}})
 await audit({userId:s.id,action:'UPDATE',entity:'Repair',entityId:id,detail:'Technicien: travail terminé'})
 return NextResponse.redirect(new URL(`/repairs/${id}?work=done`,req.url),303)
}
