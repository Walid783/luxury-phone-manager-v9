import Link from 'next/link'
import {redirect} from 'next/navigation'
import AppShell from '@/components/AppShell'
import {getSession} from '@/lib/auth'
import {prisma} from '@/lib/prisma'
import {eur,dateFr} from '@/lib/format'
import {ReceiptText,RotateCcw,Printer} from 'lucide-react'

export default async function Page(){
 const s=await getSession();if(!s)redirect('/login')
 const sales=await prisma.posSale.findMany({take:100,orderBy:{createdAt:'desc'},include:{items:true,refunds:true}})
 return <AppShell><div style={{maxWidth:1250,margin:'0 auto'}}>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',gap:14,marginBottom:16}}><div><div className="eyebrow">HISTORIQUE POS · V15</div><h1 style={{margin:'5px 0'}}>Ventes caisse</h1><p style={{margin:0,color:'#7d8998',fontSize:10}}>Tickets, remises, paiements et remboursements.</p></div><Link className="btn" href="/pos">Nouvelle vente</Link></div>
  <div className="card"><div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Date</th><th>Caissier</th><th>Client</th><th>Articles</th><th>Paiement</th><th>Total</th><th>Remboursé</th><th>Actions</th></tr></thead><tbody>{sales.map(sale=><tr key={sale.id}><td><Link className="row-link" href={`/pos/sales/${sale.id}`}>#{sale.receiptNo}</Link></td><td>{dateFr(sale.createdAt)}</td><td>{sale.cashierName}</td><td>{sale.customerName||'—'}</td><td>{sale.items.reduce((a,i)=>a+i.quantity,0)}</td><td>{sale.paymentMethod}</td><td>{eur(Number(sale.total))}</td><td>{Number(sale.refundedAmount)>0?<span style={{color:'#c74352'}}>{eur(Number(sale.refundedAmount))}</span>:'—'}</td><td><div style={{display:'flex',gap:6}}><Link className="btn secondary" href={`/pos/receipt/${sale.id}`} target="_blank"><Printer size={14}/></Link><Link className="btn secondary" href={`/pos/sales/${sale.id}`}><RotateCcw size={14}/></Link></div></td></tr>)}</tbody></table></div>{!sales.length&&<div className="empty"><ReceiptText size={20}/> Aucune vente POS pour le moment.</div>}</div>
 </div></AppShell>
}
