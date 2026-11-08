import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { recordRepairPayment, PaymentError } from '@/lib/repair-payment'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })
  const form = await req.formData()
  const repairId = String(form.get('repairId') ?? '')
  try {
    await recordRepairPayment({
      repairId, userId: session.id, quick: true,
      amount: Number(form.get('amount') ?? 0),
      method: String(form.get('method') ?? 'CARD'),
      note: String(form.get('note') ?? '') || null
    })
    return NextResponse.redirect(new URL(`/repairs/${repairId}?payment=ok`, req.url), 303)
  } catch (error) {
    if (!(error instanceof PaymentError)) throw error
    if (error.code === 'PAID') return NextResponse.redirect(new URL(`/repairs/${repairId}?payment=paid`, req.url), 303)
    const codes: Record<string, string> = { OVERPAY: 'overpay', CASH_CLOSED: 'cash-closed', INVALID: 'invalid', NOT_FOUND: 'not-found', RETRY: 'retry' }
    return NextResponse.redirect(new URL(`/cash/quick?error=${codes[error.code] ?? 'invalid'}`, req.url), 303)
  }
}
