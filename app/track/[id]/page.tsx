import { prisma } from '@/lib/prisma'
import { statusLabel, statusClass, dateFr } from '@/lib/format'
import { notFound } from 'next/navigation'
import { CheckCircle2, Clock3, Smartphone, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function Track({ params }: { params: Promise<{ id: string }> }) {
  const { id: token } = await params
  if (!token || token.length > 256) notFound()

  // The public route must never resolve a repair by its internal database ID.
  const r = await prisma.repair.findUnique({
    where: { trackingToken: token },
    include: {
      client: true,
      payments: { select: { amount: true } },
      events: { orderBy: { createdAt: 'desc' }, take: 8 },
    },
  })
  if (!r) notFound()

  const totalCents = Math.round(Number(r.total) * 100)
  const paidCents = r.payments.reduce((sum, p) => sum + Math.round(Number(p.amount) * 100), 0)
  const dueCents = Math.max(0, totalCents - paidCents)
  const paymentStatus = totalCents <= 0 ? 'Montant à confirmer' : dueCents === 0 ? 'Réglé' : 'Reste à régler'
  const publicEvents = r.events.filter(e => ['STATUS', 'QUOTE', 'WARRANTY'].includes(e.type))

  return <div className="track-page">
    <div className="track-card">
      <div className="track-brand">LUXURY <span>PHONE</span><small>Suivi réparation</small></div>
      <div className="track-head">
        <div><div className="eyebrow">DOSSIER #{r.ticketNo}</div><h1>{r.deviceBrand} {r.deviceModel}</h1><p>{r.client.name}</p></div>
        <span className={`badge large ${statusClass[r.status]}`}>{statusLabel[r.status]}</span>
      </div>
      <div className="track-status"><CheckCircle2/><div><small>Statut actuel</small><strong>{statusLabel[r.status]}</strong><p>{r.publicNotes || 'Votre dossier est pris en charge par notre atelier.'}</p></div></div>
      <div className="track-info"><CheckCircle2/><div><small>Règlement</small><b>{paymentStatus}</b></div></div>
      {r.promisedAt && <div className="track-info"><Clock3/><div><small>Date estimée</small><b>{dateFr(r.promisedAt)}</b></div></div>}
      {r.warrantyUntil && <div className="track-info"><ShieldCheck/><div><small>Garantie atelier</small><b>Active jusqu'au {dateFr(r.warrantyUntil)}</b></div></div>}
      <div className="track-events"><h3>Historique récent</h3>{publicEvents.map(e => <div key={e.id}><span/><div><b>{e.title}</b><small>{dateFr(e.createdAt)}</small></div></div>)}</div>
      <footer>Luxury Phone · Suivi sécurisé de votre réparation</footer>
    </div>
  </div>
}
