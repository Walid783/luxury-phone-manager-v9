import {NextResponse} from 'next/server'
import {prisma} from '@/lib/prisma'
import {getSession} from '@/lib/auth'
import {audit} from '@/lib/audit'

const methods=['CASH','CARD','TRANSFER','OTHER'] as const
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const s=await getSession();if(!s)return new NextResponse('Unauthorized',{status:401});if(s.role!=='ADMIN')return new NextResponse('Remboursement réservé à l’administrateur.',{status:403})
 const {id}=await params;const f=await req.formData();const amount=Number(f.get('amount')||0);const reason=String(f.get('reason')||'').trim();const method=String(f.get('method')||'CARD') as typeof methods[number];const restock=f.get('restock')==='on'
 if(!Number.isFinite(amount)||amount<=0)return new NextResponse('Montant invalide.',{status:400});if(!reason)return new NextResponse('Motif obligatoire.',{status:400});if(!methods.includes(method))return new NextResponse('Moyen invalide.',{status:400})
 const sale=await prisma.posSale.findUnique({where:{id},include:{items:true}});if(!sale)return new NextResponse('Vente introuvable.',{status:404})
 const remaining=Math.max(0,Number(sale.total)-Number(sale.refundedAmount));if(amount>remaining+0.001)return new NextResponse(`Maximum remboursable : ${remaining.toFixed(2)} €`,{status:400})
 const cashSession=method==='CASH'?await prisma.cashSession.findFirst({where:{status:'OPEN'},orderBy:{openedAt:'desc'}}):null;if(method==='CASH'&&!cashSession)return new NextResponse('Ouvrez la caisse avant un remboursement espèces.',{status:409})
 await prisma.$transaction(async tx=>{
  await tx.posRefund.create({data:{saleId:id,amount,method,reason,restock,createdBy:s.name||'Administrateur'}})
  await tx.posSale.update({where:{id},data:{refundedAmount:{increment:amount}}})
  if(restock&&Math.abs(amount-Number(sale.total))<0.01){for(const item of sale.items)await tx.inventoryItem.update({where:{id:item.inventoryItemId},data:{quantity:{increment:item.quantity}}})}
  if(method==='CASH'&&cashSession)await tx.cashMovement.create({data:{cashSessionId:cashSession.id,type:'REFUND',amount:-amount,label:`Remboursement POS #${sale.receiptNo}`,note:reason}})
 })
 await audit({userId:s.id,action:'PAYMENT',entity:'PosRefund',entityId:id,detail:`Remboursement POS #${sale.receiptNo} · ${amount.toFixed(2)} € · ${method} · ${reason}`})
 return NextResponse.redirect(new URL(`/pos/sales/${id}?refund=ok`,req.url),303)
}
