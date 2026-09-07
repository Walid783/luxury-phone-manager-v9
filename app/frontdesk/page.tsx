import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { eur,statusClass,statusLabel } from '@/lib/format'
import { Plus,Search,Smartphone,CheckCircle2,Clock3,PackageSearch,Wrench,UserRound,ArrowRight,ScanLine,Sparkles,ClipboardCheck,WalletCards } from 'lucide-react'

export default async function Frontdesk(){
 const s=await getSession(); if(!s)redirect('/login')
 const [latest,ready,waiting,repairing]=await Promise.all([
  prisma.repair.findMany({take:7,orderBy:{createdAt:'desc'},include:{client:true,payments:true}}),
  prisma.repair.count({where:{status:'READY'}}),prisma.repair.count({where:{status:'WAITING_APPROVAL'}}),prisma.repair.count({where:{status:'REPAIRING'}})
 ])
 return <AppShell>
  <div className="v8-dash-head"><div><div className="eyebrow">FRONT DESK · V13 COMPLETE ERP</div><h1>Réception express</h1><p>Un écran pensé pour l’accueil client et les actions rapides au comptoir.</p></div><Link className="btn" href="/repairs/new"><Plus size={17}/> Nouvelle prise en charge</Link></div>
  <div className="v8-front-grid">
   <Link href="/repairs/new" className="card v8-front-hero"><div className="v8-front-icon"><Smartphone size={28}/></div><div><span>01</span><h2>Prendre en charge un appareil</h2><p>Client, appareil, état d’entrée, panne et montant estimé.</p></div><ArrowRight/></Link>
   <Link href="/repairs?status=READY" className="card v8-front-action green"><CheckCircle2/><strong>{ready}</strong><span>Prêts à restituer</span><small>Encaisser et remettre au client</small></Link>
   <Link href="/repairs?status=WAITING_APPROVAL" className="card v8-front-action amber"><Clock3/><strong>{waiting}</strong><span>En attente d’accord</span><small>Relancer les devis en attente</small></Link>
   <Link href="/repairs?status=REPAIRING" className="card v8-front-action blue"><Wrench/><strong>{repairing}</strong><span>En réparation</span><small>Suivre l’avancement atelier</small></Link>
  </div>
  <div className="v8-front-tools"><Link href="/repairs" className="card"><Search/><div><b>Recherche dossier</b><small>Ticket, téléphone, IMEI, client</small></div></Link><Link href="/clients" className="card"><UserRound/><div><b>Fiche client</b><small>Historique et coordonnées</small></div></Link><Link href="/inventory" className="card"><PackageSearch/><div><b>Disponibilité pièce</b><small>Contrôler le stock instantanément</small></div></Link><Link href="/cash" className="card"><WalletCards/><div><b>Caisse</b><small>Encaissements de la journée</small></div></Link></div>
  <section className="card v8-recent"><div className="section-title"><div><h2><ClipboardCheck size={18}/> Dernières prises en charge</h2><p>Accès immédiat aux dossiers reçus récemment.</p></div><Link className="text-link" href="/repairs">Voir l’atelier <ArrowRight size={14}/></Link></div><div className="v8-recent-list">{latest.map(r=>{const paid=r.payments.reduce((a,p)=>a+Number(p.amount),0),due=Math.max(0,Number(r.total)-paid);return <Link href={`/repairs/${r.id}`} key={r.id}><span className="v8-ticket-no">TKT-{String(r.ticketNo).padStart(5,'0')}</span><div><b>{r.deviceBrand} {r.deviceModel}</b><small>{r.client.name} · {r.client.phone}</small></div><span className={`badge ${statusClass[r.status]}`}>{statusLabel[r.status]}</span><strong>{eur(due)}</strong><ArrowRight size={15}/></Link>})}{!latest.length&&<div className="empty">Aucun dossier enregistré.</div>}</div></section>
 </AppShell>
}
