import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { audit } from '@/lib/audit'

const statuses = ['ESTIMATE','OFFERED','ACCEPTED','RECEIVED','REFUSED','RESOLD'] as const
const euro = (v:FormDataEntryValue|null) => {
 const raw=String(v??'').trim().replace(',','.')
 if (!raw) return null
 const n=Number(raw)
 return Number.isFinite(n)&&n>=0&&n<=100000?n:null
}
export async function POST(req:Request){
 const user=await getSession()
 if(!user)return new NextResponse('Non autorisé',{status:401})
 const f=await req.formData()
 const action=String(f.get('action')||'create')
 if(action==='update'){
  const id=String(f.get('id')||'')
  const status=String(f.get('status')||'')
  if(!statuses.includes(status as typeof statuses[number]))return new NextResponse('Statut invalide',{status:400})
  const current=await prisma.buyback.findUnique({where:{id}})
  if(!current)return new NextResponse('Reprise introuvable',{status:404})
  if(status==='RESOLD'&&current.status!=='RECEIVED')return new NextResponse('Réception requise avant la revente',{status:400})
  if(status==='RECEIVED'&&!current.icloudCleared)return new NextResponse('Vérifier la désactivation iCloud avant réception',{status:400})
  const sale=euro(f.get('actualSalePrice'))
  if(status==='RESOLD'&&sale===null)return new NextResponse('Prix de vente requis',{status:400})
  const costs=euro(f.get('repairCosts'))
  if(costs===null)return new NextResponse('Frais invalides',{status:400})
  await prisma.buyback.update({where:{id},data:{status:status as typeof statuses[number],repairCosts:costs,...(status==='RESOLD'?{actualSalePrice:sale}: {})}})
  await audit({userId:user.id,action:'UPDATE',entity:'Buyback',entityId:id,detail:'Statut '+status})
  return NextResponse.redirect(new URL('/buybacks',req.url),303)
 }
 const clientName=String(f.get('clientName')||'').trim().slice(0,150)
 const clientPhone=String(f.get('clientPhone')||'').trim().slice(0,40)
 const model=String(f.get('model')||'').trim().slice(0,100)
 const offerPrice=euro(f.get('offerPrice'))
 const expectedSalePrice=euro(f.get('expectedSalePrice'))
 const repairCosts=euro(f.get('repairCosts'))
 const batteryRaw=String(f.get('batteryHealth')||'').trim()
 const battery=batteryRaw===''?null:Number(batteryRaw)
 if(!clientName||!clientPhone||!model||offerPrice===null||repairCosts===null||expectedSalePrice===null|| (battery!==null&&(!Number.isInteger(battery)||battery<0||battery>100)))return new NextResponse('Données de reprise invalides',{status:400})
 const photoUrls=String(f.get('photoUrls')||'').trim().split(/\r?\n/).filter(Boolean).slice(0,5)
 if(photoUrls.some(url=>{try{const u=new URL(url);return !['https:','http:'].includes(u.protocol)}catch{return true}}))return new NextResponse('Liens de photos invalides',{status:400})
 const created=await prisma.buyback.create({data:{
  clientName,clientPhone,model,brand:String(f.get('brand')||'Apple').slice(0,60),
  clientEmail:String(f.get('clientEmail')||'').trim().slice(0,200)||null,
  storage:String(f.get('storage')||'').trim().slice(0,40)||null,
  imei:String(f.get('imei')||'').trim().slice(0,40)||null,
  conditionNotes:String(f.get('conditionNotes')||'').trim().slice(0,3000)||null,
  batteryHealth:battery,offerPrice,expectedSalePrice,repairCosts,
  screenTested:f.get('screenTested')==='on',faceIdTested:f.get('faceIdTested')==='on',
  icloudCleared:f.get('icloudCleared')==='on',photoUrls:photoUrls.length?JSON.stringify(photoUrls):null
 }})
 await audit({userId:user.id,action:'CREATE',entity:'Buyback',entityId:created.id,detail:clientName+' · '+model+' · '+offerPrice+' EUR'})
 return NextResponse.redirect(new URL('/buybacks?created=1',req.url),303)
}
