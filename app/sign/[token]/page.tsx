import {notFound} from 'next/navigation'
import {prisma} from '@/lib/prisma'
import {eur,dateFr} from '@/lib/format'

export default async function PublicSign({params}:{params:Promise<{token:string}>}){
 const {token}=await params
 const r=await prisma.repair.findFirst({where:{OR:[{trackingToken:token},{id:token}]},include:{client:true}})
 if(!r)notFound()
 return <main style={{minHeight:'100vh',background:'#f4f7fb',padding:'32px 18px',fontFamily:'Arial,sans-serif',color:'#142033'}}>
  <div style={{maxWidth:760,margin:'0 auto'}}>
   <div style={{textAlign:'center',marginBottom:24}}><div style={{fontSize:28,fontWeight:900}}>LUXURY <span style={{color:'#c68a19'}}>PHONE</span></div><div style={{fontSize:12,color:'#64748b'}}>Signature client · Atelier OS V14</div></div>
   <section style={{background:'#fff',border:'1px solid #dfe6ef',borderRadius:18,padding:24,boxShadow:'0 10px 30px rgba(15,23,42,.06)'}}>
    <div style={{fontSize:12,fontWeight:800,color:'#b77900',letterSpacing:1}}>DOSSIER TKT-{String(r.ticketNo).padStart(5,'0')}</div>
    <h1 style={{fontSize:28,margin:'8px 0'}}>{r.deviceBrand} {r.deviceModel}</h1>
    <p style={{color:'#64748b'}}>Client : <b>{r.client.name}</b> · Déposé le {dateFr(r.createdAt)}</p>
    <div style={{display:'grid',gap:12,margin:'22px 0'}}>
     <div style={{padding:14,borderRadius:12,background:'#f8fafc'}}><small style={{color:'#64748b'}}>Panne / demande</small><div style={{fontWeight:700,marginTop:4}}>{r.issue}</div></div>
     <div style={{padding:14,borderRadius:12,background:'#f8fafc'}}><small style={{color:'#64748b'}}>Montant indiqué</small><div style={{fontWeight:800,fontSize:20,marginTop:4}}>{eur(Number(r.total||r.quoteAmount||0))}</div></div>
     {r.publicNotes&&<div style={{padding:14,borderRadius:12,background:'#fff8e8'}}><small style={{color:'#8a6514'}}>Information atelier</small><div style={{marginTop:4}}>{r.publicNotes}</div></div>}
    </div>
    {r.customerSignature?<div style={{padding:18,borderRadius:14,background:'#ecfdf3',border:'1px solid #b7ebc6'}}><b>✅ Document déjà signé</b><div style={{marginTop:6}}>{r.customerSignature}</div><small>{r.signatureAt?dateFr(r.signatureAt):''}</small></div>:<form action={`/api/public/sign/${token}`} method="post" style={{display:'grid',gap:14}}>
     <label style={{fontWeight:700}}>Nom et prénom du client<input name="signature" required autoFocus style={{display:'block',width:'100%',marginTop:8,padding:'15px 16px',borderRadius:12,border:'1px solid #cfd8e3',fontSize:18}} placeholder="Saisissez votre nom complet"/></label>
     <label style={{display:'flex',gap:10,alignItems:'flex-start',fontSize:14,lineHeight:1.5}}><input name="consent" type="checkbox" value="yes" required style={{marginTop:4,transform:'scale(1.2)'}}/> Je confirme avoir lu les informations du dossier et j’autorise Luxury Phone à prendre en charge l’appareil selon les éléments affichés ci-dessus.</label>
     <button style={{padding:'16px 18px',border:0,borderRadius:12,background:'#d79a24',fontSize:17,fontWeight:900,cursor:'pointer'}}>Signer et valider</button>
    </form>}
   </section>
  </div>
 </main>
}
