import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { eur, statusLabel } from '@/lib/format'
import {
  Activity, AlertTriangle, ArrowRight, Banknote, CalendarDays, CheckCircle2, ClipboardList,
  Clock3, CreditCard, Gauge, Package, Plus, ReceiptText, ShieldCheck, ShoppingCart,
  Smartphone, Sparkles, TrendingUp, Users, WalletCards, Wrench
} from 'lucide-react'

function sum<T>(items:T[], pick:(item:T)=>number){return items.reduce((a,v)=>a+pick(v),0)}

export default async function Page(){
 const s=await getSession(); if(!s) redirect('/login')
 const now=new Date()
 const today=new Date(now.getFullYear(),now.getMonth(),now.getDate())
 const tomorrow=new Date(today); tomorrow.setDate(tomorrow.getDate()+1)
 const monthStart=new Date(now.getFullYear(),now.getMonth(),1)
 const prevStart=new Date(now.getFullYear(),now.getMonth()-1,1)
 const sixStart=new Date(now.getFullYear(),now.getMonth()-5,1)

 const [recentRepairs,clients,statuses,active,ready,warranties,monthPayments,prevPayments,sixPayments,monthSales,prevSales,sixSales,lowStock,overdue,currentCash]=await Promise.all([
  prisma.repair.findMany({take:7,orderBy:{updatedAt:'desc'},include:{client:true,assignedTo:true,payments:true}}),
  prisma.client.count(),
  prisma.repair.groupBy({by:['status'],_count:{_all:true}}),
  prisma.repair.count({where:{status:{notIn:['DELIVERED','CANCELLED']}}}),
  prisma.repair.count({where:{status:'READY'}}),
  prisma.repair.count({where:{warrantyUntil:{gte:now}}}),
  prisma.payment.findMany({where:{createdAt:{gte:monthStart}},select:{amount:true,method:true,createdAt:true}}),
  prisma.payment.findMany({where:{createdAt:{gte:prevStart,lt:monthStart}},select:{amount:true}}),
  prisma.payment.findMany({where:{createdAt:{gte:sixStart}},select:{amount:true,createdAt:true}}),
  prisma.posSale.findMany({where:{createdAt:{gte:monthStart}},select:{total:true,refundedAmount:true,paymentMethod:true,createdAt:true}}),
  prisma.posSale.findMany({where:{createdAt:{gte:prevStart,lt:monthStart}},select:{total:true,refundedAmount:true}}),
  prisma.posSale.findMany({where:{createdAt:{gte:sixStart}},select:{total:true,refundedAmount:true,createdAt:true}}),
  prisma.inventoryItem.findMany({where:{quantity:{lte:1}},take:5,orderBy:{quantity:'asc'}}),
  prisma.repair.findMany({where:{promisedAt:{lt:now},status:{notIn:['READY','DELIVERED','CANCELLED']}},take:5,orderBy:{promisedAt:'asc'},include:{client:true}}),
  prisma.cashSession.findFirst({where:{status:'OPEN'},orderBy:{openedAt:'desc'},include:{openedBy:true}})
 ])

 const statusMap=Object.fromEntries(statuses.map(x=>[x.status,x._count._all])) as Record<string,number>
 const repairMonth=sum(monthPayments,p=>Number(p.amount))
 const posMonth=sum(monthSales,sale=>Number(sale.total)-Number(sale.refundedAmount))
 const monthTotal=repairMonth+posMonth
 const prevTotal=sum(prevPayments,p=>Number(p.amount))+sum(prevSales,sale=>Number(sale.total)-Number(sale.refundedAmount))
 const growth=prevTotal?((monthTotal-prevTotal)/prevTotal)*100:0
 const repairToday=sum(monthPayments.filter(p=>p.createdAt>=today),p=>Number(p.amount))
 const posToday=sum(monthSales.filter(x=>x.createdAt>=today),x=>Number(x.total)-Number(x.refundedAmount))
 const todayTotal=repairToday+posToday
 const cardToday=sum(monthPayments.filter(p=>p.createdAt>=today&&p.method==='CARD'),p=>Number(p.amount))+sum(monthSales.filter(x=>x.createdAt>=today&&x.paymentMethod==='CARD'),x=>Number(x.total)-Number(x.refundedAmount))
 const cashToday=sum(monthPayments.filter(p=>p.createdAt>=today&&p.method==='CASH'),p=>Number(p.amount))+sum(monthSales.filter(x=>x.createdAt>=today&&x.paymentMethod==='CASH'),x=>Number(x.total)-Number(x.refundedAmount))
 const avgTicket=(monthPayments.length+monthSales.length)?monthTotal/(monthPayments.length+monthSales.length):0
 const workload=Math.min(100,Math.round((active/18)*100))
 const due=recentRepairs.reduce((total,r)=>total+Math.max(0,Number(r.total)-r.payments.reduce((a,p)=>a+Number(p.amount),0)),0)
 const series=Array.from({length:6},(_,i)=>{
  const start=new Date(now.getFullYear(),now.getMonth()-5+i,1)
  const end=new Date(now.getFullYear(),now.getMonth()-4+i,1)
  const repairs=sum(sixPayments.filter(p=>p.createdAt>=start&&p.createdAt<end),p=>Number(p.amount))
  const pos=sum(sixSales.filter(x=>x.createdAt>=start&&x.createdAt<end),x=>Number(x.total)-Number(x.refundedAmount))
  return {label:start.toLocaleDateString('fr-FR',{month:'short'}).replace('.',''),value:repairs+pos}
 })
 const maxSeries=Math.max(...series.map(x=>x.value),1)
 const todayJobs=recentRepairs.filter(r=>r.promisedAt&&r.promisedAt>=today&&r.promisedAt<tomorrow).slice(0,4)

 return <AppShell>
  <div className="v15-command">
   <style>{`
    .v15-command{max-width:1500px;margin:0 auto;color:#18263b}.v15-command *{box-sizing:border-box}
    .v15-command .hero{display:flex;justify-content:space-between;gap:18px;align-items:flex-end;margin-bottom:16px}.v15-command .eyebrow{font-size:8px;font-weight:900;letter-spacing:1.6px;color:#65758b}.v15-command h1{margin:4px 0 5px;font-size:31px;letter-spacing:-1px;color:#132238}.v15-command .hero p{margin:0;font-size:10px;color:#8794a6}.v15-command .hero-actions{display:flex;gap:8px;flex-wrap:wrap}.v15-command .hero-actions .btn{height:38px;border-radius:10px;font-size:9px}.v15-command .hero-actions .btn.primary{background:#2168c9;color:#fff;border:0}.v15-command .hero-actions .btn.secondary{background:#fff;border:1px solid #dce5ef;color:#34465e}
    .v15-command .kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}.v15-command .kpi{position:relative;overflow:hidden;padding:15px;min-height:124px;border:1px solid #dfe7f0;border-radius:14px;background:#fff;box-shadow:0 7px 22px rgba(26,48,78,.045)}.v15-command .kpi:before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:#2e75d6}.v15-command .kpi.green:before{background:#18a16b}.v15-command .kpi.purple:before{background:#7654c8}.v15-command .kpi.orange:before{background:#e88720}.v15-command .kpi.slate:before{background:#52657c}.v15-command .kpi-top{display:flex;justify-content:space-between;align-items:center}.v15-command .kpi-icon{width:31px;height:31px;border-radius:9px;display:grid;place-items:center;background:#eef5ff;color:#2d73d5}.v15-command .green .kpi-icon{background:#ecfaf3;color:#159a67}.v15-command .purple .kpi-icon{background:#f2edff;color:#7654c8}.v15-command .orange .kpi-icon{background:#fff4e8;color:#df831f}.v15-command .slate .kpi-icon{background:#eef1f5;color:#52657c}.v15-command .kpi small{display:block;margin-top:10px;font-size:7px;font-weight:900;letter-spacing:.7px;color:#748297}.v15-command .kpi strong{display:block;margin-top:2px;font-size:21px;color:#17243a}.v15-command .kpi em{display:block;margin-top:2px;font-size:8px;font-style:normal;color:#8b98a8}.v15-command .positive{color:#159a67!important}.v15-command .negative{color:#d64e5c!important}
    .v15-command .main-grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(330px,.75fr);gap:10px;margin-top:10px}.v15-command .card{background:#fff;border:1px solid #dfe7f0;border-radius:14px;box-shadow:0 7px 22px rgba(26,48,78,.035);padding:15px}.v15-command .card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:13px}.v15-command .card-head h2{margin:0;font-size:13px;color:#1c2c43;display:flex;align-items:center;gap:7px}.v15-command .card-head p{margin:3px 0 0;font-size:8px;color:#8b97a7}.v15-command .card-head a{font-size:8px;font-weight:900;color:#2c72d1}.v15-command .chart{height:205px;display:flex;align-items:flex-end;gap:9px;padding:8px 3px 0}.v15-command .col{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:6px}.v15-command .bar-track{width:min(48px,100%);height:145px;background:#f1f4f8;border-radius:8px 8px 4px 4px;display:flex;align-items:flex-end;overflow:hidden}.v15-command .bar{width:100%;background:linear-gradient(180deg,#55a0f2,#236ccf);border-radius:8px 8px 4px 4px}.v15-command .col b{font-size:8px;color:#52637a}.v15-command .col span{font-size:7px;color:#8995a5;font-weight:800}
    .v15-command .split{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}.v15-command .pipeline{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}.v15-command .pipeline a{padding:11px 8px;border:1px solid #e4eaf1;border-radius:10px;background:#f9fbfd;text-align:center;color:#526175}.v15-command .pipeline a:hover{border-color:#c6d8ed;background:#f4f8fd}.v15-command .pipeline strong{display:block;font-size:20px;color:#1a2b43}.v15-command .pipeline span{display:block;margin-top:3px;font-size:7px}.v15-command .cashbox{display:grid;grid-template-columns:1fr 1fr;gap:8px}.v15-command .cashstat{padding:12px;border-radius:10px;background:#f8fafc;border:1px solid #e4eaf1}.v15-command .cashstat small{display:block;font-size:7px;color:#8190a2}.v15-command .cashstat strong{display:block;margin-top:3px;font-size:16px}.v15-command .cash-status{grid-column:1/-1;display:flex;justify-content:space-between;align-items:center;padding:10px 11px;border-radius:10px;background:${currentCash?'#eefaf4':'#fff7ed'};border:1px solid ${currentCash?'#cfeadd':'#f1dec4'};font-size:8px;color:${currentCash?'#167b58':'#9b661f'}}
    .v15-command .alerts{display:grid;gap:7px}.v15-command .alert{display:grid;grid-template-columns:30px 1fr auto;gap:8px;align-items:center;padding:9px;border:1px solid #e7edf3;border-radius:9px}.v15-command .alert-icon{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:#fff3e7;color:#df821f}.v15-command .alert b{display:block;font-size:8px;color:#2b3b52}.v15-command .alert small{display:block;margin-top:2px;font-size:7px;color:#8d99a8}.v15-command .alert strong{font-size:9px;color:#24364f}.v15-command .success{padding:12px;border-radius:9px;background:#eefaf4;color:#19795a;font-size:8px}
    .v15-command table{width:100%;border-collapse:collapse}.v15-command th{padding:9px;text-align:left;background:#f7f9fc;border-bottom:1px solid #e1e8ef;font-size:7px;letter-spacing:.5px;color:#768497}.v15-command td{padding:9px;border-bottom:1px solid #edf1f5;font-size:8px;color:#415168}.v15-command .row-link{font-weight:900;color:#246dcc}.v15-command .device{font-weight:800;color:#25364e}.v15-command .badge{font-size:7px;font-weight:900;padding:4px 6px;border-radius:999px;background:#eef5ff;color:#3479d1}.v15-command .badge.ready{background:#eaf9f1;color:#159b68}.v15-command .badge.wait{background:#fff3e5;color:#e57a1b}.v15-command .badge.repair{background:#f0ebff;color:#7352c5}
    .v15-command .quick{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:10px}.v15-command .quick a{display:flex;align-items:center;gap:8px;min-height:62px;padding:10px;border:1px solid #dfe7ef;border-radius:11px;background:#fff;color:#293a51;box-shadow:0 5px 15px rgba(26,48,78,.025)}.v15-command .quick a:hover{border-color:#c7d9ee;transform:translateY(-1px)}.v15-command .quick-icon{width:29px;height:29px;border-radius:8px;display:grid;place-items:center;background:#eef5ff;color:#2d73d5}.v15-command .quick b{font-size:8px}.v15-command .quick small{display:block;margin-top:2px;font-size:7px;color:#8a97a7}.v15-command .footer{display:flex;justify-content:space-between;padding:10px 2px;font-size:7px;color:#96a1ae}
    @media(max-width:1180px){.v15-command .kpis{grid-template-columns:repeat(3,1fr)}.v15-command .main-grid,.v15-command .split{grid-template-columns:1fr}.v15-command .quick{grid-template-columns:repeat(3,1fr)}}
    @media(max-width:720px){.v15-command .hero{align-items:flex-start;flex-direction:column}.v15-command .kpis{grid-template-columns:1fr 1fr}.v15-command .pipeline{grid-template-columns:1fr 1fr}.v15-command .quick{grid-template-columns:1fr 1fr}.v15-command h1{font-size:26px}}
    @media(max-width:480px){.v15-command .kpis,.v15-command .quick{grid-template-columns:1fr}}
   `}</style>

   <section className="hero"><div><div className="eyebrow">LUXURY PHONE · V15 COMMAND CENTER</div><h1>Tableau de bord</h1><p>Pilotage temps réel de l’atelier, de la caisse et des ventes · {now.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p></div><div className="hero-actions"><Link className="btn secondary" href="/cash/quick"><WalletCards size={15}/> Encaissement</Link><Link className="btn secondary" href="/cash/sales"><ShoppingCart size={15}/> Vente rapide</Link><Link className="btn primary" href="/repairs/new"><Plus size={15}/> Nouvelle prise en charge</Link></div></section>

   <section className="kpis">
    <div className="kpi"><div className="kpi-top"><span className="kpi-icon"><TrendingUp size={16}/></span><em className={growth>=0?'positive':'negative'}>{growth>=0?'▲':'▼'} {Math.abs(growth).toFixed(1)}%</em></div><small>CA DU MOIS</small><strong>{eur(monthTotal)}</strong><em>réparations + ventes boutique</em></div>
    <div className="kpi green"><div className="kpi-top"><span className="kpi-icon"><CreditCard size={16}/></span><em>{monthPayments.length+monthSales.length} opération(s)</em></div><small>CA AUJOURD’HUI</small><strong>{eur(todayTotal)}</strong><em>dont {eur(cardToday)} par carte</em></div>
    <div className="kpi purple"><div className="kpi-top"><span className="kpi-icon"><Wrench size={16}/></span><em>{statusMap.REPAIRING||0} en réparation</em></div><small>DOSSIERS ACTIFS</small><strong>{active}</strong><em>{ready} prêt{ready>1?'s':''} à restituer</em></div>
    <div className="kpi orange"><div className="kpi-top"><span className="kpi-icon"><Banknote size={16}/></span><em>panier moyen</em></div><small>PANIER MOYEN</small><strong>{eur(avgTicket)}</strong><em>{eur(cashToday)} espèces aujourd’hui</em></div>
    <div className="kpi slate"><div className="kpi-top"><span className="kpi-icon"><Users size={16}/></span><em>{warranties} garanties</em></div><small>CLIENTS</small><strong>{clients}</strong><em>{eur(due)} à encaisser sur dossiers récents</em></div>
   </section>

   <section className="main-grid">
    <div className="card"><div className="card-head"><div><h2><Activity size={16}/> Activité sur 6 mois</h2><p>CA encaissé réparations + ventes nettes de remboursements.</p></div><Link href="/reports">Rapports <ArrowRight size={12}/></Link></div><div className="chart">{series.map((x,i)=><div className="col" key={i}><span>{eur(x.value)}</span><div className="bar-track"><div className="bar" style={{height:`${Math.max(7,(x.value/maxSeries)*100)}%`}}/></div><b>{x.label}</b></div>)}</div></div>
    <div className="card"><div className="card-head"><div><h2><Gauge size={16}/> État atelier</h2><p>Charge indicative selon les dossiers actifs.</p></div><strong>{workload}%</strong></div><div style={{height:8,borderRadius:99,background:'#edf1f5',overflow:'hidden',marginBottom:13}}><div style={{height:'100%',width:`${workload}%`,background:'linear-gradient(90deg,#2f7dde,#6aa8ef)',borderRadius:99}}/></div><div className="pipeline">{[['DIAGNOSTIC','Diagnostic'],['WAITING_APPROVAL','Accord'],['WAITING_PART','Pièces'],['REPAIRING','Réparation'],['READY','Prêt']].map(([key,label])=><Link key={key} href={`/repairs?status=${key}`}><strong>{statusMap[key]||0}</strong><span>{label}</span></Link>)}</div></div>
   </section>

   <section className="split">
    <div className="card"><div className="card-head"><div><h2><ClipboardList size={16}/> Priorités atelier</h2><p>Derniers dossiers modifiés et montants restant à encaisser.</p></div><Link href="/repairs">Tout voir <ArrowRight size={12}/></Link></div><div style={{overflowX:'auto'}}><table><thead><tr><th>DOSSIER</th><th>CLIENT</th><th>APPAREIL</th><th>TECHNICIEN</th><th>STATUT</th><th>RESTE</th></tr></thead><tbody>{recentRepairs.map(r=>{const paid=r.payments.reduce((a,p)=>a+Number(p.amount),0);const left=Math.max(0,Number(r.total)-paid);const badge=r.status==='READY'?'ready':r.status==='REPAIRING'?'repair':['WAITING_APPROVAL','WAITING_PART'].includes(r.status)?'wait':'';return <tr key={r.id}><td><Link className="row-link" href={`/repairs/${r.id}`}>TKT-{String(r.ticketNo).padStart(5,'0')}</Link></td><td>{r.client.name}</td><td><span className="device">{r.deviceBrand} {r.deviceModel}</span></td><td>{r.assignedTo?.name||'—'}</td><td><span className={`badge ${badge}`}>{statusLabel[r.status]}</span></td><td>{eur(left)}</td></tr>})}</tbody></table></div></div>
    <div className="card"><div className="card-head"><div><h2><Banknote size={16}/> Caisse du jour</h2><p>Lecture immédiate des encaissements et de la session.</p></div><Link href="/cash">Caisse Pro <ArrowRight size={12}/></Link></div><div className="cashbox"><div className="cashstat"><small>Carte</small><strong>{eur(cardToday)}</strong></div><div className="cashstat"><small>Espèces</small><strong>{eur(cashToday)}</strong></div><div className="cashstat"><small>Ventes boutique</small><strong>{eur(posToday)}</strong></div><div className="cashstat"><small>Réparations</small><strong>{eur(repairToday)}</strong></div><div className="cash-status"><span>{currentCash?`Caisse ouverte · ${currentCash.openedBy.name}`:'Caisse actuellement fermée'}</span><strong>{currentCash?'OUVERTE':'FERMÉE'}</strong></div></div></div>
   </section>

   <section className="split">
    <div className="card"><div className="card-head"><div><h2><AlertTriangle size={16}/> Alertes prioritaires</h2><p>Retards atelier et références de stock critiques.</p></div></div><div className="alerts">{overdue.slice(0,3).map(r=><Link href={`/repairs/${r.id}`} className="alert" key={r.id}><span className="alert-icon"><Clock3 size={14}/></span><div><b>Retard · TKT-{String(r.ticketNo).padStart(5,'0')} · {r.client.name}</b><small>{r.deviceBrand} {r.deviceModel}</small></div><strong>→</strong></Link>)}{lowStock.slice(0,3).map(x=><Link href="/inventory" className="alert" key={x.id}><span className="alert-icon"><Package size={14}/></span><div><b>Stock faible · {x.name}</b><small>{x.sku} · seuil {x.minQuantity}</small></div><strong>{x.quantity}</strong></Link>)}{!overdue.length&&!lowStock.length&&<div className="success"><CheckCircle2 size={14}/> Aucun point critique actuellement.</div>}</div></div>
    <div className="card"><div className="card-head"><div><h2><CalendarDays size={16}/> Planning du jour</h2><p>{todayJobs.length} dossier(s) planifié(s).</p></div><Link href="/agenda">Agenda <ArrowRight size={12}/></Link></div><div className="alerts">{todayJobs.map(r=><Link href={`/repairs/${r.id}`} className="alert" key={r.id}><span className="alert-icon" style={{background:'#eef5ff',color:'#2e75d6'}}><Smartphone size={14}/></span><div><b>{r.deviceBrand} {r.deviceModel}</b><small>{r.client.name} · {r.promisedAt?.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</small></div><strong>{statusLabel[r.status]}</strong></Link>)}{!todayJobs.length&&<div className="success">Aucun rendez-vous atelier prévu aujourd’hui.</div>}</div></div>
   </section>

   <section className="quick">
    <Link href="/repairs/new"><span className="quick-icon"><Plus size={15}/></span><div><b>Nouvelle réparation</b><small>Créer un dossier</small></div></Link>
    <Link href="/frontdesk"><span className="quick-icon"><Sparkles size={15}/></span><div><b>Réception express</b><small>Prise en charge rapide</small></div></Link>
    <Link href="/cash/sales"><span className="quick-icon"><ShoppingCart size={15}/></span><div><b>Vente rapide</b><small>Panier boutique V15</small></div></Link>
    <Link href="/cash/quick"><span className="quick-icon"><WalletCards size={15}/></span><div><b>Encaissement</b><small>Régler un dossier</small></div></Link>
    <Link href="/cash"><span className="quick-icon"><ReceiptText size={15}/></span><div><b>Caisse Pro</b><small>Ouverture / clôture</small></div></Link>
    <Link href="/inventory"><span className="quick-icon"><Package size={15}/></span><div><b>Stock</b><small>Pièces et accessoires</small></div></Link>
   </section>

   <div className="footer"><span>Luxury Phone · V15 Pro Workshop Suite</span><span><ShieldCheck size={10}/> Données synchronisées avec PostgreSQL</span></div>
  </div>
 </AppShell>
}
