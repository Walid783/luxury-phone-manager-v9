import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { audit } from '@/lib/audit'

const allowedMethods = new Set(['CASH', 'CARD', 'TRANSFER', 'OTHER'])
const checklistKeys = ['power', 'screen', 'touch', 'charge', 'cameras', 'audio', 'network', 'biometrics'] as const
const allPassed = (section: any) => checklistKeys.every(key => section?.items?.[key] === 'PASS')

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const { id } = await params
  const form = await req.formData()
  const method = String(form.get('method') || '')
  if (!allowedMethods.has(method)) return new NextResponse('Mode de règlement invalide', { status: 400 })

  try {
    const result = await prisma.$transaction(async tx => {
      const repair = await tx.repair.findUnique({
        where: { id },
        include: { client: true, payments: true, invoice: true },
      })
      if (!repair) throw new Error('Réparation introuvable.')
      if (repair.status !== 'READY') throw new Error('La réparation doit être marquée Prête avant le retrait.')

      let checklist: any = {}
      try { checklist = repair.intakeChecklist ? JSON.parse(repair.intakeChecklist) : {} } catch {}
      if (!allPassed(checklist.quality)) throw new Error('Le contrôle qualité doit être validé.')
      if (!allPassed(checklist.restitution)) throw new Error('Les tests de restitution doivent être validés.')
      if (!repair.customerSignature || !repair.signatureAt) throw new Error('La signature du client est obligatoire.')

      const alreadyPaid = repair.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
      const due = Math.max(0, Number(repair.total) - alreadyPaid)
      const cashSession = await tx.cashSession.findFirst({ where: { status: 'OPEN' } })
      if (method === 'CASH' && !cashSession) throw new Error('Ouvre la caisse avant d’enregistrer un paiement en espèces.')

      let paymentId: string | null = null
      if (due > 0) {
        const payment = await tx.payment.create({
          data: {
            repairId: id,
            amount: due,
            method: method as any,
            note: 'Solde encaissé lors du retrait du téléphone',
            cashSessionId: cashSession?.id || null,
          },
        })
        paymentId = payment.id
        await tx.repairEvent.create({
          data: {
            repairId: id,
            userId: session.id,
            type: 'PAYMENT',
            title: `Solde encaissé au retrait : ${due.toFixed(2)} €`,
            detail: method,
          },
        })
      }

      if (repair.invoice) {
        await tx.invoice.update({ where: { id: repair.invoice.id }, data: { paid: true } })
      } else {
        await tx.invoice.create({ data: { repairId: id, paid: true } })
      }

      const now = new Date()
      await tx.repair.update({
        where: { id },
        data: {
          status: 'DELIVERED',
          deliveredAt: repair.deliveredAt || now,
          warrantyUntil: repair.warrantyUntil || new Date(now.getTime() + Math.max(0, repair.warrantyDays) * 86400000),
          events: {
            create: {
              type: 'STATUS',
              title: 'Téléphone récupéré par le client',
              detail: due > 0 ? `Reste encaissé : ${due.toFixed(2)} € · ${method}` : 'Solde déjà réglé.',
              userId: session.id,
            },
          },
        },
      })
      return { due, paymentId }
    }, { isolationLevel: 'Serializable' })

    if (result.paymentId) {
      await audit({
        userId: session.id,
        action: 'PAYMENT',
        entity: 'Payment',
        entityId: result.paymentId,
        detail: `Retrait réparation · ${result.due.toFixed(2)} € · ${method}`,
      })
    }
    await audit({
      userId: session.id,
      action: 'STATUS_CHANGE',
      entity: 'Repair',
      entityId: id,
      detail: 'READY → DELIVERED · téléphone récupéré',
    })
    return NextResponse.redirect(new URL(`/repairs/${id}?pickup=ok`, req.url), 303)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Impossible d’enregistrer le retrait.'
    return new NextResponse(message, { status: 409 })
  }
}
