import { NextResponse } from 'next/server'
import { Prisma, PaymentMethod } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { audit } from '@/lib/audit'

const allowedMethods = new Set<PaymentMethod>(['CASH', 'CARD', 'TRANSFER', 'OTHER'])

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const { id } = await params
  const form = await req.formData()
  const rawAmount = String(form.get('amount') ?? '').trim()
  const amount = Number(rawAmount)
  const method = String(form.get('method') ?? 'CASH') as PaymentMethod
  const note = String(form.get('note') ?? '').trim() || null

  if (!/^\d+(?:\.\d{1,2})?$/.test(rawAmount) || !Number.isSafeInteger(Math.round(amount * 100)) || amount <= 0) {
    return new NextResponse('Montant invalide', { status: 400 })
  }
  if (!allowedMethods.has(method)) return new NextResponse('Mode de paiement invalide', { status: 400 })

  const amountCents = Math.round(amount * 100)
  try {
    const payment = await prisma.$transaction(async tx => {
      const repair = await tx.repair.findUnique({ where: { id }, include: { payments: true, invoice: true } })
      if (!repair) throw new Error('REPAIR_NOT_FOUND')
      const totalCents = Math.round(Number(repair.total) * 100)
      const paidCents = repair.payments.reduce((sum, p) => sum + Math.round(Number(p.amount) * 100), 0)
      if (amountCents > totalCents - paidCents) throw new Error('AMOUNT_EXCEEDS_BALANCE')

      const cash = method === 'CASH' ? await tx.cashSession.findFirst({ where: { status: 'OPEN' }, orderBy: { openedAt: 'desc' } }) : null
      const created = await tx.payment.create({
        data: { repairId: id, amount: new Prisma.Decimal(amountCents).div(100), method, note, cashSessionId: cash?.id ?? null }
      })
      await tx.repairEvent.create({
        data: { repairId: id, userId: session.id, type: 'PAYMENT', title: `Paiement ${(amountCents / 100).toFixed(2)} €`, detail: note }
      })
      if (repair.invoice) {
        await tx.invoice.update({ where: { id: repair.invoice.id }, data: { paid: paidCents + amountCents >= totalCents } })
      }
      return created
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

    await audit({ userId: session.id, action: 'PAYMENT', entity: 'Payment', entityId: payment.id, detail: `${(amountCents / 100).toFixed(2)} € · ${method}` })
    return NextResponse.redirect(new URL(`/repairs/${id}?payment=ok`, req.url), 303)
  } catch (error) {
    if (error instanceof Error && error.message === 'REPAIR_NOT_FOUND') return new NextResponse('Réparation introuvable', { status: 404 })
    if (error instanceof Error && error.message === 'AMOUNT_EXCEEDS_BALANCE') return new NextResponse('Montant supérieur au reste à payer', { status: 409 })
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return new NextResponse('Paiement concurrent : actualisez le dossier avant de réessayer', { status: 409 })
    }
    throw error
  }
}
