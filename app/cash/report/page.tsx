import Link from 'next/link'
import {redirect} from 'next/navigation'
import AppShell from '@/components/AppShell'
import {getSession} from '@/lib/auth'
import {prisma} from '@/lib/prisma'
import {eur,dateFr} from '@/lib/format'
import {ArrowLeft,Printer,ReceiptText,Scale} from 'lucide-react'

function sum<T>(items:T[],pick:(v:T)=>number){return items.reduce((a,v)=>a+pick(v),0)}

export default async function CashReport(){
 const s=await getSession();if(!s)redirect('/login')
 const session=await prisma.cashSession.findFirst({orderBy:{openedAt:'desc'},include:{openedBy:true,payments:{include:{repair:{include:{client:true}}},orderBy:{createdAt:'asc'}},movements:{orderBy:{createdAt:'asc'}}}})
 if(!session)return <AppShell><div className="hero-head compact"><div><div className="eyebrow">RAPPORT CAISSE · V14</div><h1>Aucune session de caisse</h1><p>Ouvrez une caisse pour générer un rapport X / Z.</p></div></div><Link className="btn" href="/cash">Retour à la caisse</Link></AppShell>
 const cash=sum(session.payments.filter(p=>p.method==='CASH'),p=>Number(p.amount))
 const card=sum(session.payments.filter(p=>p.method==='CARD'),p=>Number(p.amount))
 const transfer=sum(session.payments.filter(p=>p.method==='TRANSFER'),p=>Number(p.amount))
 const other=sum(session.payments.filter(p=>p.method==='OTHER'),p=>Number(p.amount))
 const extras=sum(session.movements.filter(m=>!['OPENING','CLOSING'].includes(m.type)),m=>Number(m.amount))
 const expected=Number(session.openingAmount)+cash+extras
 const counted=session.closingAmount==null?null:Number(session.closingAmount)
 const diff=counted==null?null:counted-Number(session.expectedAmount??expected)
 const type=session.status==='OPEN'?'RAPPORT X · SESSION EN COURS':'RAPPORT Z · SESSION CLÔTURÉE'
 return <AppShell>
  <div className="detail-top"><Link className="back" href="/cash"><ArrowLeft size={17}/> Retour caisse</Link><div className="detail-actions"><button className="btn secondary" onClick={undefined}><Printer size={17}/> Utilisez Ctrl+P pour imprimer</button></div></div>
  <div className="hero-head compact"><div><div className="eyebrow">{type}</div><h1>Rapport de caisse</h1><p>Session ouverte par {session.openedBy.name} le {dateFr(session.openedAt)}.</p></div><div className="hero-badges"><span className={`badge large ${session.status==='OPEN'?'status-waiting':'status-ready'}`}>{session.status==='OPEN'?'OUVERTE':'CLÔTURÉE'}</span></div></div>
  <div className="detail-grid">
   <section className="stack">
    <div className="card"><div className="section-title"><div><h2><ReceiptText size={19}/> Synthèse financière</h2><p>Ventilation des encaissements de la session.</p></div></div><div className="money-line"><span>Fond de caisse</span><strong>{eur(Number(session.openingAmount))}</strong></div><div className="money-line"><span>Espèces encaissées</span><strong>{eur(cash)}</strong></div><div className="money-line"><span>Carte</span><strong>{eur(card)}</strong></div><div className="money-line"><span>Virement</span><strong>{eur(transfer)}</strong></div><div className="money-line"><span>Autres moyens</span><strong>{eur(other)}</strong></div><div className="money-line"><span>Mouvements espèces nets</span><strong>{eur(extras)}</strong></div><div className="money-line due"><span>Total encaissé</span><strong>{eur(cash+card+transfer+other)}</strong></div></div>
    <div className="card"><div className="section-title"><div><h2>Encaissements</h2><p>Détail des paiements rattachés aux dossiers.</p></div><strong>{session.payments.length}</strong></div><div className="table-wrap"><table><thead><tr><th>Date</th><th>Dossier</th><th>Client</th><th>Moyen</th><th>Montant</th></tr></thead><tbody>{session.payments.map(p=><tr key={p.id}><td>{dateFr(p.createdAt)}</td><td>TKT-{String(p.repair.ticketNo).padStart(5,'0')}</td><td>{p.repair.client.name}</td><td>{p.method==='CASH'?'Espèces':p.method==='CARD'?'Carte':p.method==='TRANSFER'?'Virement':'Autre'}</td><td>{eur(Number(p.amount))}</td></tr>)}</tbody></table></div></div>
   </section>
   <aside className="stack">
    <div className="card"><div className="section-title"><div><h2><Scale size={19}/> Contrôle du tiroir</h2></div></div><div className="money-line"><span>Espèces théoriques</span><strong>{eur(session.expectedAmount==null?expected:Number(session.expectedAmount))}</strong></div><div className="money-line"><span>Espèces comptées</span><strong>{counted==null?'—':eur(counted)}</strong></div><div className="money-line due"><span>Écart</span><strong>{diff==null?'—':eur(diff)}</strong></div>{session.closedAt&&<div className="note-box gap-top"><small>Clôturée le</small><p>{dateFr(session.closedAt)}</p></div>}</div>
    <div className="card"><div className="section-title"><div><h2>Mouvements tiroir</h2></div><strong>{session.movements.length}</strong></div>{session.movements.map(m=><div className="money-line" key={m.id}><span>{m.label}<small style={{display:'block'}}>{m.type}</small></span><strong>{eur(Number(m.amount))}</strong></div>)}</div>
    <div className="card"><div className="section-title"><div><h2>Contrôle responsable</h2></div></div><p className="muted">Rapport généré depuis Luxury Phone Manager V14. Pour une clôture définitive, utilisez la page Caisse puis saisissez le comptage réel.</p><div className="signature-card"><div style={{height:48}}/><small>Visa / signature responsable</small></div></div>
   </aside>
  </div>
 </AppShell>
}
