import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { eur, statusLabel } from '@/lib/format'
import {
  Activity, AlertTriangle, ArrowRight, Banknote, BarChart3, CalendarDays,
  CheckCircle2, CircleDollarSign, ClipboardList, Clock3, CreditCard,
  Package, Plus, ReceiptText, ShieldCheck, ShoppingCart, Sparkles,
  TrendingUp, Users, WalletCards, Wrench
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
  <div className="lux-dashboard">
   <style>{`
    .lux-dashboard{max-width:1560px;margin:0 auto;color:#142033}.lux-dashboard *{box-sizing:border-box}
    .lux-dashboard .hero{position:relative;overflow:hidden;border-radius:26px;padding:30px;background:linear-gradient(135deg,#07111f 0%,#0f2037 50%,#16375d 100%);box-shadow:0 24px 70px rgba(10,26,48,.20);color:white}.lux-dashboard .hero:before{content:'';position:absolute;inset:auto -100px -150px auto;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(53,138,255,.38),transparent 67%)}.lux-dashboard .hero:after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 46%,rgba(255,255,255,.04));pointer-events:none}
    .lux-dashboard .hero-main{position:relative;z-index:2;display:grid;grid-template-columns:1.4fr .8fr;gap:24px;align-items:center}.lux-dashboard .version{display:inline-flex;align-items:center;gap:7px;padding:6px 10px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.06);font-size:8px;font-weight:900;letter-spacing:1.35px;color:#a9c7eb}.lux-dashboard .pulse{width:7px;height:7px;border-radius:50%;background:#30d58a;box-shadow:0 0 0 5px rgba(48,213,138,.12)}.lux-dashboard h1{margin:13px 0 8px;font-size:42px;letter-spacing:-1.5px;line-height:.98}.lux-dashboard .subtitle{font-size:11px;line-height:1.6;color:#b7c7da;max-width:720px}.lux-dashboard .hero-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:20px}.lux-dashboard .hero-btn{height:43px;padding:0 15px;border-radius:12px;display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.08);color:#f2f6fb;font-size:9px;font-weight:800}.lux-dashboard .hero-btn.primary{background:linear-gradient(135deg,#f6bd4b,#e5a82f);color:#172235;border-color:#f0b43e;box-shadow:0 10px 24px rgba(231,168,45,.24)}
    .lux-dashboard .hero-metrics{display:grid;grid-template-columns:1fr 1fr;gap:10px}.lux-dashboard .hero-metric{padding:15px;border-radius:16px;border:1px solid rgba(255,255,255,.11);background:rgba(255,255,255,.07);backdrop-filter:blur(10px)}.lux-dashboard .hero-metric small{display:block;font-size:7px;color:#9fb3ca;text-transform:uppercase;letter-spacing:.8px}.lux-dashboard .hero-metric strong{display:block;margin-top:6px;font-size:20px}.lux-dashboard .hero-metric em{display:block;margin-top:3px;font-size:7px;font-style:normal;color:#9cd8ba}
    .lux-dashboard .section{margin-top:14px}.lux-dashboard .kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:11px}.lux-dashboard .kpi{position:relative;overflow:hidden;border:1px solid #e3e9f0;background:#fff;border-radius:17px;padding:16px;box-shadow:0 8px 26px rgba(28,48,74,.045)}.lux-dashboard .kpi:after{content:'';position:absolute;right:-22px;top:-26px;width:86px;height:86px;border-radius:50%;background:#eef5ff}.lux-dashboard .kpi:nth-child(2):after{background:#edf9f4}.lux-dashboard .kpi:nth-child(3):after{background:#f3efff}.lux-dashboard .kpi:nth-child(4):after{background:#fff4e7}.lux-dashboard .kpi:nth-child(5):after{background:#eff2f6}.lux-dashboard .kpi-head{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between}.lux-dashboard .kpi-icon{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:#edf5ff;color:#2d73d5}.lux-dashboard .kpi:nth-child(2) .kpi-icon{background:#edf9f4;color:#159b68}.lux-dashboard .kpi:nth-child(3) .kpi-icon{background:#f3efff;color:#7654c8}.lux-dashboard .kpi:nth-child(4) .kpi-icon{background:#fff4e7;color:#dd831f}.lux-dashboard .kpi:nth-child(5) .kpi-icon{background:#eff2f6;color:#53677f}.lux-dashboard .trend{font-size:7px;font-weight:900;padding:4px 7px;border-radius:999px;background:#edf9f4;color:#159b68}.lux-dashboard .trend.down{background:#fff0f1;color:#d24c5c}.lux-dashboard .kpi small{display:block;margin-top:13px;font-size:7px;font-weight:900;letter-spacing:.7px;color:#7d8999}.lux-dashboard .kpi strong{display:block;margin-top:4px;font-size:24px;letter-spacing:-.5px}.lux-dashboard .kpi em{display:block;margin-top:3px;font-size:7px;font-style:normal;color:#8c97a6}
    .lux-dashboard .main-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(340px,.75fr);gap:11px}.lux-dashboard .card{border:1px solid #e3e9f0;background:#fff;border-radius:17px;padding:17px;box-shadow:0 8px 26px rgba(28,48,74,.035)}.lux-dashboard .card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:15px}.lux-dashboard .card-head h2{margin:0;font-size:15px;display:flex;gap:7px;align-items:center}.lux-dashboard .card-head p{margin:4px 0 0;font-size:8px;color:#8c97a6}.lux-dashboard .card-link{display:flex;align-items:center;gap:4px;font-size:8px;font-weight:900;color:#2b72d0}
    .lux-dashboard .chart{height:250px;display:flex;align-items:flex-end;gap:14px;padding:8px}.lux-dashboard .chart-col{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:7px}.lux-dashboard .bar-value{font-size:7px;color:#728196}.lux-dashboard .bar-track{width:min(58px,100%);height:175px;border-radius:14px 14px 6px 6px;background:linear-gradient(180deg,#f4f6f9,#edf1f6);display:flex;align-items:flex-end;overflow:hidden}.lux-dashboard .bar{width:100%;border-radius:14px 14px 6px 6px;background:linear-gradient(180deg,#5ba4f4 0%,#236dcc 100%);box-shadow:0 -8px 20px rgba(35,109,204,.15)}.lux-dashboard .chart-col b{font-size:8px;color:#55657a}.lux-dashboard .chart-col span{font-size:7px;color:#8995a4;font-weight:800}
    .lux-dashboard .atelier-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.lux-dashboard .stage{position:relative;padding:13px 8px;border:1px solid #e4eaf1;border-radius:12px;background:#fafbfd;text-align:center}.lux-dashboard .stage i{position:absolute;left:50%;top:0;transform:translate(-50%,-50%);width:9px;height:9px;border-radius:50%;box-shadow:0 0 0 4px #fff}.lux-dashboard .stage strong{display:block;font-size:22px}.lux-dashboard .stage span{display:block;margin-top:3px;font-size:7px;color:#7e8a9a}
    .lux-dashboard .alerts{display:grid;gap:8px}.lux-dashboard .alert{display:grid;grid-template-columns:34px 1fr auto;align-items:center;gap:9px;padding:10px;border:1px solid #e6ebf1;border-radius:11px;background:#fbfcfe}.lux-dashboard .alert-icon{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:#fff3e6;color:#df8120}.lux-dashboard .alert b{display:block;font-size:8px}.lux-dashboard .alert small{display:block;margin-top:2px;font-size:7px;color:#8b96a5}.lux-dashboard .alert strong{font-size:8px}.lux-dashboard .ok{padding:13px;border:1px solid #d4eddf;border-radius:11px;background:#edf9f4;color:#18795a;font-size:8px}
    .lux-dashboard .lower-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(320px,.65fr);gap:11px}.lux-dashboard table{width:100%;border-collapse:collapse}.lux-dashboard th{padding:10px;background:#f7f9fc;border-bottom:1px solid #e3e9ef;text-align:left;font-size:7px;letter-spacing:.5px;color:#7a8797}.lux-dashboard td{padding:10px;border-bottom:1px solid #edf1f5;font-size:8px;color:#415166}.lux-dashboard .row-link{font-weight:900;color:#246dcc}.lux-dashboard .device{font-weight:800;color:#27384f}.lux-dashboard .badge{font-size:7px;font-weight:900;padding:4px 7px;border-radius:999px;background:#eef5ff;color:#3479d1}.lux-dashboard .badge.ready{background:#eaf9f1;color:#159b68}.lux-dashboard .badge.wait{background:#fff3e5;color:#e57a1b}.lux-dashboard .badge.repair{background:#f0ebff;color:#7352c5}
    .lux-dashboard .quick{display:grid;grid-template-columns:1fr 1fr;gap:8px}.lux-dashboard .quick a{min-height:88px;padding:12px;border-radius:13px;border:1px solid #e3e9f0;background:linear-gradient(180deg,#fff,#fbfcfe);color:#24364e;display:flex;flex-direction:column;justify-content:space-between}.lux-dashboard .quick a:hover{border-color:#cbd9e9;transform:translateY(-1px);box-shadow:0 8px 18px rgba(32,56,84,.06)}.lux-dashboard .quick-icon{width:33px;height:33px;border-radius:10px;display:grid;place-items:center;background:#edf5ff;color:#2c73d5}.lux-dashboard .quick b{font-size:9px}.lux-dashboard .quick small{font-size:7px;color:#8a95a4}.lux-dashboard .cash-card{margin-top:8px;padding:12px;border-radius:12px;background:${currentCash?'#edf9f4':'#fff7ed'};border:1px solid ${currentCash?'#d4ecdf':'#f1dfc5'};display:flex;justify-content:space-between;align-items:center}.lux-dashboard .cash-card b{font-size:8px;color:${currentCash?'#18795a':'#95611d'}}.lux-dashboard .cash-card small{display:block;margin-top:2px;font-size:7px;color:#8190a0}
    .lux-dashboard .mini-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:11px}.lux-dashboard .mini-box{padding:11px;border-radius:12px;background:#f8fafc;border:1px solid #e6ebf1}.lux-dashboard .mini-box small{display:block;font-size:7px;color:#7f8b9b}.lux-dashboard .mini-box strong{display:block;margin-top:4px;font-size:14px}
    @media(max-width:1200px){.lux-dashboard .hero-main{grid-template-columns:1fr}.lux-dashboard .kpis{grid-template-columns:repeat(3,1fr)}.lux-dashboard .main-grid,.lux-dashboard .lower-grid{grid-template-columns:1fr}.lux-dashboard .hero-metrics{grid-template-columns:repeat(4,1fr)}}
    @media(max-width:760px){.lux-dashboard h1{font-size:32px}.lux-dashboard .kpis,.lux-dashboard .hero-metrics{grid-template-columns:1fr 1fr}.lux-dashboard .atelier-grid{grid-template-columns:1fr 1fr}.lux-dashboard .mini-strip{grid-template-columns:1fr 1fr}.lux-dashboard .hero{padding:22px}}
    @media(max-width:500px){.lux-dashboard .kpis,.lux-dashboard .hero-metrics,.lux-dashboard .quick,.lux-dashboard .mini-strip{grid-template-columns:1fr}}
   `}</style>

   <section className="hero">
    <div className="hero-main">
     <div>
      <div className="version"><span className="pulse"/> LUXURY PHONE · V15 EXECUTIVE COMMAND CENTER</div>
      <h1>Bonjour {s.name}</h1>
      <p className="subtitle">Une vue unique pour piloter l’atelier, la caisse, les ventes et les priorités du jour.</p>
      <div className="hero-actions">
       <Link className="hero-btn primary" href="/repairs/new"><Plus size={15}/> Nouvelle prise en charge</Link>
       <Link className="hero-btn" href="/cash/sales"><ShoppingCart size={15}/> Vente rapide</Link>
       <Link className="hero-btn" href="/cash/quick"><WalletCards size={15}/> Encaissement</Link>
      </div>
     </div>
     <div className="hero-metrics">
      <div className="hero-metric"><small>CA aujourd’hui</small><strong>{eur(todayTotal)}</strong><em>{eur(cardToday)} carte · {eur(cashToday)} espèces</em></div>
      <div className="hero-metric"><small>CA du mois</small><strong>{eur(monthTotal)}</strong><em>{growth>=0?'▲':'▼'} {Math.abs(growth).toFixed(1)}% vs mois dernier</em></div>
      <div className="hero-metric"><small>Dossiers actifs</small><strong>{active}</strong><em>{ready} prêt{ready>1?'s':''} à restituer</em></div>
      <div className="hero-metric"><small>Caisse</small><strong>{currentCash?'OUVERTE':'FERMÉE'}</strong><em>{currentCash?`Opérateur ${currentCash.openedBy.name}`:'Aucune session active'}</em></div>
     </div>
    </div>
   </section>

   <section className="kpis section">
    <div className="kpi"><div className="kpi-head"><span className="kpi-icon"><TrendingUp size={17}/></span><span className={`trend ${growth<0?'down':''}`}>{growth>=0?'▲':'▼'} {Math.abs(growth).toFixed(1)}%</span></div><small>CHIFFRE D’AFFAIRES</small><strong>{eur(monthTotal)}</strong><em>réparations + ventes boutique</em></div>
    <div className="kpi"><div className="kpi-head"><span className="kpi-icon"><Wrench size={17}/></span></div><small>ATELIER ACTIF</small><strong>{active}</strong><em>{ready} dossier{ready>1?'s':''} prêt{ready>1?'s':''}</em></div>
    <div className="kpi"><div className="kpi-head"><span className="kpi-icon"><CircleDollarSign size={17}/></span></div><small>PANIER MOYEN</small><strong>{eur(avgTicket)}</strong><em>{monthPayments.length+monthSales.length} opération(s)</em></div>
    <div className="kpi"><div className="kpi-head"><span className="kpi-icon"><Users size={17}/></span></div><small>CLIENTS</small><strong>{clients}</strong><em>{warranties} garantie(s) active(s)</em></div>
    <div className="kpi"><div className="kpi-head"><span className="kpi-icon"><Banknote size={17}/></span></div><small>RESTE À ENCAISSER</small><strong>{eur(due)}</strong><em>sur les derniers dossiers</em></div>
   </section>

   <section className="main-grid section">
    <div className="card">
     <div className="card-head"><div><h2><BarChart3 size={17}/> Activité financière</h2><p>Évolution du chiffre d’affaires sur les 6 derniers mois.</p></div><Link className="card-link" href="/reports">Rapports <ArrowRight size={12}/></Link></div>
     <div className="chart">{series.map((item,i)=><div className="chart-col" key={i}><span className="bar-value">{eur(item.value)}</span><div className="bar-track"><div className="bar" style={{height:`${Math.max(8,(item.value/maxSeries)*100)}%`}}/></div><b>{item.label}</b></div>)}</div>
     <div className="mini-strip"><div className="mini-box"><small>Réparations ce mois</small><strong>{eur(repairMonth)}</strong></div><div className="mini-box"><small>Ventes boutique</small><strong>{eur(posMonth)}</strong></div><div className="mini-box"><small>Carte aujourd’hui</small><strong>{eur(cardToday)}</strong></div><div className="mini-box"><small>Espèces aujourd’hui</small><strong>{eur(cashToday)}</strong></div></div>
    </div>
    <div className="card">
     <div className="card-head"><div><h2><AlertTriangle size={17}/> Priorités du jour</h2><p>Ce qui mérite ton attention immédiatement.</p></div></div>
     <div className="alerts">
      {overdue.length>0&&<div className="alert"><span className="alert-icon"><Clock3 size={15}/></span><div><b>Dossiers en retard</b><small>{overdue[0].client.name} · {overdue[0].deviceBrand} {overdue[0].deviceModel}</small></div><strong>{overdue.length}</strong></div>}
      {lowStock.length>0&&<div className="alert"><span className="alert-icon"><Package size={15}/></span><div><b>Stock critique</b><small>{lowStock[0].name}</small></div><strong>{lowStock.length}</strong></div>}
      {ready>0&&<div className="alert"><span className="alert-icon" style={{background:'#eaf9f1',color:'#159b68'}}><CheckCircle2 size={15}/></span><div><b>Prêts à restituer</b><small>Clients à prévenir ou appareils à remettre.</small></div><strong>{ready}</strong></div>}
      {overdue.length===0&&lowStock.length===0&&ready===0&&<div className="ok"><CheckCircle2 size={14}/> Aucune alerte prioritaire.</div>}
     </div>
     <div className="cash-card"><div><b>{currentCash?'Caisse ouverte':'Caisse fermée'}</b><small>{currentCash?`Ouverte par ${currentCash.openedBy.name}`:'Ouvre la caisse pour les opérations espèces'}</small></div><Link className="card-link" href="/cash">Caisse <ArrowRight size={12}/></Link></div>
    </div>
   </section>

   <section className="card section">
    <div className="card-head"><div><h2><Activity size={17}/> Flux atelier</h2><p>Répartition instantanée des dossiers par étape.</p></div><Link className="card-link" href="/repairs">Voir l’atelier <ArrowRight size={12}/></Link></div>
    <div className="atelier-grid">{atelierStages.map(([key,label,count,color])=><Link href={`/repairs?status=${key}`} className="stage" key={key}><i style={{background:color}}/><strong>{count}</strong><span>{label}</span></Link>)}</div>
   </section>

   <section className="lower-grid section">
    <div className="card">
     <div className="card-head"><div><h2><ClipboardList size={17}/> Dernières prises en charge</h2><p>Les dossiers récemment modifiés.</p></div><Link className="card-link" href="/repairs">Tout voir <ArrowRight size={12}/></Link></div>
     <div style={{overflowX:'auto'}}><table><thead><tr><th>DOSSIER</th><th>CLIENT</th><th>APPAREIL</th><th>TECHNICIEN</th><th>STATUT</th><th>RESTE DÛ</th></tr></thead><tbody>{recentRepairs.map(r=>{const paid=r.payments.reduce((a,p)=>a+Number(p.amount),0);const balance=Math.max(0,Number(r.total)-paid);return <tr key={r.id}><td><Link className="row-link" href={`/repairs/${r.id}`}>TKT-{String(r.ticketNo).padStart(5,'0')}</Link></td><td>{r.client.name}</td><td><span className="device">{r.deviceBrand} {r.deviceModel}</span></td><td>{r.assignedTo?.name||'—'}</td><td><span className={`badge ${r.status==='READY'?'ready':r.status==='REPAIRING'?'repair':r.status.includes('WAITING')?'wait':''}`}>{statusLabel[r.status]}</span></td><td>{eur(balance)}</td></tr>})}</tbody></table></div>
    </div>
    <div className="card">
     <div className="card-head"><div><h2><Sparkles size={17}/> Actions rapides</h2><p>Les raccourcis les plus utiles au quotidien.</p></div></div>
     <div className="quick">
      <Link href="/repairs/new"><span className="quick-icon"><Plus size={16}/></span><div><b>Nouvelle réparation</b><small>Créer un dossier</small></div></Link>
      <Link href="/cash/sales"><span className="quick-icon"><ShoppingCart size={16}/></span><div><b>Vente rapide</b><small>Encaisser un article</small></div></Link>
      <Link href="/cash/quick"><span className="quick-icon"><WalletCards size={16}/></span><div><b>Encaissement</b><small>Régler une réparation</small></div></Link>
      <Link href="/cash"><span className="quick-icon"><CreditCard size={16}/></span><div><b>Caisse Pro</b><small>Session et clôture</small></div></Link>
      <Link href="/inventory"><span className="quick-icon"><Package size={16}/></span><div><b>Stock</b><small>Pièces et produits</small></div></Link>
      <Link href="/invoices"><span className="quick-icon"><ReceiptText size={16}/></span><div><b>Factures</b><small>Suivi comptable</small></div></Link>
     </div>
     {todayJobs.length>0&&<div style={{marginTop:12}}><div className="card-head" style={{marginBottom:8}}><div><h2><CalendarDays size={15}/> Planning du jour</h2></div></div>{todayJobs.map(r=><div className="alert" key={r.id}><span className="alert-icon" style={{background:'#edf5ff',color:'#2d73d5'}}><CalendarDays size={14}/></span><div><b>{r.client.name}</b><small>{r.deviceBrand} {r.deviceModel}</small></div><Link className="card-link" href={`/repairs/${r.id}`}>Ouvrir</Link></div>)}</div>}
    </div>
   </section>
  </div>
 </AppShell>
}
