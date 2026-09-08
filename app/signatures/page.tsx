import {redirect} from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import {getSession} from '@/lib/auth'
import {prisma} from '@/lib/prisma'
import {PenLine,TabletSmartphone,CheckCircle2} from 'lucide-react'

export default async function SignaturesPage(){
 const s=await getSession();if(!s)redirect('/login')
 const repairs=await prisma.repair.findMany({where:{status:{notIn:['DELIVERED','CANCELLED']}},orderBy:{updatedAt:'desc'},take:30,include:{client:true}})
 return <AppShell>
  <div className="v6-title-row"><div><div className="eyebrow">SIGNATURE DESK · V14</div><h1>Tablette de signature</h1><p>Ouvrez un dossier sur une tablette et faites signer le client au comptoir.</p></div></div>
  <div className="card gap-top"><div className="section-title"><div><h2><TabletSmartphone size={19}/> Mode comptoir</h2><p>Sur l’iPad ou la tablette, ouvrez le lien de signature d’un dossier. La page est volontairement simple et adaptée au tactile.</p></div></div></div>
  <div className="stack gap-top">{repairs.map(r=><div className="card" key={r.id}><div className="section-title"><div><h2>TKT-{String(r.ticketNo).padStart(5,'0')} · {r.deviceBrand} {r.deviceModel}</h2><p>{r.client.name} · {r.issue}</p></div>{r.customerSignature?<span className="badge status-ready"><CheckCircle2 size={14}/> SIGNÉ</span>:<span className="badge status-waiting">À SIGNER</span>}</div><div className="detail-actions"><Link className="btn secondary" href={`/repairs/${r.id}`}>Voir dossier</Link><Link className="btn" href={`/sign/${r.trackingToken||r.id}`} target="_blank"><PenLine size={16}/> Ouvrir sur tablette</Link></div></div>)}{!repairs.length&&<div className="empty">Aucun dossier actif.</div>}</div>
 </AppShell>
}
