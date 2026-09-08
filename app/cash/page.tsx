import Link from 'next/link'
import {redirect} from 'next/navigation'
import AppShell from '@/components/AppShell'
import {getSession} from '@/lib/auth'
import {prisma} from '@/lib/prisma'
import {eur,dateFr} from '@/lib/format'
import {Monitor,WalletCards,LockKeyhole,UnlockKeyhole,ArrowDownCircle,ArrowUpCircle,ReceiptText,Printer,Clock3,Scale,Landmark,Coins,TriangleAlert,UserRoundCog,ShieldCheck} from 'lucide-react'

function sum<T>(items:T[],pick:(v:T)=>number){return items.reduce((a,v)=>a+pick(v),0)}

export default async function Page(){
 const s=await getSession();if(!s)redirect('/login')
 const isAdmin=s.role==='ADMIN'
 const start=new Date();start.setHours(0,0,0,0);const end=new Date(start);end.setDate(end.getDate()+1)
 const [current,history,dayPayments,activeUsers]=await Promise.all([
  prisma.cashSession.findFirst({where:{status:'OPEN'},orderBy:{openedAt:'desc'},include:{openedBy:true,movements:{orderBy:{createdAt:'desc'}},payments:{include:{repair:{include:{client:true}}},orderBy:{createdAt:'desc'}}}}),
  prisma.cashSession.findMany({where:{status:'CLOSED'},take:15,orderBy:{closedAt:'desc'},include:{openedBy:true}}),
  prisma.payment.findMany({where:{createdAt:{gte:start,lt:end}},include:{repair:{include:{client:true}}},orderBy:{createdAt:'desc'}}),
  prisma.user.findMany({where:{active:true},orderBy:{name:'asc'},select:{id:true,name:true,role:true}})
 ])
 const cashSales=current?sum(current.payments.filter(p=>p.method==='CASH'),p=>Number(p.amount)):0
 const cardSales=current?sum(current.payments.filter(p=>p.method==='CARD'),p=>Number(p.amount)):0
 const transferSales=current?sum(current.payments.filter(p=>p.method==='TRANSFER'),p=>Number(p.amount)):0
 const otherSales=current?sum(current.payments.filter(p=>p.method==='OTHER'),p=>Number(p.amount)):0
 const movements=current?.movements.filter(m=>!['OPENING','CLOSING'].includes(m.type))||[]
 const extras=sum(movements,m=>Number(m.amount))
 const expenses=Math.abs(sum(movements.filter(m=>Number(m.amount)<0),m=>Number(m.amount)))
 const adjustments=sum(movements.filter(m=>m.type==='ADJUSTMENT'),m=>Number(m.amount))
 const expected=(current?Number(current.openingAmount):0)+cashSales+extras
 const sessionTurnover=cashSales+cardSales+transferSales+otherSales
 const todayCash=sum(dayPayments.filter(p=>p.method==='CASH'),p=>Number(p.amount))
 const todayCard=sum(dayPayments.filter(p=>p.method==='CARD'),p=>Number(p.amount))
 const todayTransfer=sum(dayPayments.filter(p=>p.method==='TRANSFER'),p=>Number(p.amount))
 const todayOther=sum(dayPayments.filter(p=>p.method==='OTHER'),p=>Number(p.amount))
 const todayTotal=todayCash+todayCard+todayTransfer+todayOther
 const closedWithDiff=history.filter(h=>h.expectedAmount!=null&&h.closingAmount!=null)
 const diffTotal=sum(closedWithDiff,h=>Number(h.closingAmount)-Number(h.expectedAmount))
 const lastDiff=closedWithDiff[0]?Number(closedWithDiff[0].closingAmount)-Number(closedWithDiff[0].expectedAmount):0
 return <AppShell>
  <div className="cash-v14">
   <style>{`
    .cash-v14{color:#18263b;max-width:1480px;margin:0 auto}.cash-v14 *{box-sizing:border-box}
    .cash-v14 .cash-hero{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid #e3eaf2}.cash-v14 .cash-hero h1{margin:4px 0 5px;font-size:29px;letter-spacing:-.8px;color:#15243a}.cash-v14 .cash-hero p{margin:0;color:#8491a3;font-size:10px;max-width:720px}.cash-v14 .cash-eyebrow{font-size:8px;font-weight:900;letter-spacing:1.45px;color:#708097}.cash-v14 .detail-actions{display:flex;gap:7px;flex-wrap:wrap}.cash-v14 .detail-actions .btn{border:1px solid #dce5ef;background:#fff;border-radius:9px;box-shadow:0 4px 12px rgba(28,52,82,.035);font-size:9px}.cash-v14 .detail-actions .btn:hover{border-color:#b9cde5;transform:translateY(-1px)}
    .cash-v14 .kpi-grid{grid-template-columns:repeat(4,1fr);gap:11px}.cash-v14 .kpi-card{position:relative;min-height:116px;border:1px solid #dfe7f0;border-radius:13px;background:#fff;box-shadow:0 7px 20px rgba(28,52,82,.04);overflow:hidden}.cash-v14 .kpi-card:nth-child(1){background:linear-gradient(135deg,#eef6ff,#fff)}.cash-v14 .kpi-card:nth-child(2){background:linear-gradient(135deg,#eefbf5,#fff)}.cash-v14 .kpi-card:nth-child(3){background:linear-gradient(135deg,#f5f1ff,#fff)}.cash-v14 .kpi-card:nth-child(4){background:linear-gradient(135deg,#fff7ed,#fff)}.cash-v14 .kpi-icon{width:35px;height:35px;border-radius:9px;display:grid;place-items:center;background:#2f78d8;color:#fff}.cash-v14 .kpi-card:nth-child(2) .kpi-icon{background:#18a66c}.cash-v14 .kpi-card:nth-child(3) .kpi-icon{background:#7553cf}.cash-v14 .kpi-card:nth-child(4) .kpi-icon{background:#e9851d}.cash-v14 .kpi-card small{font-size:8px;color:#6d7b8f;font-weight:900;letter-spacing:.4px}.cash-v14 .kpi-card strong{font-size:21px;letter-spacing:-.4px;color:#17263c}.cash-v14 .kpi-card em{font-size:8px;color:#8995a5;font-style:normal}.cash-v14 .card{border-color:#dfe7f0;border-radius:13px;box-shadow:0 7px 20px rgba(28,52,82,.035)}.cash-v14 .section-title{margin-bottom:14px}.cash-v14 .section-title h2{color:#1c2c43}.cash-v14 .section-title p{color:#8a97a8;font-size:9px}
    .cash-v14 .status-ready{background:#eaf9f1!important;color:#159b68!important;border-color:#cdebdc!important}.cash-v14 .status-waiting{background:#fff4e6!important;color:#d97817!important;border-color:#f3d8b4!important}.cash-v14 .warning-box{border:1px solid #f1dfc4;background:#fff9f0;border-radius:10px}.cash-v14 .money-line{padding:9px 0;border-bottom:1px solid #edf1f5;font-size:9px}.cash-v14 .money-line:last-child{border-bottom:0}.cash-v14 .money-line.due{margin-top:5px;padding-top:12px;border-top:1px solid #dfe7f0;font-size:10px}.cash-v14 .money-line strong{color:#1b2a40}.cash-v14 table th{background:#f7f9fc;color:#728096;font-size:8px;letter-spacing:.4px}.cash-v14 table td{font-size:9px}.cash-v14 .row-link{color:#2d73d5;font-weight:800}.cash-v14 .green-text{color:#159b68}.cash-v14 .red-text{color:#dc4654}
    @media(max-width:1100px){.cash-v14 .kpi-grid{grid-template-columns:repeat(2,1fr)}.cash-v14 .cash-hero{align-items:flex-start;flex-direction:column}}
    @media(max-width:620px){.cash-v14 .kpi-grid{grid-template-columns:1fr}.cash-v14 .cash-hero h1{font-size:25px}.cash-v14 .detail-actions{width:100%}.cash-v14 .detail-actions .btn{flex:1;justify-content:center}.cash-v14 .comm-grid{grid-template-columns:1fr!important}}
   `}</style>
   <div className="cash-hero"><div><div className="cash-eyebrow">POS & CASH CONTROL · V14 ULTIMATE ERP</div><h1>Caisse professionnelle</h1><p>Un centre de contrôle financier pour suivre les encaissements, le tiroir, les opérateurs et les écarts de clôture.</p></div><div className="detail-actions"><Link className="btn secondary" href="/cash/report"><Printer size={17}/> Rapport X / Z</Link><Link className="btn secondary" href="/cash/report/thermal"><ReceiptText size={17}/> Ticket Z 80 mm</Link><Link className="btn secondary" href="/settings/print"><Printer size={17}/> Impression</Link></div></div>

  <div className="grid kpi-grid gap-top">
   <div className="card kpi-card"><span className="kpi-icon"><Coins/></span><div><small>Encaissements aujourd’hui</small><strong>{eur(todayTotal)}</strong><em>{dayPayments.length} opération(s)</em></div></div>
   <div className="card kpi-card"><span className="kpi-icon"><Monitor/></span><div><small>Espèces aujourd’hui</small><strong>{eur(todayCash)}</strong><em>Entrées espèces enregistrées</em></div></div>
   <div className="card kpi-card"><span className="kpi-icon"><WalletCards/></span><div><small>Carte aujourd’hui</small><strong>{eur(todayCard)}</strong><em>CB / TPE</em></div></div>
   <div className="card kpi-card"><span className="kpi-icon"><Landmark/></span><div><small>Virement + autres</small><strong>{eur(todayTransfer+todayOther)}</strong><em>Hors espèces / carte</em></div></div>
  </div>

  {!current?<section className="card gap-top"><div className="section-title"><div><h2><UnlockKeyhole size={19}/> Ouvrir la caisse</h2><p>Démarrez une session avant les encaissements espèces. Le fond initial sert de base au contrôle de fin de journée.</p></div>{!isAdmin&&<span className="badge status-waiting">ADMIN REQUIS</span>}</div>{isAdmin?<form action="/api/cash/open" method="post" className="v11-grid two"><label>Fond de caisse €<input name="openingAmount" type="number" step="0.01" min="0" defaultValue="100"/></label><label>Note d’ouverture<input name="note" placeholder="Ex. ouverture matin / équipe"/></label><div className="span2"><button className="btn"><UnlockKeyhole size={16}/> Ouvrir la caisse</button></div></form>:<div className="warning-box"><ShieldCheck size={17}/><div><b>Ouverture réservée à l’administrateur</b><small>Un technicien peut consulter la caisse, mais ne peut pas ouvrir, ajuster ou clôturer une session.</small></div></div>}</section>:<>
   <section className="card gap-top"><div className="section-title"><div><h2><Clock3 size={19}/> Session en cours</h2><p>Opérateur actuel : {current.openedBy.name} · ouverte le {dateFr(current.openedAt)}</p></div><span className="badge large status-ready">OUVERTE</span></div>
    <div className="grid kpi-grid">
     <div className="card kpi-card"><span className="kpi-icon"><Monitor/></span><div><small>Espèces attendues</small><strong>{eur(expected)}</strong><em>Fond + espèces + mouvements</em></div></div>
     <div className="card kpi-card"><span className="kpi-icon"><ArrowUpCircle/></span><div><small>CA session</small><strong>{eur(sessionTurnover)}</strong><em>Tous moyens de paiement</em></div></div>
     <div className="card kpi-card"><span className="kpi-icon"><ArrowDownCircle/></span><div><small>Sorties / remboursements</small><strong>{eur(expenses)}</strong><em>Mouvements négatifs</em></div></div>
     <div className="card kpi-card"><span className="kpi-icon"><Scale/></span><div><small>Ajustements</small><strong>{eur(adjustments)}</strong><em>Corrections manuelles</em></div></div>
    </div>
    <div className="comm-grid gap-top"><div className="card"><h2>Répartition session</h2><div className="money-line"><span>Espèces</span><strong>{eur(cashSales)}</strong></div><div className="money-line"><span>Carte</span><strong>{eur(cardSales)}</strong></div><div className="money-line"><span>Virement</span><strong>{eur(transferSales)}</strong></div><div className="money-line"><span>Autres</span><strong>{eur(otherSales)}</strong></div><div className="money-line due"><span>Total session</span><strong>{eur(sessionTurnover)}</strong></div></div>
     <div className="card"><h2>Contrôle du tiroir</h2><div className="money-line"><span>Fond initial</span><strong>{eur(Number(current.openingAmount))}</strong></div><div className="money-line"><span>Ventes espèces</span><strong>{eur(cashSales)}</strong></div><div className="money-line"><span>Mouvements nets</span><strong>{eur(extras)}</strong></div><div className="money-line due"><span>Espèces théoriques</span><strong>{eur(expected)}</strong></div></div></div>
   </section>

   {isAdmin&&<section className="card gap-top"><div className="section-title"><div><h2><UserRoundCog size={19}/> Changer d’opérateur de caisse</h2><p>Poste partagé : attribuez les prochaines opérations au bon membre sans fermer la session.</p></div></div><form action="/api/cash/cashier" method="post" className="filters"><select name="userId" defaultValue={current.openedById}>{activeUsers.map(u=><option key={u.id} value={u.id}>{u.name} · {u.role==='ADMIN'?'Administrateur':'Technicien'}</option>)}</select><button className="btn secondary">Activer cet opérateur</button></form></section>}

   <div className="comm-grid gap-top"><section className="card"><div className="section-title"><div><h2>Mouvement manuel</h2><p>Enregistrez chaque sortie ou correction pour garder un tiroir cohérent.</p></div>{!isAdmin&&<span className="badge status-waiting">LECTURE SEULE</span>}</div>{isAdmin?<form action="/api/cash/movement" method="post" className="v11-grid two"><label>Type<select name="type"><option value="EXPENSE">Dépense / sortie</option><option value="REFUND">Remboursement</option><option value="ADJUSTMENT">Ajustement +/-</option></select></label><label>Montant €<input name="amount" type="number" step="0.01" required/></label><label>Libellé<input name="label" required placeholder="Fournitures, retrait, correction…"/></label><label>Note<input name="note" placeholder="Justificatif / motif"/></label><div className="span2"><button className="btn secondary">Enregistrer le mouvement</button></div></form>:<div className="muted">Les mouvements de tiroir sont réservés à l’administrateur.</div>}</section>
    <section className="card"><div className="section-title"><div><h2><LockKeyhole size={18}/> Clôture contrôlée</h2><p>Saisissez le montant réellement compté. L’écart sera calculé et conservé.</p></div></div><div className="warning-box"><TriangleAlert size={17}/><div><b>Espèces théoriques : {eur(expected)}</b><small>Comptez le tiroir avant de clôturer.</small></div></div>{isAdmin?<form action="/api/cash/close" method="post" className="v11-grid gap-top"><label>Comptage réel espèces €<input name="closingAmount" type="number" step="0.01" min="0" required/></label><label>Note de clôture<input name="note" placeholder="Écart expliqué, retrait banque…"/></label><button className="btn"><LockKeyhole size={16}/> Clôturer et calculer l’écart</button></form>:<div className="muted gap-top">Clôture réservée à l’administrateur.</div>}</section></div>

   <section className="card gap-top"><div className="section-title"><div><h2>Encaissements de la session</h2><p>Derniers paiements rattachés aux dossiers atelier.</p></div><strong>{current.payments.length}</strong></div><div className="table-wrap"><table><thead><tr><th>Date</th><th>Dossier</th><th>Client</th><th>Moyen</th><th>Montant</th></tr></thead><tbody>{current.payments.map(p=><tr key={p.id}><td>{dateFr(p.createdAt)}</td><td><Link className="row-link" href={`/repairs/${p.repairId}`}>TKT-{String(p.repair.ticketNo).padStart(5,'0')}</Link></td><td>{p.repair.client.name}</td><td>{p.method==='CASH'?'Espèces':p.method==='CARD'?'Carte':p.method==='TRANSFER'?'Virement':'Autre'}</td><td><b>{eur(Number(p.amount))}</b></td></tr>)}</tbody></table></div>{!current.payments.length&&<div className="empty compact-empty">Aucun encaissement dans cette session.</div>}</section>

   <section className="card gap-top"><div className="section-title"><div><h2>Mouvements du tiroir</h2><p>Dépenses, remboursements et ajustements.</p></div><strong>{current.movements.length}</strong></div><div className="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Libellé</th><th>Note</th><th>Montant</th></tr></thead><tbody>{current.movements.map(m=><tr key={m.id}><td>{dateFr(m.createdAt)}</td><td>{m.type}</td><td>{m.label}</td><td>{m.note||'—'}</td><td><b>{eur(Number(m.amount))}</b></td></tr>)}</tbody></table></div></section>
  </>}

  <section className="card gap-top"><div className="section-title"><div><h2>Historique des clôtures</h2><p>Contrôle des écarts des dernières sessions.</p></div><div><small>Écart cumulé</small><strong style={{display:'block',textAlign:'right'}}>{eur(diffTotal)}</strong></div></div><div className="table-wrap"><table><thead><tr><th>Ouverture</th><th>Clôture</th><th>Utilisateur</th><th>Fond</th><th>Attendu</th><th>Compté</th><th>Écart</th></tr></thead><tbody>{history.map(h=>{const d=Number(h.closingAmount||0)-Number(h.expectedAmount||0);return <tr key={h.id}><td>{dateFr(h.openedAt)}</td><td>{h.closedAt?dateFr(h.closedAt):'—'}</td><td>{h.openedBy.name}</td><td>{eur(Number(h.openingAmount))}</td><td>{eur(Number(h.expectedAmount||0))}</td><td>{eur(Number(h.closingAmount||0))}</td><td><b className={d===0?'green-text':Math.abs(d)<=2?'':'red-text'}>{eur(d)}</b></td></tr>})}</tbody></table></div>{!history.length&&<div className="empty">Aucune clôture enregistrée.</div>}{history.length>0&&<div className="note-box gap-top"><small>Dernier écart</small><p>{eur(lastDiff)} · Un écart proche de 0 € indique un tiroir correctement rapproché.</p></div>}</section>
 </div>
 </AppShell>
}
