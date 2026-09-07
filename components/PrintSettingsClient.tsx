'use client'
import {useEffect,useMemo,useState} from 'react'
import {CheckCircle2,Printer,Monitor,ReceiptText,Wifi,WifiOff,TestTube2,Save,FileText,Tags,RotateCcw,PlugZap,Unplug,RefreshCcw,AlertTriangle} from 'lucide-react'
import {connectQz,defaultPrintPrefs,disconnectQz,isQzConnected,listQzPrinters,loadPrintPrefs,openBrowserPrint,printHtmlQz,PrintPrefs,savePrintPrefs} from '@/lib/qz-client'

type QzState='checking'|'connected'|'missing'|'error'

export default function PrintSettingsClient(){
 const [prefs,setPrefs]=useState<PrintPrefs>(defaultPrintPrefs)
 const [saved,setSaved]=useState(false)
 const [qz,setQz]=useState<QzState>('checking')
 const [printers,setPrinters]=useState<string[]>([])
 const [message,setMessage]=useState('')
 const selectedThermal=useMemo(()=>prefs.thermalPrinter||printers[0]||'', [prefs.thermalPrinter,printers])
 useEffect(()=>{setPrefs(loadPrintPrefs());setTimeout(()=>detect(false),400)},[])
 async function detect(forceConnect=true){
  setMessage('');setQz('checking')
  try{if(forceConnect||!isQzConnected())await connectQz();const p=await listQzPrinters();setPrinters(p);setQz('connected');setPrefs(old=>({...old,thermalPrinter:old.thermalPrinter||p[0]||'',labelPrinter:old.labelPrinter||p[0]||''}))}
  catch(e:any){setQz((window as any).qz?'error':'missing');setMessage(e?.message||'QZ Tray non disponible')}
 }
 async function doDisconnect(){try{await disconnectQz();setQz('missing');setPrinters([])}catch{}}
 function save(){savePrintPrefs(prefs);setSaved(true);setTimeout(()=>setSaved(false),1800)}
 function testHtml(){return `<style>@page{margin:0}body{font-family:Arial,sans-serif;margin:0;color:#111}.ticket{width:${prefs.receiptWidth}mm;padding:6mm 4mm;box-sizing:border-box;text-align:center}.logo{font-size:22px;font-weight:900}.gold{color:#b97812}.line{border-top:1px dashed #222;margin:10px 0}.row{display:flex;justify-content:space-between;font-size:11px;margin:6px 0}.ok{font-size:12px;font-weight:700;margin:12px 0}.foot{font-size:9px;color:#555}</style><div class="ticket">${prefs.showLogo?'<div class="logo">LUXURY <span class="gold">PHONE</span></div><div>Atelier OS · V13</div>':''}<div class="line"></div><h3>TICKET DE TEST QZ TRAY</h3><div class="row"><span>Imprimante</span><b>${selectedThermal||'Non choisie'}</b></div><div class="row"><span>Format</span><b>${prefs.receiptWidth} mm</b></div><div class="row"><span>Date</span><b>${new Date().toLocaleString('fr-FR')}</b></div><div class="line"></div><div class="ok">✓ Luxury Phone POS & Print Pro</div>${prefs.showLegal?'<div class="foot">Document de test · Aucun encaissement</div>':''}</div>`}
 async function testQz(){try{setMessage('Impression en cours…');await printHtmlQz(selectedThermal,testHtml(),{widthMm:Number(prefs.receiptWidth),copies:prefs.copies});setMessage('Ticket envoyé à l’imprimante via QZ Tray.')}catch(e:any){setMessage(`QZ: ${e?.message||'échec impression'}`)}}
 function testBrowser(){try{openBrowserPrint(testHtml(),'Ticket test Luxury Phone')}catch(e:any){setMessage(e?.message||'Échec impression navigateur')}}
 function reset(){const p={...defaultPrintPrefs};setPrefs(p);savePrintPrefs(p);setMessage('Réglages locaux réinitialisés.')}
 return <div className="v9-print-layout">
  <aside className="v9-print-subnav">
   <div className="v9-sub-label">ENCAISSEMENT</div><div className="v9-sub-item"><Monitor size={18}/> Caisse</div>
   <div className="v9-sub-label">IMPRESSION & ÉTIQUETTES</div><div className="v9-sub-item active"><Printer size={18}/> Impression</div><div className="v9-sub-item"><FileText size={18}/> Documents</div><div className="v9-sub-item"><Tags size={18}/> Brother</div>
  </aside>
  <section className="v9-print-content">
   <div className="card v9-active-card"><div className="v9-active-icon"><Printer/></div><div><div className="eyebrow">V13 · COMPLETE ERP</div><h2>Impression locale avec QZ Tray</h2><p>Connexion WebSocket réelle, découverte des imprimantes Windows, ticket thermique et étiquettes Brother.</p></div><span className={`v10-state ${qz}`}><CheckCircle2 size={15}/> {qz==='connected'?'QZ connecté':'À connecter'}</span></div>
   <div className="v9-printer-cards">
    <div className="card"><Printer/><small>Ticket thermique</small><b>{prefs.thermalPrinter||'À sélectionner'}</b></div>
    <div className="card"><Tags/><small>Brother / étiquette</small><b>{prefs.labelPrinter||'À sélectionner'}</b></div>
    <div className="card"><Monitor/><small>État QZ Tray</small><b className={qz==='connected'?'good':'muted'}>{qz==='connected'?'Connecté au poste':'Non connecté'}</b></div>
   </div>
   <div className="card v9-config-card"><div className="section-title"><div><h2><Wifi size={19}/> Connexion QZ Tray</h2><p>QZ Tray doit être lancé sur ce PC pour imprimer sans dialogue navigateur.</p></div><span className={`v9-qz-chip ${qz}`}>{qz==='connected'?<Wifi size={15}/>:<WifiOff size={15}/>} {qz==='checking'?'Détection…':qz==='connected'?'Connecté':qz==='error'?'Erreur QZ':'Non connecté'}</span></div><div className="v10-qz-actions"><button className="btn" onClick={()=>detect(true)}><PlugZap size={16}/> Se connecter</button><button className="btn secondary" onClick={()=>detect(true)}><RefreshCcw size={16}/> Actualiser imprimantes</button><button className="btn secondary" onClick={doDisconnect}><Unplug size={16}/> Déconnecter</button></div>{message&&<div className={`v10-message ${qz==='error'?'warn':''}`}>{qz==='error'&&<AlertTriangle size={15}/>} {message}</div>}<div className="v10-qz-note"><b>Mode production</b><span>Sans certificat QZ personnalisé, QZ Tray peut demander une confirmation de sécurité. Le module reste fonctionnel après autorisation locale.</span></div></div>
   <div className="card v9-config-card"><div className="section-title"><div><h2><ReceiptText size={19}/> Imprimantes et formats</h2><p>Ces réglages sont enregistrés uniquement sur ce poste, car les noms d’imprimante dépendent de Windows.</p></div></div><div className="v9-print-form">
    <label>Imprimante ticket<select value={prefs.thermalPrinter} onChange={e=>setPrefs({...prefs,thermalPrinter:e.target.value})}><option value="">Sélectionner…</option>{printers.map(p=><option key={p}>{p}</option>)}</select></label>
    <label>Imprimante Brother<select value={prefs.labelPrinter} onChange={e=>setPrefs({...prefs,labelPrinter:e.target.value})}><option value="">Sélectionner…</option>{printers.map(p=><option key={p}>{p}</option>)}</select></label>
    <label>Largeur ticket<select value={prefs.receiptWidth} onChange={e=>setPrefs({...prefs,receiptWidth:e.target.value as any})}><option value="80">80 mm</option><option value="58">58 mm</option></select></label>
    <label>Étiquette Brother<select value={prefs.label} onChange={e=>setPrefs({...prefs,label:e.target.value as any})}><option value="62x29">62 × 29 mm</option><option value="50x25">50 × 25 mm</option><option value="40x30">40 × 30 mm</option></select></label>
    <label>Copies ticket<input type="number" min="1" max="5" value={prefs.copies} onChange={e=>setPrefs({...prefs,copies:Math.max(1,Number(e.target.value)||1)})}/></label>
   </div><div className="v9-switch-grid">
    {([['autoPrintPayment','Imprimer automatiquement après encaissement'],['autoPrintIntake','Imprimer automatiquement après prise en charge'],['showLogo','Afficher le logo Luxury Phone'],['showQr','Afficher le QR code dossier'],['showLegal','Afficher les mentions ticket'],['qzAutoConnect','Connexion QZ automatique sur ce poste']] as const).map(([k,label])=><label className="v9-switch" key={k}><input type="checkbox" checked={prefs[k] as boolean} onChange={e=>setPrefs({...prefs,[k]:e.target.checked})}/><span/><b>{label}</b></label>)}
   </div><div className="v9-print-actions"><button className="btn secondary" onClick={testBrowser}><Printer size={16}/> Test navigateur</button><button className="btn secondary" onClick={testQz} disabled={qz!=='connected'}><TestTube2 size={16}/> Test QZ Tray</button><button className="btn secondary" onClick={reset}><RotateCcw size={16}/> Réinitialiser</button><button className="btn" onClick={save}><Save size={16}/> {saved?'Enregistré':'Enregistrer'}</button></div></div>
  </section>
 </div>
}
