import {NextResponse} from 'next/server'
import {prisma} from '@/lib/prisma'

export async function POST(req:Request,{params}:{params:Promise<{token:string}>}){
 const {token}=await params
 const f=await req.formData()
 const signature=String(f.get('signature')||'').trim()
 const consent=String(f.get('consent')||'')==='yes'
 if(!signature||!consent)return new NextResponse('Signature ou consentement manquant',{status:400})
 const r=await prisma.repair.findFirst({where:{OR:[{trackingToken:token},{id:token}]}})
 if(!r)return new NextResponse('Not found',{status:404})
 await prisma.repair.update({where:{id:r.id},data:{customerSignature:signature,signatureAt:new Date(),events:{create:{type:'NOTE',title:'Signature client reçue',detail:`Signature électronique : ${signature}`}}}})
 return NextResponse.redirect(new URL(`/sign/${token}`,req.url),303)
}
