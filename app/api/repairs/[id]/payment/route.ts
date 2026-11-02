import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { audit } from '@/lib/audit'

const ALLOWED_METHODS = new Set(['CASH', 'CARD', 'TRANSFER', 'OTHER'])

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const { id } = await params
  const form = await req.formData()
  const amount = Number(form.get('amount') || 0)
  const method = String(form.get('method') || 'CARD')
  const note = String(form.get('note') || '').trim() || null

  if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) !== amount * 100 && Math.abs(Math.round(amount * 100) - amount * 100) > 1e-7 || !ALLOWED_METHODS.has(method)) {
    return new NextResponse('Invalid payment amount or method', { status: 400 })
  }

  const repair = await prisma.repair.findUnique({
    where: { id },
    include: { payments: true, invoice: true },
  })
  if (!repair) return new NextResponse('Repair not found', { status: 404 })

  const totalCents = Math.round(Number(repair.total) * 100)
  const paidCents = repair.payments.reduce((sum, payment) => sum + Math.round(Number(payment.amount) * 100), 0)
  const amountCents = Math.round(amount * 100)
  const dueCents = Math.max(0, totalCents - paidCents)

  if (dueCents === 0) return NextResponse.redirect(new URL(`/repairs/${id}?payment=paid`, req.url), 303)
  if (amountCents > dueCents) return new NextResponse('Payment exceeds outstanding balance', { status: 409 })

  const cash = await prisma.cashSession.findFirst({ where: { status: 'OPEN' } })
  if (method === 'CASH' && !cash) return new NextResponse('Cash session is closed', { status: 409 })

  const payment = await prisma.payment.create({
    data: {
      repairId: id,
      amount,
      method: method as 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER',
      note,
      cashSessionId: cash?.id || null,
    },
  })

  await prisma.repairEvent.create({
    data: {
      repairId: id,
      userId: session.id,
      type: 'PAYMENT',
      title: `Paiement ${amount.toFixed(2)} €`,
      detail: note,
    },
  })
  await audit({
    userId: session.id,
    action: 'PAYMENT',
    entity: 'Payment',
    entityId: payment.id,
    detail: `${amount.toFixed(2)} € · ${method}`,
  })

  if (repair.invoice) {
    await prisma.invoice.update({
      where: { id: repair.invoice.id },
      data: { paid: paidCents + amountCents >= totalCents },
    })
  }

  return NextResponse.redirect(new URL(`/repairs/${id}?payment=ok`, req.url), 303)
}
