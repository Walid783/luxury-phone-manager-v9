import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { recordRepairPayment, PaymentError } from '@/lib/repair-payment'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })
  const { id } = await params
  const form = await req.formData()
  try {
    await recordRepairPayment({
      repairId: id, userId: session.id,
      amount: Number(form.get('amount') ?? 0),
      method: String(form.get('method') ?? 'CASH'),
      note: String(form.get('note') ?? '') || null
    })
    return NextResponse.redirect(new URL(`/repairs/${id}?payment=ok`, req.url), 303)
  } catch (error) {
    if (!(error instanceof PaymentError)) throw error
    const status = error.code === 'NOT_FOUND' ? 404 : error.code === 'RETRY' ? 503 : error.code === 'INVALID' ? 400 : 409
    return new NextResponse(`Payment rejected: ${error.code}`, { status })
  }
}
