import {NextResponse} from 'next/server'
import {prisma} from '@/lib/prisma'
import {getSession} from '@/lib/auth'
import {audit} from '@/lib/audit'

const methods=['CASH','CARD','TRANSFER','OTHER'] as const
export async function POST(req:Request){
 const s=await getSession();if(!s)return new NextResponse('Unauthorized',{status:401})
 let body:any;try{body=await req.json()}catch{return new NextResponse('Invalid payload',{status:400})}
 const rawItems=Array.isArray(body.items)?body.items:[]
 if(!rawItems.length)return new NextResponse('Panier vide.',{status:400})
 const paymentMethod=String(body.paymentMethod||'CARD') as typeof methods[number]
 if(!methods.includes(paymentMethod))return new NextResponse('Moyen de paiement invalide.',{status:400})
 const requestedDiscount=Math.max(0,Number(body.discountPercent||0));const maxDiscount=s.role==='ADMIN'?50:10
 if(!Number.isFinite(requestedDiscount)||requestedDiscount>maxDiscount)return new NextResponse(`Remise maximale autorisée : ${maxDiscount}%.`,{status:403})
 const wanted=new Map<string,number>()
 for(const x of rawItems){const id=String(x.inventoryItemId||'');const qty=Math.floor(Number(x.quantity||0));if(!id||!Number.isFinite(qty)||qty<=0)return new NextResponse('Quantité invalide.',{status:400});wanted.set(id,(wanted.get(id)||0)+qty)}
 const ids=[...wanted.keys()]
 const products=await prisma.inventoryItem.findMany({where:{id:{in:ids}}})
 if(products.length!==ids.length)return new NextResponse('Un article est introuvable.',{status:404})
 for(const p of products){const qty=wanted.get(p.id)||0;if(p.quantity<qty)return new NextResponse(`Stock insuffisant : ${p.name}.`,{status:409})}
 const subtotal=products.reduce((sum,p)=>sum+Number(p.sellPrice)*(wanted.get(p.id)||0),0)
 const discountAmount=Math.round(subtotal*requestedDiscount)/100
 const total=Math.round((subtotal-discountAmount)*100)/100
 if(total<=0)return new NextResponse('Total invalide.',{status:400})
 const cashSession=paymentMethod==='CASH'?await prisma.cashSession.findFirst({where:{status:'OPEN'},orderBy:{openedAt:'desc'}}):null
 if(paymentMethod==='CASH'&&!cashSession)return new NextResponse('Ouvrez la caisse avant un paiement en espèces.',{status:409})
 const sale=await prisma.$transaction(async tx=>{
  for(const p of products){const qty=wanted.get(p.id)||0;await tx.inventoryItem.update({where:{id:p.id},data:{quantity:{decrement:qty}}})}
  const created=await tx.posSale.create({data:{cashierId:s.id,cashierName:s.name||'Utilisateur',customerName:String(body.customerName||'').trim()||null,subtotal,discountPercent:requestedDiscount,discountAmount,total,paymentMethod,note:String(body.note||'').trim()||null,items:{create:products.map(p=>{const quantity=wanted.get(p.id)||0;const unitPrice=Number(p.sellPrice);return{inventoryItemId:p.id,sku:p.sku,name:p.name,quantity,unitPrice,lineTotal:Math.round(unitPrice*quantity*100)/100}})}}})
  if(paymentMethod==='CASH'&&cashSession)await tx.cashMovement.create({data:{cashSessionId:cashSession.id,type:'SALE',amount:total,label:`Vente POS #${created.receiptNo}`,note:created.customerName||null}})
  return created
 })
 await audit({userId:s.id,action:'PAYMENT',entity:'PosSale',entityId:sale.id,detail:`Vente POS #${sale.receiptNo} · ${total.toFixed(2)} € · remise ${requestedDiscount}% · ${paymentMethod}`})
 return NextResponse.json({id:sale.id,receiptNo:sale.receiptNo})
}
