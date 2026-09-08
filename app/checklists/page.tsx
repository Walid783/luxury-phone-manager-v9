import {redirect} from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import {getSession} from '@/lib/auth'
import {prisma} from '@/lib/prisma'
import {ClipboardCheck,ArrowRight} from 'lucide-react'

const tests=[['power','Allumage'],['screen','Affichage'],['touch','Tactile'],['charge','Charge'],['cameras','Caméras'],['audio','Audio'],['network','Réseau / Wi‑Fi'],['biometrics','Face ID / empreinte']] as const

export default async function ChecklistsPage(){
 const s=await getSession();if(!s)redirect('/login')
 const repairs=await prisma.repair.findMany({where:{status:{notIn:['DELIVERED','CANCELLED']}},orderBy:{updatedAt:'desc'},take:30,include:{client:true}})
 return <AppShell>
  <div className="v6-title-row"><div><div className="eyebrow">QUALITY CONTROL · V14</div><h1>Listes de contrôle atelier</h1><p>Tests réception / restitution avec traçabilité sur chaque dossier.</p></div></div>
  <div className="stack gap-top">{repairs.map(r=>{let data:any={};try{data=r.intakeChecklist?JSON.parse(r.intakeChecklist):{}}catch{};return <section className="card" key={r.id}>
   <div className="section-title"><div><h2><ClipboardCheck size={18}/> TKT-{String(r.ticketNo).padStart(5,'0')} · {r.deviceBrand} {r.deviceModel}</h2><p>{r.client.name} · {r.issue}</p></div><Link className="text-link" href={`/repairs/${r.id}`}>Ouvrir dossier <ArrowRight size={14}/></Link></div>
   <form action={`/api/repairs/${r.id}/checklist`} method="post" className="v11-grid two">
    {tests.map(([key,label])=><label key={key}>{label}<select name={key} defaultValue={data?.items?.[key]||'NA'}><option value="OK">✅ OK</option><option value="ISSUE">⚠️ Problème</option><option value="NA">⊘ Non applicable</option></select></label>)}
    <label className="span2">Note contrôle<input name="checklistNote" defaultValue={data?.note||''} placeholder="Ex. caméra arrière floue, vitre fissurée…"/></label>
    <div className="span2"><button className="btn">Enregistrer la checklist</button></div>
   </form>
  </section>})}{!repairs.length&&<div className="empty">Aucun dossier actif.</div>}</div>
 </AppShell>
}
