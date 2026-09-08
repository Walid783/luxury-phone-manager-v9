import {NextResponse} from 'next/server'
import {getSession} from '@/lib/auth'
import {prisma} from '@/lib/prisma'
import {audit} from '@/lib/audit'

const keys=['power','screen','touch','charge','cameras','audio','network','biometrics'] as const

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const s=await getSession();if(!s)return new NextResponse('Unauthorized',{status:401})
 const {id}=await params
 const f=await req.formData()
 const checklist=Object.fromEntries(keys.map(k=>[k,String(f.get(k)||'NA')]))
 const note=String(f.get('checklistNote')||'').trim()
 await prisma.repair.update({where:{id},data:{intakeChecklist:JSON.stringify({version:14,updatedAt:new Date().toISOString(),by:s.name,items:checklist,note}),events:{create:{type:'NOTE',title:'Checklist appareil mise à jour',detail:note||'Contrôles réception / restitution enregistrés',userId:s.id}}}})
 await audit({userId:s.id,action:'UPDATE',entity:'Repair',entityId:id,detail:'Checklist V14 mise à jour'})
 return NextResponse.redirect(new URL(`/repairs/${id}?checklist=ok`,req.url),303)
}
