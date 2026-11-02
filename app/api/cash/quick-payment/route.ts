import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { PaymentValidationError, parsePayment, recordRepairPayment } from '@/lib/repair-payment'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })
  const form = await req.formData()
  const repairId = String(form.get('repairId') ?? '').trim()
  if (!repairId) return new NextResponse('Dossier manquant', { status: 400 })

  try {
    const { cents, method } = parsePayment(String(form.get('amount') ?? ''), String(form.get('method') ?? 'CARD'))
    await recordRepairPayment({
      repairId,
      amountCents: cents,
      method,
      note: String(form.get('note') ?? '').trim() || null,
      userId: session.id,
      source: 'quick',
    })
    return NextResponse.redirect(new URL(`/repairs/${repairId}?payment=ok`, req.url), 303)
  } catch (error) {
    if (error instanceof PaymentValidationError) return new NextResponse(error.message, { status: error.status })
    throw error
  }
}
