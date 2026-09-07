'use client'

export type PrintPrefs={
 thermalPrinter:string
 labelPrinter:string
 receiptWidth:'80'|'58'
 label:'62x29'|'50x25'|'40x30'
 copies:number
 autoPrintPayment:boolean
 autoPrintIntake:boolean
 showLogo:boolean
 showQr:boolean
 showLegal:boolean
 qzAutoConnect:boolean
}

export const PRINT_PREFS_KEY='luxury-print-prefs-v10'
export const defaultPrintPrefs:PrintPrefs={
 thermalPrinter:'',
 labelPrinter:'',
 receiptWidth:'80',
 label:'62x29',
 copies:1,
 autoPrintPayment:true,
 autoPrintIntake:false,
 showLogo:true,
 showQr:true,
 showLegal:true,
 qzAutoConnect:true,
}

function getQz():any{return (window as any).qz}

export function loadPrintPrefs():PrintPrefs{
 try{const raw=localStorage.getItem(PRINT_PREFS_KEY);return raw?{...defaultPrintPrefs,...JSON.parse(raw)}:defaultPrintPrefs}catch{return defaultPrintPrefs}
}
export function savePrintPrefs(prefs:PrintPrefs){localStorage.setItem(PRINT_PREFS_KEY,JSON.stringify(prefs))}

export async function waitForQz(timeout=5000){
 const started=Date.now()
 while(Date.now()-started<timeout){const qz=getQz();if(qz?.websocket&&qz?.printers&&qz?.configs)return qz;await new Promise(r=>setTimeout(r,120))}
 throw new Error('Bibliothèque QZ Tray non chargée')
}

export async function connectQz(){
 const qz=await waitForQz()
 if(qz.websocket.isActive())return qz
 await qz.websocket.connect({retries:2,delay:1})
 return qz
}

export async function disconnectQz(){const qz=getQz();if(qz?.websocket?.isActive?.())await qz.websocket.disconnect()}
export async function listQzPrinters():Promise<string[]>{const qz=await connectQz();const found=await qz.printers.find();return Array.isArray(found)?found:[found].filter(Boolean)}
export function isQzConnected(){try{return Boolean(getQz()?.websocket?.isActive?.())}catch{return false}}

export async function printHtmlQz(printer:string,html:string,opts:{widthMm:number;heightMm?:number;copies?:number}){
 if(!printer)throw new Error('Aucune imprimante sélectionnée')
 const qz=await connectQz()
 const cfg:any={copies:opts.copies||1,units:'mm',margins:0,rasterize:true,colorType:'grayscale',orientation:'portrait'}
 cfg.size=opts.heightMm?{width:opts.widthMm,height:opts.heightMm}:{width:opts.widthMm,height:220}
 const config=qz.configs.create(printer,cfg)
 const data=[{type:'pixel',format:'html',flavor:'plain',data:html}]
 await qz.print(config,data)
}

export function openBrowserPrint(html:string,title='Luxury Phone — Impression'){
 const w=window.open('','_blank','width=520,height=820')
 if(!w)throw new Error('Fenêtre d’impression bloquée par le navigateur')
 w.document.open();w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${html}<script>setTimeout(()=>window.print(),300)<\/script></body></html>`);w.document.close()
}

export function esc(v:unknown){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]||c))}
