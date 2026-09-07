import {NextResponse} from 'next/server'
import {prisma} from '@/lib/prisma'
import {getSession} from '@/lib/auth'
import {audit} from '@/lib/audit'

const priorities=new Set(['BASE','NORMAL','HIGH','URGENT'])
const methods=new Set(['CASH','CARD','TRANSFER','OTHER'])
const categories=new Set(['SMARTPHONE','TABLET','LAPTOP','CONSOLE','WATCH','OTHER'])
const channels=new Set(['SMS','WHATSAPP','EMAIL','PHONE'])

export async function POST(req:Request){
 const s=await getSession();if(!s)return new NextResponse('Unauthorized',{status:401})
 const f=await req.formData()
 const clientId=String(f.get('clientId')||'').trim()
 const phone=String(f.get('phone')||'').trim(),name=String(f.get('clientName')||'').trim(),email=String(f.get('email')||'').trim()
 let c=clientId?await prisma.client.findUnique({where:{id:clientId}}):null
 if(!c){
  if(!name||!phone)return new NextResponse('Client incomplet',{status:400})
  c=await prisma.client.findFirst({where:{phone}})
  const clientData={name,email:email||null,address:String(f.get('address')||'')||null,postalCode:String(f.get('postalCode')||'')||null,city:String(f.get('city')||'')||null}
  if(!c)c=await prisma.client.create({data:{...clientData,phone}})
  else c=await prisma.client.update({where:{id:c.id},data:{...clientData,email:email||c.email}})
 }
 const total=Math.max(0,Number(f.get('total')||0)),deposit=Math.max(0,Math.min(Number(f.get('deposit')||0),total||Number(f.get('deposit')||0)))
 const priority=String(f.get('priority')||'NORMAL'),paymentMethod=String(f.get('paymentMethod')||'CARD'),category=String(f.get('deviceCategory')||'SMARTPHONE'),channel=String(f.get('notificationChannel')||'SMS')
 const assigned=String(f.get('assignedToId')||'').trim(),promised=String(f.get('promisedAt')||'').trim(),signature=String(f.get('signature')||'').trim()
 let photos:string[]=[];try{const parsed=JSON.parse(String(f.get('photoData')||'[]'));if(Array.isArray(parsed))photos=parsed.filter(x=>typeof x==='string'&&x.startsWith('data:image/')).slice(0,5)}catch{}
 const checklist=String(f.get('intakeChecklist')||'[]')
 const powersRaw=String(f.get('powersOn')||'unknown');const powersOn=powersRaw==='yes'?true:powersRaw==='no'?false:null
 const diagnosticConsent=f.get('diagnosticConsent')==='on',backupConfirmed=f.get('backupConfirmed')==='on',dataAccessConsent=f.get('dataAccessConsent')==='on',quoteRequired=f.get('quoteRequired')==='on'
 const cash=deposit>0&&paymentMethod==='CASH'?await prisma.cashSession.findFirst({where:{status:'OPEN'}}):null
 const r=await prisma.repair.create({data:{
  clientId:c.id,deviceCategory:categories.has(category)?category as any:'SMARTPHONE',deviceBrand:String(f.get('brand')||''),deviceModel:String(f.get('model')||''),deviceColor:String(f.get('deviceColor')||'')||null,deviceStorage:String(f.get('deviceStorage')||'')||null,imei:String(f.get('imei')||'')||null,issue:String(f.get('issue')||''),diagnostic:String(f.get('diagnosticNote')||'')||null,conditionIn:String(f.get('conditionIn')||'')||null,accessories:String(f.get('accessories')||'')||null,lockCode:String(f.get('lockCode')||'')||null,internalNotes:String(f.get('notes')||'')||null,total,quoteAmount:total,deposit,
  powersOn,moistureSuspected:String(f.get('moistureSuspected')||'no')==='yes',backupConfirmed,diagnosticConsent,dataAccessConsent,notificationChannel:channels.has(channel)?channel as any:'SMS',intakeChecklist:checklist,
  quoteStatus:quoteRequired?'DRAFT':'ACCEPTED',quoteAcceptedAt:quoteRequired?null:new Date(),priority:priorities.has(priority)?priority as any:'NORMAL',assignedToId:assigned||s.id,promisedAt:promised?new Date(promised):null,warrantyDays:Math.max(0,Number(f.get('warrantyDays')||90)),customerSignature:signature||null,signatureAt:signature?new Date():null,
  photos:photos.length?{create:photos.map(dataUrl=>({kind:'BEFORE' as any,dataUrl}))}:undefined,
  payments:deposit>0?{create:{amount:deposit,method:methods.has(paymentMethod)?paymentMethod as any:'CARD',note:'Acompte à la prise en charge',cashSessionId:cash?.id||null}}:undefined,
  events:{create:[{type:'CREATED',title:'Prise en charge complète créée',detail:`${c.name} · ${String(f.get('brand')||'')} ${String(f.get('model')||'')} · priorité ${priority} · canal ${channel}`,userId:s.id},{type:'NOTE',title:'Consentements enregistrés',detail:`Diagnostic ${diagnosticConsent?'oui':'non'} · sauvegarde ${backupConfirmed?'confirmée':'non confirmée'} · accès données ${dataAccessConsent?'autorisé':'non autorisé'}`,userId:s.id},...(deposit>0?[{type:'PAYMENT' as any,title:'Acompte encaissé',detail:`${deposit.toFixed(2)} € · ${paymentMethod}`,userId:s.id}]:[])]}
 }})
 await audit({userId:s.id,action:'CREATE',entity:'Repair',entityId:r.id,detail:`TKT-${r.ticketNo} · ${c.name} · ${String(f.get('brand')||'')} ${String(f.get('model')||'')}`})
 return NextResponse.redirect(new URL(`/repairs/${r.id}?intake=ok&print=1`,req.url),303)
}
