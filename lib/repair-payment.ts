import { Prisma, PaymentMethod } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const methods = new Set<string>(['CASH', 'CARD', 'TRANSFER', 'OTHER'])

export class PaymentError extends Error {
  constructor(public code: 'INVALID' | 'NOT_FOUND' | 'PAID' | 'OVERPAY' | 'CASH_CLOSED' | 'RETRY') {
    super(code)
  }
}

export async function recordRepairPayment(input: {
  repairId: string
  userId: string
  amount: number
  method: string
  note?: string | null
  quick?: boolean
}) {
  if (!input.repairId || !Number.isSafeInteger(Math.round(input.amount * 100)) ||
      !Number.isFinite(input.amount) || input.amount <= 0 ||
      !/^\d+(?:\.\d{1,2})?$/.test(String(input.amount)) || !methods.has(input.method)) {
    throw new PaymentError('INVALID')
  }

  // SERIALIZABLE + retry ensures two concurrent payments cannot both consume the same remaining balance.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async tx => {
        const repair = await tx.repair.findUnique({
          where: { id: input.repairId }, include: { payments: true, invoice: true }
        })
        if (!repair) throw new PaymentError('NOT_FOUND')
        const paidCents = repair.payments.reduce((sum, p) => sum + Math.round(Number(p.amount) * 100), 0)
        const totalCents = Math.round(Number(repair.total) * 100)
        const amountCents = Math.round(input.amount * 100)
        if (paidCents >= totalCents) throw new PaymentError('PAID')
        if (amountCents > totalCents - paidCents) throw new PaymentError('OVERPAY')
        const cashSession = await tx.cashSession.findFirst({ where: { status: 'OPEN' }, orderBy: { openedAt: 'desc' } })
        if (input.method === 'CASH' && !cashSession) throw new PaymentError('CASH_CLOSED')
        const payment = await tx.payment.create({
          data: {
            repairId: input.repairId, amount: new Prisma.Decimal(amountCents).div(100),
            method: input.method as PaymentMethod, note: input.note ?? null,
            cashSessionId: cashSession?.id ?? null
          }
        })
        await tx.repairEvent.create({
          data: {
            repairId: input.repairId, userId: input.userId, type: 'PAYMENT',
            title: `${input.quick ? 'Paiement rapide' : 'Paiement'} ${(amountCents / 100).toFixed(2)} €`,
            detail: input.note ?? null
          }
        })
        if (repair.invoice) {
          await tx.invoice.update({
            where: { id: repair.invoice.id },
            data: { paid: paidCents + amountCents >= totalCents }
          })
        }
        await tx.auditLog.create({
          data: { userId: input.userId, action: 'PAYMENT', entity: 'Payment', entityId: payment.id,
            detail: `${(amountCents / 100).toFixed(2)} € · ${input.method}` }
        })
        return payment
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    } catch (err) {
      if (err instanceof PaymentError) throw err
      if ((err as { code?: string }).code !== 'P2034') throw err
      if (attempt === 2) throw new PaymentError('RETRY')
    }
  }
  throw new PaymentError('RETRY')
}
