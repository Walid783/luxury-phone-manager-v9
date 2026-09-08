import {NextResponse} from 'next/server'
import {prisma} from '@/lib/prisma'
import {getSession} from '@/lib/auth'
import {audit} from '@/lib/audit'

const allowed=new Set(['CASH','CARD','TRANSFER','OTHER'])

export async function POST(req:Request){
 const s=await getSession();if(!s)return new NextResponse('Unauthorized',{status:401})
 const f=await req.formData()
 const repairId=String(f.get('repairId')||'')
 const amount=Number(f.get('amount')||0)
 const method=String(f.get('method')||'CARD')
 const note=String(f.get('note')||'')||null
 if(!repairId||!Number.isFinite(amount)||amount<=0||!allowed.has(method))return new NextResponse('Invalid payment',{status:400})
 const repair=await prisma.repair.findUnique({where:{id:repairId},include:{payments:true,invoice:true}})
 if(!repair)return new NextResponse('Repair not found',{status:404})
 const paidBefore=repair.payments.reduce((a,p)=>a+Number(p.amount),0)
 const due=Math.max(0,Number(repair.total)-paidBefore)
 if(due<=0)return NextResponse.redirect(new URL(`/repairs/${repairId}?payment=paid`,req.url),303)
 if(amount>due+0.001)return NextResponse.redirect(new URL(`/cash/quick?error=overpay`,req.url),303)
 const cash=method==='CASH'?await prisma.cashSession.findFirst({where:{status:'OPEN'}}):await prisma.cashSession.findFirst({where:{status:'OPEN'}})
 if(method==='CASH'&&!cash)return NextResponse.redirect(new URL('/cash/quick?error=cash-closed',req.url),303)
 const pay=await prisma.payment.create({data:{repairId,amount,method:method as any,note,cashSessionId:cash?.id||null}})
 await prisma.repairEvent.create({data:{repairId,userId:s.id,type:'PAYMENT',title:`Paiement rapide ${amount.toFixed(2)} €`,detail:`${method}${note?` · ${note}`:''}`}})
 const paidAfter=paidBefore+amount
 if(repair.invoice)await prisma.invoice.update({where:{id:repair.invoice.id},data:{paid:paidAfter>=Number(repair.total)}})
 await audit({userId:s.id,action:'PAYMENT',entity:'Payment',entityId:pay.id,detail:`V15 quick checkout · ${amount.toFixed(2)} € · ${method}`})
 return NextResponse.redirect(new URL(`/repairs/${repairId}?payment=ok`,req.url),303)
}
