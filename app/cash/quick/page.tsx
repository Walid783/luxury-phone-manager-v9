import {redirect} from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import {getSession} from '@/lib/auth'
import {prisma} from '@/lib/prisma'
import {eur} from '@/lib/format'
import {ArrowLeft,Banknote,WalletCards,Landmark,ReceiptText,Zap} from 'lucide-react'

export default async function QuickCash(){
 const s=await getSession();if(!s)redirect('/login')
 const [openCash,repairs]=await Promise.all([
  prisma.cashSession.findFirst({where:{status:'OPEN'},include:{openedBy:true}}),
  prisma.repair.findMany({where:{status:{notIn:['DELIVERED','CANCELLED']}},orderBy:{updatedAt:'desc'},take:60,include:{client:true,payments:true}})
 ])
 const dueRepairs=repairs.map(r=>{const paid=r.payments.reduce((a,p)=>a+Number(p.amount),0);return {...r,due:Math.max(0,Number(r.total)-paid)}}).filter(r=>r.due>0)
 return <AppShell>
  <div style={{maxWidth:1200,margin:'0 auto'}}>
   <div className="detail-top"><Link className="back" href="/cash"><ArrowLeft size={17}/> Retour Caisse Pro</Link></div>
   <div className="hero-head compact"><div><div className="eyebrow">V15 · ENCAISSEMENT RAPIDE</div><h1>Encaisser un dossier en quelques secondes</h1><p>Sélectionnez le dossier, le montant et le moyen de paiement. Le règlement est rattaché automatiquement à la réparation et à la session de caisse.</p></div><div className="hero-badges"><span className={`badge large ${openCash?'status-ready':'status-waiting'}`}>{openCash?`CAISSE OUVERTE · ${openCash.openedBy.name}`:'CAISSE FERMÉE'}</span></div></div>

   <div className="detail-grid">
    <section className="card">
     <div className="section-title"><div><h2><Zap size={19}/> Encaissement express</h2><p>{dueRepairs.length} dossier(s) avec un solde restant.</p></div></div>
     <form action="/api/cash/quick-payment" method="post" className="form">
      <div className="field full"><label>Dossier à encaisser</label><select name="repairId" required defaultValue=""><option value="" disabled>Choisir un dossier…</option>{dueRepairs.map(r=><option key={r.id} value={r.id}>TKT-{String(r.ticketNo).padStart(5,'0')} · {r.client.name} · {r.deviceBrand} {r.deviceModel} · reste {eur(r.due)}</option>)}</select></div>
      <div className="field"><label>Montant €</label><input name="amount" type="number" min="0.01" step="0.01" required placeholder="Ex. 119"/></div>
      <div className="field"><label>Moyen de paiement</label><select name="method" defaultValue="CARD"><option value="CARD">Carte bancaire</option><option value="CASH">Espèces</option><option value="TRANSFER">Virement</option><option value="OTHER">Autre</option></select></div>
      <div className="field full"><label>Référence / note</label><input name="note" placeholder="Ex. SumUp, acompte, référence transaction…"/></div>
      <div className="field full"><button className="btn"><ReceiptText size={17}/> Encaisser maintenant</button></div>
     </form>
     {!dueRepairs.length&&<div className="success-box gap-top">Aucun dossier ouvert avec un montant restant à encaisser.</div>}
    </section>

    <aside className="stack">
     <div className="card"><div className="section-title"><div><h2>Modes disponibles</h2></div></div><div className="money-line"><span><Banknote size={15}/> Espèces</span><strong>{openCash?'Session active':'Ouvrir la caisse'}</strong></div><div className="money-line"><span><WalletCards size={15}/> Carte</span><strong>Disponible</strong></div><div className="money-line"><span><Landmark size={15}/> Virement</span><strong>Disponible</strong></div><div className="money-line"><span>Autre</span><strong>Disponible</strong></div></div>
     <div className="card"><div className="section-title"><div><h2>Contrôle V15</h2><p>L'encaissement ne peut pas dépasser le reste dû. Un paiement espèces nécessite une caisse ouverte.</p></div></div></div>
    </aside>
   </div>
  </div>
 </AppShell>
}
