'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  ClipboardList, FileText, MessageSquareText, Printer, ShieldCheck, Tags, WalletCards,
  Smartphone, Wrench, Package, PenLine, CheckCircle2, History, Banknote
} from 'lucide-react'

const sectionDefs=[
  {id:'reception',label:'Réception',needle:'Réception & appareil',icon:Smartphone},
  {id:'devis',label:'Devis',needle:'Diagnostic & devis',icon:FileText},
  {id:'atelier',label:'Atelier',needle:'Travail atelier',icon:Wrench},
  {id:'pieces',label:'Pièces',needle:'Pièces utilisées',icon:Package},
  {id:'paiements',label:'Paiements',needle:'Encaissement',icon:Banknote},
  {id:'documents',label:'Documents',needle:'Accord & documents',icon:PenLine},
  {id:'restitution',label:'Restitution',needle:'Feu vert restitution',icon:CheckCircle2},
  {id:'sav',label:'SAV',needle:'SAV & garantie',icon:ShieldCheck},
  {id:'historique',label:'Historique',needle:'Historique',icon:History},
] as const

export default function RepairContextDock(){
  const pathname=usePathname()
  const match=pathname.match(/^\/repairs\/([^/]+)$/)
  const [active,setActive]=useState('reception')
  const id=match?.[1]

  const sections=useMemo(()=>sectionDefs,[pathname])

  useEffect(()=>{
    if(!id)return
    const cards=Array.from(document.querySelectorAll('.repair15 .card')) as HTMLElement[]
    const found:HTMLElement[]=[]
    for(const def of sections){
      const card=cards.find(el=>el.textContent?.includes(def.needle))
      if(card){card.id=`repair-${def.id}`;card.style.scrollMarginTop='190px';found.push(card)}
    }
    if(!found.length)return
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0]
      if(visible)setActive((visible.target as HTMLElement).id.replace('repair-',''))
    },{rootMargin:'-180px 0px -55% 0px',threshold:[0,.15,.35,.6]})
    found.forEach(el=>observer.observe(el))
    return ()=>observer.disconnect()
  },[id,sections])

  if(!id)return null

  const go=(sectionId:string)=>{
    const el=document.getElementById(`repair-${sectionId}`)
    if(el){el.scrollIntoView({behavior:'smooth',block:'start'});setActive(sectionId)}
  }

  return <div className="repair-context-dock v16-workspace-dock">
    <style>{`
      .v16-workspace-dock{position:sticky;top:68px;z-index:35;margin:0 0 14px;padding:10px 12px;background:rgba(10,10,12,.96);border:1px solid #2d2d34;border-radius:14px;box-shadow:0 10px 26px rgba(0,0,0,.18);backdrop-filter:blur(14px)}
      .v16-workspace-dock .repair-context-title{display:flex;align-items:center;gap:9px;color:#fff;margin-bottom:9px}.v16-workspace-dock .repair-context-title b{display:block;font-size:13px}.v16-workspace-dock .repair-context-title small{display:block;color:#9d9da6;font-size:11px;margin-top:2px}
      .v16-workspace-dock .dock-row{display:flex;gap:8px;align-items:center;overflow:auto;scrollbar-width:thin}.v16-workspace-dock .dock-row+ .dock-row{margin-top:8px;padding-top:8px;border-top:1px solid #24242a}
      .v16-workspace-dock a,.v16-workspace-dock button{height:38px;white-space:nowrap;border-radius:9px;border:1px solid #32323a;background:#17171b;color:#eee;display:inline-flex;align-items:center;gap:7px;padding:0 11px;font-size:12px;font-weight:800;text-decoration:none;cursor:pointer}.v16-workspace-dock a:hover,.v16-workspace-dock button:hover{border-color:#d51f2e;background:#211417;color:#fff}.v16-workspace-dock .section-btn.active{background:#d51f2e;border-color:#d51f2e;color:#fff;box-shadow:0 5px 14px rgba(213,31,46,.22)}
      .v16-workspace-dock .quick-action{background:#111114}.v16-workspace-dock .quick-action.primary{background:#d51f2e;border-color:#d51f2e;color:#fff}
      @media(max-width:800px){.v16-workspace-dock{top:0;border-radius:10px;padding:9px}.v16-workspace-dock .repair-context-title{display:none}.v16-workspace-dock a,.v16-workspace-dock button{height:36px;font-size:11px;padding:0 9px}}
    `}</style>
    <div className="repair-context-title"><ClipboardList size={18}/><div><b>Dossier atelier V16</b><small>Navigation par étapes — toutes les fonctions au même endroit</small></div></div>
    <div className="dock-row" aria-label="Sections du dossier">
      {sections.map(def=>{const Icon=def.icon;return <button type="button" key={def.id} className={`section-btn ${active===def.id?'active':''}`} onClick={()=>go(def.id)}><Icon size={15}/>{def.label}</button>})}
    </div>
    <div className="dock-row" aria-label="Actions rapides du dossier">
      <Link className="quick-action" href={`/repairs/${id}`}><ClipboardList size={15}/> Dossier</Link>
      <Link className="quick-action primary" href={`/cash/quick?repair=${id}`}><WalletCards size={15}/> Encaisser</Link>
      <Link className="quick-action" href={`/communications?repair=${id}`}><MessageSquareText size={15}/> Client</Link>
      <Link className="quick-action" href={`/warranties?repair=${id}`}><ShieldCheck size={15}/> SAV</Link>
      <Link className="quick-action" href={`/tickets/${id}`} target="_blank"><Printer size={15}/> Ticket</Link>
      <Link className="quick-action" href={`/labels/${id}`} target="_blank"><Tags size={15}/> Étiquette</Link>
      <Link className="quick-action" href="/invoices"><FileText size={15}/> Factures</Link>
    </div>
  </div>
}
