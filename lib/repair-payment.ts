import { Prisma, PaymentMethod } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export class PaymentValidationError extends Error {
  constructor(message: string, public readonly status: number = 400) {
    super(message)
    this.name = 'PaymentValidationError'
  }
}

const methods = new Set<PaymentMethod>(['CASH', 'CARD', 'TRANSFER', 'OTHER'])

export function parsePayment(amount: string, method: string) {
  const raw = amount.trim()
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(raw)) throw new PaymentValidationError('Montant invalide')
  const cents = Math.round(Number(raw) * 100)
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 9999999999) throw new PaymentValidationError('Montant invalide')
  if (!methods.has(method as PaymentMethod)) throw new PaymentValidationError('Mode de paiement invalide')
  return { cents, method: method as PaymentMethod }
}

export async function recordRepairPayment(input: {
  repairId: string
  amountCents: number
  method: PaymentMethod
  note: string | null
  userId: string
  source: 'direct' | 'quick'
}) {
  // SERIALIZABLE makes concurrent payment submissions for one repair conflict
  // instead of both applying the same outdated outstanding balance.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async tx => {
        const repair = await tx.repair.findUnique({
          where: { id: input.repairId },
          include: { payments: true, invoice: true },
        })
        if (!repair) throw new PaymentValidationError('Dossier introuvable', 404)
        const totalCents = Math.round(Number(repair.total) * 100)
        const paidCents = repair.payments.reduce((sum, p) => sum + Math.round(Number(p.amount) * 100), 0)
        const dueCents = Math.max(0, totalCents - paidCents)
        if (dueCents === 0) throw new PaymentValidationError('Dossier déjà soldé', 409)
        if (input.amountCents > dueCents) throw new PaymentValidationError('Paiement supérieur au solde', 409)

        const cash = await tx.cashSession.findFirst({ where: { status: 'OPEN' }, orderBy: { openedAt: 'desc' } })
        if (input.method === 'CASH' && !cash) throw new PaymentValidationError('Caisse fermée', 409)

        const payment = await tx.payment.create({
          data: {
            repairId: input.repairId,
            amount: new Prisma.Decimal(input.amountCents).div(100),
            method: input.method,
            note: input.note,
            cashSessionId: cash?.id ?? null,
          },
        })
        await tx.repairEvent.create({
          data: {
            repairId: input.repairId,
            userId: input.userId,
            type: 'PAYMENT',
            title: `Paiement ${(input.amountCents / 100).toFixed(2)} €`,
            detail: input.note,
          },
        })
        if (repair.invoice) {
          await tx.invoice.update({
            where: { id: repair.invoice.id },
            data: { paid: paidCents + input.amountCents >= totalCents },
          })
        }
        await tx.auditLog.create({
          data: {
            userId: input.userId,
            action: 'PAYMENT',
            entity: 'Payment',
            entityId: payment.id,
            detail: `${input.source} · ${(input.amountCents / 100).toFixed(2)} € · ${input.method}`,
          },
        })
        return payment
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' && attempt < 2) continue
      throw error
    }
  }
  throw new PaymentValidationError('Conflit de paiement, réessayez', 409)
}
