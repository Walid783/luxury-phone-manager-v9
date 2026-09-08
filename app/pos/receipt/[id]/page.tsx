import {notFound,redirect} from 'next/navigation'
import {getSession} from '@/lib/auth'
import {prisma} from '@/lib/prisma'
import {eur,dateFr} from '@/lib/format'
import PrintPageButton from '@/components/PrintPageButton'

export default async function Page({params}:{params:Promise<{id:string}>}){
 const s=await getSession();if(!s)redirect('/login');const {id}=await params
 const sale=await prisma.posSale.findUnique({where:{id},include:{items:true,refunds:{orderBy:{createdAt:'asc'}}}});if(!sale)notFound()
 const net=Number(sale.total)-Number(sale.refundedAmount)
 return <main className="receipt-page"><style>{`
  @page{size:80mm auto;margin:4mm}.receipt-page{font-family:Arial,sans-serif;color:#111;background:#f2f2f2;min-height:100vh;padding:20px}.ticket{width:72mm;margin:0 auto;background:#fff;padding:5mm;box-shadow:0 8px 28px #0001}.center{text-align:center}.brand{font-size:20px;font-weight:900;letter-spacing:.6px}.sub{font-size:9px;margin-top:2px}.dash{border-top:1px dashed #555;margin:9px 0}.meta{font-size:9px;line-height:1.5}.line{display:flex;justify-content:space-between;gap:10px;font-size:9px;padding:3px 0}.line b{font-weight:700}.item{padding:5px 0;border-bottom:1px dotted #bbb}.item strong{display:block;font-size:9px}.item small{display:flex;justify-content:space-between;font-size:8px;margin-top:2px}.total{font-size:14px;font-weight:900;padding-top:6px}.refund{font-size:8px}.footer{font-size:8px;line-height:1.5;margin-top:10px}.actions{width:72mm;margin:10px auto;display:flex;justify-content:center}@media print{body{background:#fff}.receipt-page{padding:0;background:#fff}.ticket{box-shadow:none;width:auto}.actions{display:none}}
 `}</style><div className="actions"><PrintPageButton label="Imprimer le ticket"/></div><section className="ticket">
  <div className="center"><div className="brand">LUXURY PHONE</div><div className="sub">Poissy · Vente & réparation</div><div className="sub">Ticket caisse V15</div></div><div className="dash"/>
  <div className="meta"><div>Ticket : #{sale.receiptNo}</div><div>Date : {dateFr(sale.createdAt)}</div><div>Caissier : {sale.cashierName}</div>{sale.customerName&&<div>Client : {sale.customerName}</div>}</div><div className="dash"/>
  {sale.items.map(i=><div className="item" key={i.id}><strong>{i.name}</strong><small><span>{i.quantity} × {eur(Number(i.unitPrice))}</span><b>{eur(Number(i.lineTotal))}</b></small></div>)}
  <div className="dash"/><div className="line"><span>Sous-total</span><b>{eur(Number(sale.subtotal))}</b></div><div className="line"><span>Remise {Number(sale.discountPercent).toFixed(1)}%</span><b>- {eur(Number(sale.discountAmount))}</b></div><div className="line total"><span>TOTAL</span><b>{eur(Number(sale.total))}</b></div><div className="line"><span>Paiement</span><b>{sale.paymentMethod}</b></div>
  {Number(sale.refundedAmount)>0&&<><div className="dash"/><div className="line refund"><span>Remboursé</span><b>- {eur(Number(sale.refundedAmount))}</b></div><div className="line refund"><span>Net conservé</span><b>{eur(net)}</b></div>{sale.refunds.map(r=><div key={r.id} className="refund">{dateFr(r.createdAt)} · {r.reason} · {eur(Number(r.amount))}</div>)}</>}
  {sale.note&&<><div className="dash"/><div className="meta">Note : {sale.note}</div></>}
  <div className="dash"/><div className="footer center">Merci pour votre confiance.<br/>Conservez ce ticket pour tout échange ou remboursement.<br/>LUXURY PHONE · Poissy</div>
 </section></main>
}
