import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { eur,statusLabel,statusClass,dateOnlyFr } from '@/lib/format'
import { ClipboardList,CheckCircle2,TrendingUp,ShieldCheck,Activity,CalendarDays,Users,WalletCards,Plus,ArrowRight,Clock3,Package,AlertTriangle,Euro,TimerReset,Gauge,ReceiptText,Sparkles,UserCheck } from 'lucide-react'

export default async function Page(){
 const s=await getSession(); if(!s)redirect('/login')
 const now=new Date(), start=new Date(now.getFullYear(),now.getMonth(),1), today=new Date(now.getFullYear(),now.getMonth(),now.getDate()), tomorrow=new Date(today); tomorrow.setDate(tomorrow.getDate()+1)
 const [repairs,clients,stockCount,ready,active,lowStock,monthPayments,todayPayments,warranties,overdue,statuses,scheduledToday,openRepairs,allPayments]=await Promise.all([
  prisma.repair.findMany({take:8,orderBy:{updatedAt:'desc'},include:{client:true,payments:true,assignedTo:true}}),
  prisma.client.count(), prisma.inventoryItem.count(), prisma.repair.count({where:{status:'READY'}}),
  prisma.repair.count({where:{status:{notIn:['DELIVERED','CANCELLED']}}}),
  prisma.inventoryItem.findMany({where:{quantity:{lte:1}},take:5,orderBy:{quantity:'asc'}}),
  prisma.payment.aggregate({where:{createdAt:{gte:start}},_sum:{amount:true}}),
  prisma.payment.aggregate({where:{createdAt:{gte:today}},_sum:{amount:true}}),
  prisma.repair.count({where:{warrantyUntil:{gte:now}}}),
  prisma.repair.findMany({where:{promisedAt:{lt:now},status:{notIn:['READY','DELIVERED','CANCELLED']}},take:5,orderBy:{promisedAt:'asc'},include:{client:true}}),
  prisma.repair.groupBy({by:['status'],_count:{_all:true}}),
  prisma.repair.findMany({where:{promisedAt:{gte:today,lt:tomorrow},status:{notIn:['DELIVERED','CANCELLED']}},orderBy:{promisedAt:'asc'},include:{client:true,assignedTo:true}}),
  prisma.repair.findMany({where:{status:{notIn:['DELIVERED','CANCELLED']}},include:{payments:true}}),
  prisma.payment.findMany({where:{createdAt:{gte:start}},select:{amount:true}})
 ])
 const month=Number(monthPayments._sum.amount||0), day=Number(todayPayments._sum.amount||0), sm=Object.fromEntries(statuses.map(x=>[x.status,x._count._all]))
 const due=openRepairs.reduce((sum,r)=>sum+Math.max(0,Number(r.total)-r.payments.reduce((a,p)=>a+Number(p.amount),0)),0)
 const avgTicket=allPayments.length?allPayments.reduce((a,p)=>a+Number(p.amount),0)/allPayments.length:0
 const load=Math.min(100,Math.round((active/18)*100))
 return <AppShell>
  <div className="v8-dash-head"><div><div className="eyebrow">COMPLETE WORKSHOP COMMAND CENTER · V13</div><h1>Bonjour {s.name}</h1><p>Vue opérationnelle de l’atelier, de la caisse et des engagements clients.</p></div><div className="v8-head-actions"><Link className="btn secondary" href="/frontdesk"><Sparkles size={16}/> Réception express</Link><Link className="btn" href="/repairs/new"><Plus size={17}/> Nouvelle prise en charge</Link></div></div>

  <div className="v8-kpi-grid">
   <div className="card v8-kpi"><span><ClipboardList/></span><div><small>Dossiers actifs</small><strong>{active}</strong><em>{sm.REPAIRING||0} en réparation</em></div></div>
   <div className="card v8-kpi"><span><CheckCircle2/></span><div><small>Prêts à restituer</small><strong>{ready}</strong><em>À prévenir / remettre</em></div></div>
   <div className="card v8-kpi"><span><TrendingUp/></span><div><small>CA encaissé ce mois</small><strong>{eur(month)}</strong><em>{eur(day)} aujourd’hui</em></div></div>
   <div className="card v8-kpi"><span><Euro/></span><div><small>Reste à encaisser</small><strong>{eur(due)}</strong><em>Sur dossiers ouverts</em></div></div>
   <div className="card v8-kpi"><span><ShieldCheck/></span><div><small>Garanties actives</small><strong>{warranties}</strong><em>{clients} clients</em></div></div>
   <div className="card v8-kpi"><span><ReceiptText/></span><div><small>Panier moyen</small><strong>{eur(avgTicket)}</strong><em>Encaissements du mois</em></div></div>
  </div>

  <div className="v8-control-row">
   <section className="card v8-workload"><div className="section-title"><div><h2><Gauge size={18}/> Charge atelier</h2><p>Capacité indicative selon les dossiers actifs.</p></div><b>{load}%</b></div><div className="v8-progress"><i style={{width:`${load}%`}}/></div><div className="v8-load-meta"><span><b>{sm.DIAGNOSTIC||0}</b> diagnostic</span><span><b>{sm.WAITING_APPROVAL||0}</b> attente accord</span><span><b>{sm.WAITING_PART||0}</b> attente pièces</span><span><b>{sm.REPAIRING||0}</b> réparation</span></div></section>
   <section className="card v8-today"><div className="section-title"><div><h2><CalendarDays size={18}/> Planning du jour</h2><p>{scheduledToday.length} dossier(s) planifié(s)</p></div><Link className="text-link" href="/agenda">Agenda <ArrowRight size={14}/></Link></div>{scheduledToday.length?<div className="v8-timeline">{scheduledToday.slice(0,4).map(r=><Link href={`/repairs/${r.id}`} key={r.id}><time>{r.promisedAt?.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</time><div><b>{r.deviceBrand} {r.deviceModel}</b><small>{r.client.name} · {r.assignedTo?.name||'Non assigné'}</small></div><span className={`badge ${statusClass[r.status]}`}>{statusLabel[r.status]}</span></Link>)}</div>:<div className="success-box">Aucun dossier planifié aujourd’hui.</div>}</section>
  </div>

  <div className="v8-pipeline">{[
   ['DIAGNOSTIC','Diagnostic',Activity],['WAITING_APPROVAL','Attente accord',Clock3],['WAITING_PART','Attente pièces',Package],['REPAIRING','En réparation',ClipboardList],['READY','Prêt à restituer',CheckCircle2]
  ].map(([key,label,Icon]:any)=><Link href={`/repairs?status=${key}`} key={key}><Icon size={17}/><b>{sm[key]||0}</b><span>{label}</span></Link>)}</div>

  <div className="dash-cols v8-main-grid"><section className="card"><div className="section-title"><div><h2>Priorités atelier</h2><p>Dossiers récemment modifiés</p></div><Link className="text-link" href="/repairs">Tout voir <ArrowRight size={15}/></Link></div><div className="table-wrap"><table><thead><tr><th>Dossier</th><th>Client</th><th>Appareil</th><th>Technicien</th><th>Statut</th><th>Reste dû</th></tr></thead><tbody>{repairs.map(r=>{const paid=r.payments.reduce((a,p)=>a+Number(p.amount),0);return <tr key={r.id}><td><Link className="row-link" href={`/repairs/${r.id}`}>TKT-{String(r.ticketNo).padStart(5,'0')}</Link></td><td>{r.client.name}</td><td>{r.deviceBrand} {r.deviceModel}</td><td>{r.assignedTo?.name||'—'}</td><td><span className={`badge ${statusClass[r.status]}`}>{statusLabel[r.status]}</span></td><td>{eur(Math.max(0,Number(r.total)-paid))}</td></tr>})}</tbody></table></div>{!repairs.length&&<div className="empty">Aucune réparation pour le moment.</div>}</section>
   <aside className="stack"><div className="card alert-card"><div className="section-title"><div><h2><TimerReset size={18}/> Retards à traiter</h2><p>{overdue.length} dossier(s) prioritaire(s)</p></div></div>{overdue.length?<div className="alert-list">{overdue.map(r=><Link href={`/repairs/${r.id}`} key={r.id} className="alert-row"><span className="stock-icon"><Clock3 size={17}/></span><div><b>TKT-{String(r.ticketNo).padStart(5,'0')} · {r.client.name}</b><small>{r.deviceBrand} {r.deviceModel} · promis {r.promisedAt?dateOnlyFr(r.promisedAt):''}</small></div><strong>→</strong></Link>)}</div>:<div className="success-box">Aucun retard atelier.</div>}</div>
   <div className="card alert-card"><div className="section-title"><div><h2><AlertTriangle size={18}/> Stock à surveiller</h2><p>{stockCount} références</p></div></div>{lowStock.length?<div className="alert-list">{lowStock.map(i=><div key={i.id} className="alert-row"><span className="stock-icon"><Package size={17}/></span><div><b>{i.name}</b><small>{i.sku} · seuil {i.minQuantity}</small></div><strong>{i.quantity}</strong></div>)}</div>:<div className="success-box">Aucune alerte critique.</div>}<Link className="btn secondary wide" href="/inventory">Gérer le stock</Link></div></aside>
  </div>
 </AppShell>
}
