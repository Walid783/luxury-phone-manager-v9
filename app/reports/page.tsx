import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { eur,statusLabel,statusClass } from '@/lib/format'
import { BarChart3,TrendingUp,Wallet,Wrench,Users,Clock3,Package,UserRoundCheck,CircleDollarSign } from 'lucide-react'

export default async function Reports(){
 if(!(await getSession()))redirect('/login')
 const now=new Date();const month=new Date(now.getFullYear(),now.getMonth(),1);const today=new Date();today.setHours(0,0,0,0)
 const [monthPayments,monthRepairs,clients,delivered,active,inventory,techs,todayPayments]=await Promise.all([
  prisma.payment.findMany({where:{createdAt:{gte:month}},include:{repair:true}}),
  prisma.repair.findMany({where:{createdAt:{gte:month}},include:{payments:true,assignedTo:true,parts:true}}),
  prisma.client.count(),
  prisma.repair.count({where:{status:'DELIVERED',updatedAt:{gte:month}}}),
  prisma.repair.findMany({where:{status:{notIn:['DELIVERED','CANCELLED']}},include:{assignedTo:true,payments:true}}),
  prisma.inventoryItem.findMany({orderBy:{quantity:'asc'}}),
  prisma.user.findMany({where:{active:true},include:{repairs:{where:{createdAt:{gte:month}}}}}),
  prisma.payment.findMany({where:{createdAt:{gte:today}}})
 ])
 const revenue=monthPayments.reduce((a,p)=>a+Number(p.amount),0)
 const todayRevenue=todayPayments.reduce((a,p)=>a+Number(p.amount),0)
 const avgTicket=monthRepairs.length?monthRepairs.reduce((a,r)=>a+Number(r.total),0)/monthRepairs.length:0
 const dueActive=active.reduce((a,r)=>a+Math.max(0,Number(r.total)-r.payments.reduce((s,p)=>s+Number(p.amount),0)),0)
 const lowStock=inventory.filter(i=>i.quantity<=i.minQuantity)
 const inventoryValue=inventory.reduce((a,i)=>a+Number(i.buyPrice)*i.quantity,0)
 const statusCounts=Object.entries(active.reduce((m:any,r)=>{m[r.status]=(m[r.status]||0)+1;return m},{})) as [string,number][]
 const topTechs=techs.map(t=>({name:t.name,count:t.repairs.length})).sort((a,b)=>b.count-a.count).slice(0,5)
 return <AppShell><div style={{maxWidth:1450,margin:'0 auto'}}>
  <div className="page-heading"><div><div className="eyebrow">PILOTAGE · V15.4</div><h1>Rapports & performances</h1><p>Indicateurs réels issus des réparations, paiements, stock et activité équipe.</p></div></div>
  <div className="grid kpi-grid"><div className="card kpi-card"><span className="kpi-icon"><Wallet/></span><div><small>CA encaissé ce mois</small><strong>{eur(revenue)}</strong><em>Aujourd’hui : {eur(todayRevenue)}</em></div></div><div className="card kpi-card"><span className="kpi-icon"><Wrench/></span><div><small>Dossiers créés</small><strong>{monthRepairs.length}</strong><em>Depuis le 1er du mois</em></div></div><div className="card kpi-card"><span className="kpi-icon"><TrendingUp/></span><div><small>Réparations livrées</small><strong>{delivered}</strong><em>Ce mois-ci</em></div></div><div className="card kpi-card"><span className="kpi-icon"><Users/></span><div><small>Base clients</small><strong>{clients}</strong><em>Clients enregistrés</em></div></div></div>
  <div className="grid kpi-grid gap-top"><div className="card kpi-card"><span className="kpi-icon"><CircleDollarSign/></span><div><small>Panier moyen dossiers</small><strong>{eur(avgTicket)}</strong><em>Montant moyen créé ce mois</em></div></div><div className="card kpi-card"><span className="kpi-icon"><Clock3/></span><div><small>Dossiers actifs</small><strong>{active.length}</strong><em>Hors livrés / annulés</em></div></div><div className="card kpi-card"><span className="kpi-icon"><CircleDollarSign/></span><div><small>Reste à encaisser actif</small><strong>{eur(dueActive)}</strong><em>Solde des dossiers ouverts</em></div></div><div className="card kpi-card"><span className="kpi-icon"><Package/></span><div><small>Valeur achat stock</small><strong>{eur(inventoryValue)}</strong><em>{lowStock.length} alerte(s) stock</em></div></div></div>
  <div className="detail-grid gap-top"><section className="stack"><div className="card"><div className="section-title"><div><h2><BarChart3 size={18}/> Répartition atelier</h2><p>Dossiers actuellement actifs par statut.</p></div></div><div className="payment-list">{statusCounts.map(([st,n])=><div key={st}><div><b>{statusLabel[st]||st}</b><small>{n} dossier(s)</small></div><span className={`badge ${statusClass[st]||'slate'}`}>{n}</span></div>)}{!statusCounts.length&&<div className="empty compact-empty">Aucun dossier actif.</div>}</div></div><div className="card"><div className="section-title"><div><h2><Package size={18}/> Alertes stock</h2><p>Références au niveau ou sous le seuil minimum.</p></div><strong>{lowStock.length}</strong></div><div className="table-wrap"><table><thead><tr><th>SKU</th><th>Pièce</th><th>Stock</th><th>Seuil</th></tr></thead><tbody>{lowStock.slice(0,12).map(i=><tr key={i.id}><td>{i.sku}</td><td><b>{i.name}</b></td><td>{i.quantity}</td><td>{i.minQuantity}</td></tr>)}</tbody></table></div>{!lowStock.length&&<div className="empty compact-empty">Aucune alerte stock.</div>}</div></section>
  <aside className="stack"><div className="card"><div className="section-title"><div><h2><UserRoundCheck size={18}/> Activité techniciens</h2><p>Dossiers créés ce mois par technicien assigné.</p></div></div><div className="payment-list">{topTechs.map((t,i)=><div key={t.name}><div><b>{i+1}. {t.name}</b><small>Activité mensuelle</small></div><span>{t.count} dossier(s)</span></div>)}</div></div><div className="card"><div className="section-title"><div><h2>Contrôle rapide</h2><p>Points à surveiller aujourd’hui.</p></div></div><div className="money-line"><span>Dossiers actifs</span><strong>{active.length}</strong></div><div className="money-line"><span>Reste à encaisser</span><strong>{eur(dueActive)}</strong></div><div className="money-line"><span>Alertes stock</span><strong>{lowStock.length}</strong></div><div className="money-line"><span>CA aujourd’hui</span><strong>{eur(todayRevenue)}</strong></div></div></aside></div>
 </div></AppShell>
}
