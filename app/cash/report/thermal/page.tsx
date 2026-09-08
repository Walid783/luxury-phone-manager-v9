import Link from 'next/link'
import {redirect} from 'next/navigation'
import {getSession} from '@/lib/auth'
import {prisma} from '@/lib/prisma'
import {eur,dateFr} from '@/lib/format'
import PrintPageButton from '@/components/PrintPageButton'

function sum<T>(items:T[],pick:(v:T)=>number){return items.reduce((a,v)=>a+pick(v),0)}

export default async function ThermalCashReport(){
 const s=await getSession();if(!s)redirect('/login')
 const session=await prisma.cashSession.findFirst({orderBy:{openedAt:'desc'},include:{openedBy:true,payments:{include:{repair:{include:{client:true}}},orderBy:{createdAt:'asc'}},movements:{orderBy:{createdAt:'asc'}}}})
 if(!session)return <main style={{padding:32,fontFamily:'Arial'}}><h1>Aucune session de caisse</h1><Link href="/cash">Retour caisse</Link></main>
 const cash=sum(session.payments.filter(p=>p.method==='CASH'),p=>Number(p.amount))
 const card=sum(session.payments.filter(p=>p.method==='CARD'),p=>Number(p.amount))
 const transfer=sum(session.payments.filter(p=>p.method==='TRANSFER'),p=>Number(p.amount))
 const other=sum(session.payments.filter(p=>p.method==='OTHER'),p=>Number(p.amount))
 const extras=sum(session.movements.filter(m=>!['OPENING','CLOSING'].includes(m.type)),m=>Number(m.amount))
 const total=cash+card+transfer+other
 const expected=Number(session.expectedAmount??(Number(session.openingAmount)+cash+extras))
 const counted=session.closingAmount==null?null:Number(session.closingAmount)
 const diff=counted==null?null:counted-expected
 const type=session.status==='OPEN'?'RAPPORT X':'RAPPORT Z'
 return <>
  <style>{`@page{size:80mm auto;margin:0}*{box-sizing:border-box}body{margin:0;background:#eceff3;font-family:Arial,sans-serif;color:#111}.actions{width:80mm;margin:18px auto;display:flex;gap:8px;justify-content:space-between}.ticket{width:80mm;margin:0 auto 24px;background:#fff;padding:5mm 4mm;box-shadow:0 8px 30px rgba(0,0,0,.12)}.center{text-align:center}.logo{font-size:22px;font-weight:900;letter-spacing:.5px}.logo span{color:#b97812}.muted{font-size:9px;color:#555}.line{border-top:1px dashed #222;margin:3mm 0}.title{font-size:14px;font-weight:900}.row{display:flex;justify-content:space-between;gap:8px;font-size:10px;margin:1.4mm 0}.row strong{text-align:right}.big{font-size:12px;font-weight:900}.section{font-size:9px;font-weight:900;margin:3mm 0 1.5mm;text-transform:uppercase}.movement{font-size:8px;margin:1mm 0}.foot{text-align:center;font-size:8px;color:#555;margin-top:4mm}.signature{height:18mm;border-bottom:1px solid #222;margin-top:4mm}.ok{font-weight:900}.danger{font-weight:900}@media print{body{background:#fff}.actions{display:none}.ticket{margin:0;box-shadow:none}}`}</style>
  <div className="actions"><Link className="btn secondary" href="/cash/report">← Rapport complet</Link><PrintPageButton label="Imprimer 80 mm"/></div>
  <main className="ticket">
   <div className="center"><div className="logo">LUXURY <span>PHONE</span></div><div className="muted">Poissy · Atelier OS V14</div></div>
   <div className="line"/>
   <div className="center"><div className="title">{type} · CAISSE</div><div className="muted">Session {session.status==='OPEN'?'en cours':'clôturée'}</div></div>
   <div className="line"/>
   <div className="row"><span>Opérateur</span><strong>{session.openedBy.name}</strong></div>
   <div className="row"><span>Ouverture</span><strong>{dateFr(session.openedAt)}</strong></div>
   {session.closedAt&&<div className="row"><span>Clôture</span><strong>{dateFr(session.closedAt)}</strong></div>}
   <div className="section">Encaissements</div>
   <div className="row"><span>Espèces</span><strong>{eur(cash)}</strong></div>
   <div className="row"><span>Carte</span><strong>{eur(card)}</strong></div>
   <div className="row"><span>Virement</span><strong>{eur(transfer)}</strong></div>
   <div className="row"><span>Autres</span><strong>{eur(other)}</strong></div>
   <div className="line"/>
   <div className="row big"><span>TOTAL ENCAISSÉ</span><strong>{eur(total)}</strong></div>
   <div className="section">Contrôle tiroir</div>
   <div className="row"><span>Fond initial</span><strong>{eur(Number(session.openingAmount))}</strong></div>
   <div className="row"><span>Mouvements nets</span><strong>{eur(extras)}</strong></div>
   <div className="row"><span>Espèces théoriques</span><strong>{eur(expected)}</strong></div>
   <div className="row"><span>Espèces comptées</span><strong>{counted==null?'—':eur(counted)}</strong></div>
   <div className="row big"><span>ÉCART</span><strong>{diff==null?'—':eur(diff)}</strong></div>
   {session.movements.length>0&&<><div className="section">Mouvements</div>{session.movements.map(m=><div className="row movement" key={m.id}><span>{m.label}</span><strong>{eur(Number(m.amount))}</strong></div>)}</>}
   <div className="line"/>
   <div className="row"><span>Paiements</span><strong>{session.payments.length}</strong></div>
   <div className="row"><span>Statut</span><strong>{session.status==='OPEN'?'OUVERTE':'CLÔTURÉE'}</strong></div>
   <div className="signature"/>
   <div className="center muted">Visa responsable</div>
   <div className="foot">Luxury Phone Manager V14 · Rapport interne de caisse</div>
  </main>
 </>
}
