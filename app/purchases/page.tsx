import {redirect} from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import {getSession} from '@/lib/auth'
import {prisma} from '@/lib/prisma'
import {eur} from '@/lib/format'
import {Truck,PackageCheck,AlertTriangle,ShoppingCart,ArrowRight} from 'lucide-react'

export default async function Page(){
 if(!(await getSession()))redirect('/login')
 const items=await prisma.inventoryItem.findMany({orderBy:[{quantity:'asc'},{name:'asc'}]})
 const value=items.reduce((a,i)=>a+Number(i.buyPrice)*i.quantity,0)
 const low=items.filter(i=>i.quantity<=i.minQuantity)
 const suggested=low.map(i=>{const target=Math.max(i.minQuantity*2,1);const qty=Math.max(1,target-i.quantity);return{...i,suggestedQty:qty,suggestedCost:Number(i.buyPrice)*qty}})
 const budget=suggested.reduce((a,i)=>a+i.suggestedCost,0)
 const marginAvg=items.length?items.reduce((a,i)=>a+(Number(i.sellPrice)-Number(i.buyPrice)),0)/items.length:0
 return <AppShell><div style={{maxWidth:1450,margin:'0 auto'}}>
  <div className="v6-title-row"><div><div className="eyebrow">RÉAPPROVISIONNEMENT · V15.4</div><h1>Achats & fournisseurs</h1><p>Préparez les commandes à partir des seuils de stock et des coûts d’achat réels.</p></div><div className="metric-pill"><Truck size={18}/><span>Budget suggéré</span><b>{eur(budget)}</b></div></div>
  <div className="grid kpi-grid"><div className="card kpi-card"><span className="kpi-icon"><PackageCheck/></span><div><small>Références suivies</small><strong>{items.length}</strong><em>Stock atelier</em></div></div><div className="card kpi-card"><span className="kpi-icon"><AlertTriangle/></span><div><small>À commander</small><strong>{low.length}</strong><em>Au seuil ou en dessous</em></div></div><div className="card kpi-card"><span className="kpi-icon"><Truck/></span><div><small>Valeur achat stock</small><strong>{eur(value)}</strong><em>Valorisation actuelle</em></div></div><div className="card kpi-card"><span className="kpi-icon"><ShoppingCart/></span><div><small>Marge unitaire moyenne</small><strong>{eur(marginAvg)}</strong><em>Prix vente - achat</em></div></div></div>
  <section className="card gap-top"><div className="section-title"><div><h2>Plan de réapprovisionnement</h2><p>Quantité suggérée pour remonter environ à deux fois le seuil minimum.</p></div><Link className="btn secondary" href="/inventory">Gérer le stock <ArrowRight size={15}/></Link></div><div className="table-wrap"><table><thead><tr><th>SKU</th><th>Référence</th><th>Stock</th><th>Seuil</th><th>Qté suggérée</th><th>Coût unitaire</th><th>Budget estimé</th></tr></thead><tbody>{suggested.map(i=><tr key={i.id} className="low-stock"><td>{i.sku}</td><td><b>{i.name}</b><small className="cell-sub">{i.category}</small></td><td><span className="badge red">{i.quantity}</span></td><td>{i.minQuantity}</td><td><b>{i.suggestedQty}</b></td><td>{eur(Number(i.buyPrice))}</td><td><b>{eur(i.suggestedCost)}</b></td></tr>)}</tbody></table></div>{!suggested.length&&<div className="empty">Aucun réapprovisionnement nécessaire selon les seuils actuels.</div>}</section>
  <section className="card gap-top"><div className="section-title"><div><h2>Catalogue coûts & marges</h2><p>Lecture complète des prix d’achat, de vente et de la marge unitaire.</p></div></div><div className="table-wrap"><table><thead><tr><th>SKU</th><th>Référence</th><th>Catégorie</th><th>Qté</th><th>Achat</th><th>Vente</th><th>Marge</th></tr></thead><tbody>{items.map(i=><tr key={i.id}><td>{i.sku}</td><td><b>{i.name}</b></td><td>{i.category}</td><td><span className="plan-pill"><PackageCheck size={13}/>{i.quantity}</span></td><td>{eur(Number(i.buyPrice))}</td><td>{eur(Number(i.sellPrice))}</td><td><b>{eur(Number(i.sellPrice)-Number(i.buyPrice))}</b></td></tr>)}</tbody></table></div></section>
 </div></AppShell>
}
