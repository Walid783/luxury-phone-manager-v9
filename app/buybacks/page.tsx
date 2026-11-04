import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const labels:Record<string,string>={ESTIMATE:'Estimation',OFFERED:'Offre envoyée',ACCEPTED:'Acceptée',RECEIVED:'Reçu en boutique',REFUSED:'Refusée',RESOLD:'Revendu'}
const money=(n:number)=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(n)
const inputStyle={width:'100%',padding:'11px 12px',border:'1px solid #d8dbe4',borderRadius:9,background:'#fff',color:'#1f2937'} as const
const fieldStyle={display:'grid',gap:5,fontSize:13,fontWeight:600,color:'#334155'} as const
export default async function Buybacks(){
 const session=await getSession()
 if(!session)redirect('/login')
 const buybacks=await prisma.buyback.findMany({orderBy:{createdAt:'desc'},take:100})
 const open=buybacks.filter(b=>!['RESOLD','REFUSED'].includes(b.status))
 const invested=buybacks.filter(b=>b.status==='RECEIVED').reduce((n,b)=>n+Number(b.offerPrice),0)
 return <AppShell>
  <div style={{display:'grid',gap:20}}>
   <header><div style={{fontSize:12,color:'#7c3aed',fontWeight:800,letterSpacing:2}}>LUXURY PHONE · REPRISES</div><h1 style={{fontSize:30,fontWeight:850,margin:'8px 0'}}>Reprise de téléphones</h1><p style={{color:'#64748b'}}>Estimations, contrôle des appareils, achats et suivi de la revente. Une offre n'est pas un achat encaissé.</p></header>
   <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
    <div className="card" style={{padding:18,flex:'1 1 180px'}}><small>Reprises en cours</small><h2>{open.length}</h2></div>
    <div className="card" style={{padding:18,flex:'1 1 180px'}}><small>Valeur des appareils reçus non revendus</small><h2>{money(invested)}</h2></div>
   </div>
   <section className="card" style={{padding:22}}>
    <h2 style={{fontSize:21,marginBottom:8}}>Nouvelle estimation</h2>
    <p style={{color:'#64748b',marginBottom:20}}>Exemple prérempli : iPhone 13 Pro 128 Go à 150 €. Compléter le nom et le numéro avant d'enregistrer.</p>
    <form method="post" action="/api/buybacks" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:15}}>
     <label style={fieldStyle}>Nom et prénom client *<input name="clientName" required maxLength={150} style={inputStyle}/></label>
     <label style={fieldStyle}>Téléphone *<input name="clientPhone" type="tel" required style={inputStyle}/></label>
     <label style={fieldStyle}>E-mail<input name="clientEmail" type="email" style={inputStyle}/></label>
     <label style={fieldStyle}>Marque<input name="brand" defaultValue="Apple" style={inputStyle}/></label>
     <label style={fieldStyle}>Modèle *<input name="model" required defaultValue="iPhone 13 Pro" style={inputStyle}/></label>
     <label style={fieldStyle}>Stockage<input name="storage" defaultValue="128 Go" style={inputStyle}/></label>
     <label style={fieldStyle}>IMEI (à vérifier en boutique)<input name="imei" style={inputStyle}/></label>
     <label style={fieldStyle}>Batterie (%)<input name="batteryHealth" type="number" min={0} max={100} style={inputStyle}/></label>
     <label style={fieldStyle}>Offre de reprise (€) *<input name="offerPrice" type="number" min={0} step="0.01" required defaultValue="150" style={inputStyle}/></label>
     <label style={fieldStyle}>Revente estimée (€) *<input name="expectedSalePrice" type="number" min={0} step="0.01" required defaultValue="299" style={inputStyle}/></label>
     <label style={fieldStyle}>Frais prévus (€) *<input name="repairCosts" type="number" min={0} step="0.01" required defaultValue="0" style={inputStyle}/></label>
     <label style={{...fieldStyle,gridColumn:'1/-1'}}>État constaté<textarea name="conditionNotes" rows={3} defaultValue="Fissures au coin inférieur droit de l'écran, marques sur le châssis. Vitre arrière apparemment intacte. Vérification technique nécessaire." style={inputStyle}/></label>
     <label style={{...fieldStyle,gridColumn:'1/-1'}}>Liens des photos (une URL par ligne, maximum 5)<textarea name="photoUrls" rows={2} placeholder="https://..." style={inputStyle}/></label>
     <div style={{gridColumn:'1/-1',display:'flex',gap:18,flexWrap:'wrap'}}>
      <label><input type="checkbox" name="screenTested"/> Écran testé</label>
      <label><input type="checkbox" name="faceIdTested"/> Face ID testé</label>
      <label><input type="checkbox" name="icloudCleared"/> iCloud / Localiser désactivé</label>
     </div>
     <button type="submit" className="btn" style={{gridColumn:'1/-1',background:'#6d28d9',color:'white',justifySelf:'start',padding:'12px 22px'}}>Enregistrer l'estimation</button>
    </form>
   </section>
   <section className="card" style={{padding:20}}>
    <h2 style={{fontSize:20,marginBottom:14}}>Dossiers de reprise</h2>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',minWidth:790}}><thead><tr><th>Client</th><th>Appareil</th><th>Offre</th><th>Revente prévue</th><th>Marge estimée</th><th>Statut / mise à jour</th></tr></thead><tbody>
     {buybacks.map(b=>{
      const est=(Number(b.expectedSalePrice)||0)-Number(b.offerPrice)-Number(b.repairCosts)
      const actual=b.actualSalePrice===null?null:Number(b.actualSalePrice)-Number(b.offerPrice)-Number(b.repairCosts)
      return <tr key={b.id}>
       <td><b>{b.clientName}</b><div style={{fontSize:12,color:'#64748b'}}>{b.clientPhone}</div></td>
       <td><b>{b.brand} {b.model}</b><div style={{fontSize:12,color:'#64748b'}}>{b.storage||'—'} · batterie {b.batteryHealth??'?'}%</div><div style={{fontSize:12,color:'#64748b'}}>{b.conditionNotes?.slice(0,80)}</div></td>
       <td>{money(Number(b.offerPrice))}</td><td>{b.expectedSalePrice!==null?money(Number(b.expectedSalePrice)):'—'}</td>
       <td>{money(actual??est)}<div style={{fontSize:11,color:'#64748b'}}>{actual===null?'prévision avant charges':'réalisée avant charges'}</div></td>
       <td><b>{labels[b.status]}</b>
        <form method="post" action="/api/buybacks" style={{display:'grid',gap:6,marginTop:8}}>
         <input type="hidden" name="action" value="update"/><input type="hidden" name="id" value={b.id}/>
         <select name="status" defaultValue={b.status} style={inputStyle}>{Object.entries(labels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
         <label style={{fontSize:11}}>Frais (€)<input name="repairCosts" type="number" min="0" step="0.01" defaultValue={Number(b.repairCosts)} style={inputStyle}/></label>
         <label style={{fontSize:11}}>Prix de vente réalisé (€)<input name="actualSalePrice" type="number" min="0" step="0.01" defaultValue={b.actualSalePrice===null?'':Number(b.actualSalePrice)} style={inputStyle}/></label>
         <button className="btn secondary">Enregistrer</button>
        </form>
       </td>
      </tr>})}
    </tbody></table></div>
    {!buybacks.length&&<p style={{padding:20,color:'#64748b'}}>Aucune reprise enregistrée pour le moment.</p>}
   </section>
  </div>
 </AppShell>
}
