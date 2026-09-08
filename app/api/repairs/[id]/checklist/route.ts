import {NextResponse} from 'next/server'
import {getSession} from '@/lib/auth'
import {prisma} from '@/lib/prisma'
import {audit} from '@/lib/audit'

const keys=['power','screen','touch','charge','cameras','audio','network','biometrics'] as const
const readState=(f:FormData,prefix:string,fallback:Record<string,string>={})=>Object.fromEntries(keys.map(k=>[k,String(f.get(`${prefix}_${k}`)||fallback[k]||'NA')]))

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const s=await getSession();if(!s)return new NextResponse('Unauthorized',{status:401})
 const {id}=await params
 const f=await req.formData()
 const current=await prisma.repair.findUnique({where:{id},select:{intakeChecklist:true}})
 let previous:any={}
 try{previous=current?.intakeChecklist?JSON.parse(current.intakeChecklist):{}}catch{}
 const intake=readState(f,'intake',previous.intake?.items||previous.items||{})
 const quality=readState(f,'quality',previous.quality?.items||{})
 const restitution=readState(f,'restitution',previous.restitution?.items||{})
 const qualityNote=String(f.get('qualityNote')||'').trim()
 const restitutionNote=String(f.get('restitutionNote')||'').trim()
 const note=String(f.get('checklistNote')||'').trim()
 const payload={version:14,updatedAt:new Date().toISOString(),by:s.name,intake:{items:intake},quality:{items:quality,note:qualityNote},restitution:{items:restitution,note:restitutionNote},note}
 await prisma.repair.update({where:{id},data:{intakeChecklist:JSON.stringify(payload),events:{create:{type:'NOTE',title:'Contrôles qualité V14 mis à jour',detail:qualityNote||restitutionNote||note||'Checklist atelier enregistrée',userId:s.id}}}})
 await audit({userId:s.id,action:'UPDATE',entity:'Repair',entityId:id,detail:'Checklist qualité / restitution V14 mise à jour'})
 return NextResponse.redirect(new URL(`/repairs/${id}?checklist=ok`,req.url),303)
}
