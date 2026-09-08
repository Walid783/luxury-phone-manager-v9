import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { eur,statusLabel,statusClass } from '@/lib/format'
import { TrendingUp, Users, ClipboardList, ArrowRight, CalendarDays, Search, Bell, Settings, Wrench, FileText, CreditCard, WalletCards, ShieldCheck, Package, Clock3, ReceiptText } from 'lucide-react'

function sum<T>(items:T[],pick:(v:T)=>number){return items.reduce((a,v)=>a+pick(v),0)}

export default async function Page(){
 const s=await getSession(); if(!s)redirect('/login')
 const now=new Date()
 const monthStart=new Date(now.getFullYear(),now.getMonth(),1)
 const sixStart=new Date(now.getFullYear(),now.getMonth()-5,1)
 const today=new Date(now.getFullYear(),now.getMonth(),now.getDate())
 const tomorrow=new Date(today); tomorrow.setDate(tomorrow.getDate()+1)
 const [repairs,clients,ready,active,lowStock,monthPayments,monthRows,sixRows,statuses,scheduledToday,warranties,overdue,stockCount]=await Promise.all([
  prisma.repair.findMany({take:8,orderBy:{updatedAt:'desc'},include:{client:true,payments:true,assignedTo:true}}),
  prisma.client.count(),
  prisma.repair.count({where:{status:'READY'}}),
  prisma.repair.count({where:{status:{notIn:['DELIVERED','CANCELLED']}}}),
  prisma.inventoryItem.findMany({where:{quantity:{lte:1}},take:5,orderBy:{quantity:'asc'}}),
  prisma.payment.aggregate({where:{createdAt:{gte:monthStart}},_sum:{amount:true}}),
  prisma.payment.findMany({where:{createdAt:{gte:monthStart}},select:{amount:true,method:true,createdAt:true}}),
  prisma.payment.findMany({where:{createdAt:{gte:sixStart}},select:{amount:true,createdAt:true}}),
  prisma.repair.groupBy({by:['status'],_count:{_all:true}}),
  prisma.repair.findMany({where:{promisedAt:{gte:today,lt:tomorrow},status:{notIn:['DELIVERED','CANCELLED']}},orderBy:{promisedAt:'asc'},include:{client:true,assignedTo:true}}),
  prisma.repair.count({where:{warrantyUntil:{gte:now}}}),
  prisma.repair.findMany({where:{promisedAt:{lt:now},status:{notIn:['READY','DELIVERED','CANCELLED']}},take:5,orderBy:{promisedAt:'asc'},include:{client:true}}),
  prisma.inventoryItem.count()
 ])
 const month=Number(monthPayments._sum.amount||0)
 const previousMonthStart=new Date(now.getFullYear(),now.getMonth()-1,1)
 const previousMonthRows=sixRows.filter(p=>p.createdAt>=previousMonthStart&&p.createdAt<monthStart)
 const previousMonth=sum(previousMonthRows,p=>Number(p.amount))
 const growth=previousMonth?((month-previousMonth)/previousMonth)*100:0
 const sm=Object.fromEntries(statuses.map(x=>[x.status,x._count._all]))
 const partsCost=0
 const margin=Math.max(0,month-partsCost)
 const cash=sum(monthRows.filter(p=>p.method==='CASH'),p=>Number(p.amount))
 const card=sum(monthRows.filter(p=>p.method==='CARD'),p=>Number(p.amount))
 const transfer=sum(monthRows.filter(p=>p.method==='TRANSFER'),p=>Number(p.amount))
 const due=repairs.reduce((total,r)=>total+Math.max(0,Number(r.total)-sum(r.payments,p=>Number(p.amount))),0)
 const series=Array.from({length:6},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);const next=new Date(now.getFullYear(),now.getMonth()-4+i,1);const value=sum(sixRows.filter(p=>p.createdAt>=d&&p.createdAt<next),p=>Number(p.amount));return {label:d.toLocaleDateString('fr-FR',{month:'short'}).replace('.',''),value}})
 const maxSeries=Math.max(...series.map(x=>x.value),1)
 return <AppShell>
  <div className="v14-topbar"><div className="v14-search"><Search size={17}/><span>Rechercher un client, un ticket, un appareil...</span><kbd>Ctrl + K</kbd></div><div className="v14-top-actions"><Bell size={18}/><CalendarDays size={18}/><Settings size={18}/><div className="v14-profile"><span>{s.name.slice(0,1).toUpperCase()}</span><div><b>LUXURY PHONE</b><small>Propriétaire</small></div></div></div></div>
  <div className="v14-head"><div><div className="v14-eyebrow">LUXURY PHONE · MANAGER V14</div><h1>Tableau de bord</h1><p>Vue d'ensemble de votre activité de réparation · Actualisé à {now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</p></div><div className="v14-filters"><button className="v14-filter"><CalendarDays size={15}/> {now.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</button><button className="v14-filter">7 derniers jours ▾</button></div></div>

  <div className="v14-kpis">
   <section className="v14-kpi blue"><div className="v14-kpi-icon"><TrendingUp/></div><div><small>CA DU MOIS (TTC)</small><strong>{eur(month)}</strong><em className={growth>=0?'up':'down'}>{growth>=0?'↑':'↓'} {Math.abs(growth).toFixed(1)}% <span>vs. mois précédent</span></em></div><div className="v14-mini-bars">{series.map((x,i)=><i key={i} style={{height:`${Math.max(12,(x.value/maxSeries)*52)}px`}}/>)}</div><div className="v14-kpi-foot"><span>Encaissements</span><b>{eur(month)}</b><span>Aujourd'hui</span><b>{eur(sum(monthRows.filter(p=>p.createdAt>=today),p=>Number(p.amount)))}</b></div><Link href="/invoices">Voir le détail des ventes <ArrowRight size={14}/></Link></section>
   <section className="v14-kpi green"><div className="v14-kpi-icon"><TrendingUp/></div><div><small>MARGE FACTURÉE DU MOIS (HT)</small><strong>{eur(margin)}</strong><em className="up">↑ marge opérationnelle <span>sur les ventes</span></em></div><div className="v14-ring"><b>{month?Math.round((margin/month)*100):0}%</b><span>marge</span></div><div className="v14-kpi-foot"><span>Coût des pièces</span><b>{eur(partsCost)}</b><span>Espèces</span><b>{eur(cash)}</b></div><Link href="/reports">Voir le détail financier <ArrowRight size={14}/></Link></section>
   <section className="v14-kpi purple"><div className="v14-kpi-icon"><Users/></div><div><small>CLIENTS</small><strong>{clients}</strong><em className="up">↑ activité client <span>ce mois</span></em></div><div className="v14-spark">{[20,32,27,45,38,58].map((h,i)=><i key={i} style={{height:`${h}px`}}/>)}</div><div className="v14-kpi-foot"><span>Clients actifs</span><b>{clients}</b><span>Garanties actives</span><b>{warranties}</b></div><Link href="/clients">Voir la base clients <ArrowRight size={14}/></Link></section>
   <section className="v14-kpi orange"><div className="v14-kpi-icon"><ClipboardList/></div><div><small>PRISES EN CHARGE</small><strong>{active}</strong><em className="up">↑ dossiers actifs <span>atelier</span></em></div><div className="v14-spark orange-spark">{[18,28,23,42,34,55].map((h,i)=><i key={i} style={{height:`${h}px`}}/>)}</div><div className="v14-status-pills"><span>🔵 {sm.REPAIRING||0} en cours</span><span>🟡 {sm.WAITING_PART||0} pièces</span><span>🟠 {ready} prêts</span><span>⚪ {sm.DIAGNOSTIC||0} reçus</span></div><Link href="/repairs">Voir toutes les prises en charge <ArrowRight size={14}/></Link></section>
  </div>

  <div className="v14-main-grid"><section className="card v14-chart"><div className="v14-section-head"><div><h2><TrendingUp size={18}/> CA des 6 derniers mois (TTC)</h2></div><Link href="/reports" className="v14-outline">Voir le détail du CA <ArrowRight size={14}/></Link></div><div className="v14-bars">{series.map(x=><div className="v14-bar-row" key={x.label}><b>{x.label}</b><div><i style={{width:`${(x.value/maxSeries)*100}%`}}/></div><strong>{eur(x.value)}</strong><span>{x.value?`+${Math.round((x.value/maxSeries)*20)}%`:'0%'}</span></div>)}</div></section>
   <aside className="card v14-activity"><div className="v14-section-head"><h2>Activité récente</h2><Link href="/repairs">Tout voir <ArrowRight size={13}/></Link></div>{repairs.slice(0,6).map((r,i)=><Link href={`/repairs/${r.id}`} className="v14-activity-row" key={r.id}><span className={`v14-activity-icon a${i%4}`}>{i%2?<ReceiptText size={16}/>:<ClipboardList size={16}/>}</span><div><b>Prise en charge #TKT-{String(r.ticketNo).padStart(5,'0')}</b><small>{r.deviceBrand} {r.deviceModel} · {r.client.name}</small></div><span className={`badge ${statusClass[r.status]}`}>{statusLabel[r.status]}</span></Link>)}</aside>
  </div>

  <div className="v14-quick-grid">
   <Link href="/repairs" className="v14-quick blue"><span><ClipboardList/></span><div><b>Prises en charge</b><small>Gérer les nouveaux appareils</small></div><ArrowRight/></Link>
   <Link href="/repairs" className="v14-quick purple"><span><Wrench/></span><div><b>Atelier</b><small>Suivre les réparations</small></div><ArrowRight/></Link>
   <Link href="/invoices" className="v14-quick green"><span><FileText/></span><div><b>Facturation</b><small>Créer des factures et devis</small></div><ArrowRight/></Link>
   <Link href="/cash" className="v14-quick orange"><span><WalletCards/></span><div><b>Caisse</b><small>Gestion des encaissements</small></div><ArrowRight/></Link>
   <Link href="/checklists" className="v14-quick teal"><span><ShieldCheck/></span><div><b>Qualité & Signature</b><small>Contrôles et validation client</small></div><ArrowRight/></Link>
  </div>

  <div className="v14-bottom"><div><b>Luxury Phone Manager V14</b><span>·</span><span>Votre atelier, votre performance</span></div><div><span className="online-dot"/> Système en ligne <b>{now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</b></div></div>
 </AppShell>
}
