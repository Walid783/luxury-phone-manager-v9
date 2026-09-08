import {redirect} from 'next/navigation'
import AppShell from '@/components/AppShell'
import PosV15Client from '@/components/PosV15Client'
import {getSession} from '@/lib/auth'
import {prisma} from '@/lib/prisma'
import {ShoppingCart,Percent,RotateCcw,ReceiptText} from 'lucide-react'

export default async function Page(){
 const s=await getSession();if(!s)redirect('/login')
 const items=await prisma.inventoryItem.findMany({orderBy:[{quantity:'desc'},{name:'asc'}],take:500})
 const maxDiscount=s.role==='ADMIN'?50:10
 return <AppShell><div style={{maxWidth:1500,margin:'0 auto'}}>
  <div style={{display:'flex',justifyContent:'space-between',gap:18,alignItems:'flex-end',marginBottom:16}}><div><div className="eyebrow">POS · VENTE RAPIDE · V15</div><h1 style={{margin:'5px 0 6px'}}>Vente rapide</h1><p style={{margin:0,color:'#7d8998',fontSize:10}}>Panier multi-articles, remises contrôlées, stock temps réel, remboursements et ticket client.</p></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><span className="badge"><ShoppingCart size={14}/> Panier multi-articles</span><span className="badge"><Percent size={14}/> Remise {maxDiscount}% max</span><span className="badge"><RotateCcw size={14}/> Remboursement</span><span className="badge"><ReceiptText size={14}/> Ticket 80 mm</span></div></div>
  <PosV15Client items={items.map(i=>({id:i.id,sku:i.sku,name:i.name,category:i.category,quantity:i.quantity,sellPrice:Number(i.sellPrice)}))} maxDiscount={maxDiscount} isAdmin={s.role==='ADMIN'}/>
 </div></AppShell>
}
