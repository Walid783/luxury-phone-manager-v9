import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { eur, statusLabel } from '@/lib/format'
import {
  Activity, AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, ClipboardList,
  Clock3, CreditCard, Package, Plus, ReceiptText, ShieldCheck, ShoppingCart,
  Smartphone, Sparkles, TrendingUp, Users, WalletCards, Wrench, Banknote,
  BarChart3, CircleDollarSign, ScanLine, Box, ChevronRight
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
  prisma.repair.findMany({take:8,orderBy:{updatedAt:'desc'},include:{client:true,assignedTo:true,payments:true}}),
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
 const atelierStages=[
  ['DIAGNOSTIC','Diagnostic',statusMap.DIAGNOSTIC||0,'#3b82f6'],
  ['WAITING_APPROVAL','Attente accord',statusMap.WAITING_APPROVAL||0,'#f59e0b'],
  ['WAITING_PART','Attente pièce',statusMap.WAITING_PART||0,'#f97316'],
  ['REPAIRING','En réparation',statusMap.REPAIRING||0,'#8b5cf6'],
  ['READY','Prêt',statusMap.READY||0,'#10b981']
 ] as const

 return <AppShell>
  <div className="dash15">
   <style>{`
    .dash15{max-width:1540px;margin:0 auto;color:#142033}.dash15 *{box-sizing:border-box}
    .dash15 .hero{position:relative;overflow:hidden;border-radius:22px;padding:26px 28px;background:linear-gradient(120deg,#0e1b2d 0%,#132641 54%,#1e3a62 100%);color:#fff;box-shadow:0 18px 50px rgba(15,32,55,.18);margin-bottom:16px}.dash15 .hero:after{content:'';position:absolute;right:-80px;top:-120px;width:330px;height:330px;border-radius:50%;background:radial-gradient(circle,#4f9cf733,transparent 68%)}.dash15 .hero-top{position:relative;z-index:1;display:flex;justify-content:space-between;gap:24px;align-items:center}.dash15 .hero-copy{max-width:760px}.dash15 .eyebrow{font-size:9px;letter-spacing:1.8px;font-weight:900;color:#8fb7e8;text-transform:uppercase}.dash15 h1{margin:7px 0 8px;font-size:38px;line-height:1;letter-spacing:-1.3px}.dash15 .hero p{margin:0;color:#b9c8db;font-size:11px;line-height:1.6}.dash15 .hero-actions{display:flex;gap:9px;flex-wrap:wrap}.dash15 .hero-btn{height:42px;border-radius:12px;padding:0 15px;display:inline-flex;align-items:center;gap:7px;font-size:10px;font-weight:800;border:1px solid #ffffff24;color:#eaf2fb;background:#ffffff10;backdrop-filter:blur(8px)}.dash15 .hero-btn.primary{background:#f4b63d;color:#172235;border-color:#f4b63d}.dash15 .hero-strip{position:relative;z-index:1;margin-top:22px;display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.dash15 .hero-stat{padding:12px 14px;border-radius:13px;background:#ffffff0f;border:1px solid #ffffff14}.dash15 .hero-stat small{display:block;font-size:8px;color:#9eb1c9}.dash15 .hero-stat strong{display:block;margin-top:4px;font-size:17px;color:#fff}.dash15 .hero-stat em{display:block;margin-top:2px;font-style:normal;font-size:8px;color:#9fd6ba}
    .dash15 .kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:11px}.dash15 .kpi{background:#fff;border:1px solid #e4e9f0;border-radius:16px;padding:15px;box-shadow:0 7px 22px rgba(25,45,70,.04)}.dash15 .kpi-head{display:flex;justify-content:space-between;align-items:center}.dash15 .kpi-icon{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:#edf5ff;color:#2c73d5}.dash15 .kpi:nth-child(2) .kpi-icon{background:#edf9f4;color:#159b68}.dash15 .kpi:nth-child(3) .kpi-icon{background:#f4efff;color:#7654c8}.dash15 .kpi:nth-child(4) .kpi-icon{background:#fff4e7;color:#dd831f}.dash15 .kpi:nth-child(5) .kpi-icon{background:#eff2f6;color:#53677f}.dash15 .trend{font-size:8px;font-weight:900;padding:4px 7px;border-radius:999px;background:#edf9f4;color:#159b68}.dash15 .trend.down{background:#fff0f1;color:#d24c5c}.dash15 .kpi small{display:block;margin-top:12px;font-size:8px;font-weight:900;letter-spacing:.55px;color:#7d8999}.dash15 .kpi strong{display:block;margin-top:3px;font-size:23px;letter-spacing:-.4px}.dash15 .kpi em{display:block;margin-top:3px;font-style:normal;font-size:8px;color:#8c97a6}
    .dash15 .grid{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(330px,.8fr);gap:11px;margin-top:11px}.dash15 .card{background:#fff;border:1px solid #e3e9f0;border-radius:16px;padding:16px;box-shadow:0 7px 22px rgba(25,45,70,.035)}.dash15 .card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}.dash15 .card-head h2{margin:0;font-size:15px;display:flex;align-items:center;gap:7px}.dash15 .card-head p{margin:4px 0 0;font-size:8px;color:#8a95a5}.dash15 .card-link{font-size:8px;font-weight:900;color:#2c72d1;display:flex;align-items:center;gap:4px}
    .dash15 .chart{height:240px;display:flex;align-items:flex-end;gap:14px;padding:12px 6px 2px}.dash15 .chart-col{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:7px}.dash15 .bar-track{width:min(56px,100%);height:170px;border-radius:12px 12px 5px 5px;background:#f1f4f8;display:flex;align-items:flex-end;overflow:hidden}.dash15 .bar{width:100%;border-radius:12px 12px 5px 5px;background:linear-gradient(180deg,#67aaf8,#276fcf)}.dash15 .chart-col b{font-size:8px;color:#59687a}.dash15 .chart-col span{font-size:8px;color:#8692a2;font-weight:800}
    .dash15 .atelier{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.dash15 .stage{padding:11px 8px;border-radius:12px;border:1px solid #e4eaf1;background:#fafbfd;text-align:center}.dash15 .stage i{display:block;width:8px;height:8px;border-radius:50%;margin:0 auto 8px}.dash15 .stage strong{display:block;font-size:22px}.dash15 .stage span{display:block;margin-top:3px;font-size:7px;color:#7f8b9b}
    .dash15 .alerts{display:grid;gap:8px}.dash15 .alert{display:grid;grid-template-columns:34px 1fr auto;gap:9px;align-items:center;padding:10px;border:1px solid #e6ebf1;border-radius:11px;background:#fbfcfe}.dash15 .alert-icon{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:#fff3e6;color:#df8120}.dash15 .alert b{display:block;font-size:8px}.dash15 .alert small{display:block;margin-top:2px;font-size:7px;color:#8b96a5}.dash15 .alert strong{font-size:9px}.dash15 .ok{padding:13px;border-radius:11px;background:#edf9f4;border:1px solid #d4eddf;color:#18795a;font-size:8px}
    .dash15 .lower{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(320px,.65fr);gap:11px;margin-top:11px}.dash15 table{width:100%;border-collapse:collapse}.dash15 th{padding:10px;background:#f7f9fc;border-bottom:1px solid #e3e9ef;text-align:left;font-size:7px;letter-spacing:.5px;color:#7a8797}.dash15 td{padding:10px;border-bottom:1px solid #edf1f5;font-size:8px;color:#415166}.dash15 .row-link{font-weight:900;color:#246dcc}.dash15 .device{font-weight:800;color:#27384f}.dash15 .badge{font-size:7px;font-weight:900;padding:4px 7px;border-radius:999px;background:#eef5ff;color:#3479d1}.dash15 .badge.ready{background:#eaf9f1;color:#159b68}.dash15 .badge.wait{background:#fff3e5;color:#e57a1b}.dash15 .badge.repair{background:#f0ebff;color:#7352c5}
    .dash15 .quick{display:grid;grid-template-columns:1fr 1fr;gap:8px}.dash15 .quick a{min-height:82px;padding:12px;border-radius:13px;border:1px solid #e3e9f0;background:#fbfcfe;color:#24364e;display:flex;flex-direction:column;justify-content:space-between}.dash15 .quick a:hover{background:#f6f9fd;border-color:#cbd9e9}.dash15 .quick-icon{width:33px;height:33px;border-radius:10px;display:grid;place-items:center;background:#edf5ff;color:#2c73d5}.dash15 .quick b{font-size:9px}.dash15 .quick small{font-size:7px;color:#8a95a4}.dash15 .cash-card{margin-top:8px;padding:12px;border-radius:12px;background:${currentCash?'#edf9f4':'#fff7ed'};border:1px solid ${currentCash?'#d4ecdf':'#f1dfc5'};display:flex;justify-content:space-between;align-items:center}.dash15 .cash-card b{font-size:8px;color:${currentCash?'#18795a':'#95611d'}}.dash15 .cash-card small{display:block;margin-top:2px;font-size:7px;color:#8190a0}
    @media(max-width:1200px){.dash15 .kpis{grid-template-columns:repeat(3,1fr)}.dash15 .grid,.dash15 .lower{grid-template-columns:1fr}.dash15 .hero-strip{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:760px){.dash15 .hero-top{align-items:flex-start;flex-direction:column}.dash15 h1{font-size:31px}.dash15 .kpis{grid-template-columns:1fr 1fr}.dash15 .atelier{grid-template-columns:1fr 1fr}.dash15 .hero-strip{grid-template-columns:1fr 1fr}}
    @media(max-width:500px){.dash15 .kpis,.dash15 .quick,.dash15 .hero-strip{grid-template-columns:1fr}.dash15 .hero{padding:20px}.dash15 .atelier{grid-template-columns:1fr}}
   `}</style>

   <section className="hero">
    <div className="hero-top">
     <div className="hero-copy"><div className="eyebrow">Luxury Phone · V15 Premium Command Center</div><h1>Bonjour {s.name}</h1><p>Une vue claire et rapide de l’atelier, de la caisse, des ventes et des priorités du jour.</p></div>
     <div className="hero-actions"><Link className="hero-btn" href="/cash/quick"><WalletCards size={16}/> Encaissement</Link><Link className="hero-btn" href="/cash/sales"><ShoppingCart size={16}/> Vente rapide</Link><Link className="hero-btn primary" href="/repairs/new"><Plus size={16}/> Nouvelle prise en charge</Link></div>
    </div>
    <div className="hero-strip">
     <div className="hero-stat"><small>Aujourd’hui</small><strong>{eur(todayTotal)}</strong><em>{monthPayments.filter(p=>p.createdAt>=today).length+monthSales.filter(x=>x.createdAt>=today).length} opération(s)</em></div>
     <div className="hero-stat"><small>Carte aujourd’hui</small><strong>{eur(cardToday)}</strong><em>CB / TPE</em></div>
     <div className="hero-stat"><small>Espèces aujourd’hui</small><strong>{eur(cashToday)}</strong><em>Tiroir caisse</em></div>
     <div className="hero-stat"><small>Reste dû récent</small><strong>{eur(due)}</strong><em>Dossiers à encaisser</em></div>
    </div>
   </section>

   <section className="kpis">
    <div className="kpi"><div className="kpi-head"><span className="kpi-icon"><TrendingUp size={17}/></span><span className={`trend ${growth<0?'down':''}`}>{growth>=0?'▲':'▼'} {Math.abs(growth).toFixed(1)}%</span></div><small>CA DU MOIS</small><strong>{eur(monthTotal)}</strong><em>Réparations + ventes boutique</em></div>
    <div className="kpi"><div className="kpi-head"><span className="kpi-icon"><Wrench size={17}/></span></div><small>DOSSIERS ACTIFS</small><strong>{active}</strong><em>{ready} prêt{ready>1?'s':''} à restituer</em></div>
    <div className="kpi"><div className="kpi-head"><span className="kpi-icon"><CircleDollarSign size={17}/></span></div><small>PANIER MOYEN</small><strong>{eur(avgTicket)}</strong><em>Sur le mois en cours</em></div>
    <div className="kpi"><div className="kpi-head"><span className="kpi-icon"><Users size={17}/></span></div><small>CLIENTS</small><strong>{clients}</strong><em>{warranties} garantie(s) active(s)</em></div>
    <div className="kpi"><div className="kpi-head"><span className="kpi-icon"><Banknote size={17}/></span></div><small>CAISSE</small><strong>{currentCash?'Ouverte':'Fermée'}</strong><em>{currentCash?`Opérateur : ${currentCash.openedBy.name}`:'Aucune session active'}</em></div>
   </section>

   <section className="grid">
    <div className="card"><div className="card-head"><div><h2><BarChart3 size={17}/> Chiffre d’affaires sur 6 mois</h2><p>Réparations et ventes boutique, après remboursements.</p></div><Link className="card-link" href="/reports">Voir les rapports <ArrowRight size={12}/></Link></div><div className="chart">{series.map(x=><div className="chart-col" key={x.label}><b>{eur(x.value)}</b><div className="bar-track"><div className="bar" style={{height:`${Math.max(8,(x.value/maxSeries)*100)}%`}}/></div><span>{x.label}</span></div>)}</div></div>
    <div className="card"><div className="card-head"><div><h2><AlertTriangle size={17}/> Alertes prioritaires</h2><p>Ce qui demande ton attention maintenant.</p></div></div><div className="alerts">{overdue.map(r=><Link className="alert" href={`/repairs/${r.id}`} key={r.id}><span className="alert-icon"><Clock3 size={16}/></span><div><b>TKT-{String(r.ticketNo).padStart(5,'0')} · {r.client.name}</b><small>{r.deviceBrand} {r.deviceModel} · dossier en retard</small></div><ChevronRight size={15}/></Link>)}{lowStock.map(i=><Link className="alert" href="/inventory" key={i.id}><span className="alert-icon"><Package size={16}/></span><div><b>{i.name}</b><small>{i.sku} · stock faible</small></div><strong>{i.quantity}</strong></Link>)}{!overdue.length&&!lowStock.length&&<div className="ok"><CheckCircle2 size={14}/> Aucun point critique pour le moment.</div>}</div></div>
   </section>

   <section className="card" style={{marginTop:11}}><div className="card-head"><div><h2><Activity size={17}/> Flux atelier</h2><p>Vue instantanée des dossiers par étape.</p></div><Link className="card-link" href="/repairs">Ouvrir l’atelier <ArrowRight size={12}/></Link></div><div className="atelier">{atelierStages.map(([key,label,value,color])=><Link href={`/repairs?status=${key}`} className="stage" key={key}><i style={{background:color}}/><strong>{value}</strong><span>{label}</span></Link>)}</div></section>

   <section className="lower">
    <div className="card"><div className="card-head"><div><h2><ClipboardList size={17}/> Dernières prises en charge</h2><p>Les dossiers récemment modifiés.</p></div><Link className="card-link" href="/repairs">Tout voir <ArrowRight size={12}/></Link></div><div style={{overflowX:'auto'}}><table><thead><tr><th>Dossier</th><th>Client</th><th>Appareil</th><th>Technicien</th><th>Statut</th></tr></thead><tbody>{recentRepairs.map(r=><tr key={r.id}><td><Link className="row-link" href={`/repairs/${r.id}`}>TKT-{String(r.ticketNo).padStart(5,'0')}</Link></td><td>{r.client.name}</td><td className="device">{r.deviceBrand} {r.deviceModel}</td><td>{r.assignedTo?.name||'—'}</td><td><span className={`badge ${r.status==='READY'?'ready':r.status==='REPAIRING'?'repair':r.status.startsWith('WAITING')?'wait':''}`}>{statusLabel[r.status]}</span></td></tr>)}</tbody></table></div></div>
    <div className="card"><div className="card-head"><div><h2><Sparkles size={17}/> Actions rapides</h2><p>Les fonctions les plus utilisées.</p></div></div><div className="quick"><Link href="/repairs/new"><span className="quick-icon"><Smartphone size={16}/></span><div><b>Nouvelle réparation</b><small>Créer un dossier</small></div></Link><Link href="/cash/sales"><span className="quick-icon"><ShoppingCart size={16}/></span><div><b>Vente boutique</b><small>POS V15</small></div></Link><Link href="/cash/quick"><span className="quick-icon"><CreditCard size={16}/></span><div><b>Encaissement</b><small>Régler un dossier</small></div></Link><Link href="/inventory"><span className="quick-icon"><Box size={16}/></span><div><b>Stock</b><small>Voir les références</small></div></Link><Link href="/cash"><span className="quick-icon"><ReceiptText size={16}/></span><div><b>Caisse Pro</b><small>Session et clôture</small></div></Link><Link href="/frontdesk"><span className="quick-icon"><ScanLine size={16}/></span><div><b>Réception express</b><small>Prise en charge rapide</small></div></Link></div><div className="cash-card"><div><b>{currentCash?'Caisse ouverte':'Caisse fermée'}</b><small>{currentCash?`Depuis ${currentCash.openedAt.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}`:'Aucune session active'}</small></div><Link className="card-link" href="/cash">Gérer <ArrowRight size={11}/></Link></div>{todayJobs.length>0&&<div style={{marginTop:10}}><div className="card-head" style={{marginBottom:8}}><div><h2><CalendarDays size={16}/> Planning du jour</h2></div></div><div className="alerts">{todayJobs.map(r=><Link className="alert" href={`/repairs/${r.id}`} key={r.id}><span className="alert-icon"><CalendarDays size={15}/></span><div><b>{r.deviceBrand} {r.deviceModel}</b><small>{r.client.name} · {r.promisedAt?.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</small></div><ChevronRight size={14}/></Link>)}</div></div>}</div>
   </section>
  </div>
 </AppShell>
}
