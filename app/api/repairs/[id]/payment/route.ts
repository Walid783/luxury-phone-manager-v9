import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { PaymentValidationError, parsePayment, recordRepairPayment } from '@/lib/repair-payment'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })
  const { id } = await params
  const form = await req.formData()

  try {
    const { cents, method } = parsePayment(String(form.get('amount') ?? ''), String(form.get('method') ?? 'CARD'))
    await recordRepairPayment({
      repairId: id,
      amountCents: cents,
      method,
      note: String(form.get('note') ?? '').trim() || null,
      userId: session.id,
      source: 'direct',
    })
    return NextResponse.redirect(new URL(`/repairs/${id}?payment=ok`, req.url), 303)
  } catch (error) {
    if (error instanceof PaymentValidationError) return new NextResponse(error.message, { status: error.status })
    throw error
  }
}
