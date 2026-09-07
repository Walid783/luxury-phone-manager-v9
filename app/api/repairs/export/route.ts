import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
export async function GET(){
 if(!(await getSession()))return new NextResponse('Non autorisé',{status:401})
 const rows=await prisma.repair.findMany({orderBy:{createdAt:'desc'},include:{client:true,assignedTo:true,payments:true}})
 const esc=(v:unknown)=>`"${String(v??'').replaceAll('"','""')}"`
 const header=['Ticket','Date','Client','Téléphone','Appareil','IMEI','Statut','Technicien','Total','Payé','Reste dû']
 const lines=rows.map(r=>{const paid=r.payments.reduce((a,p)=>a+Number(p.amount),0);return [r.ticketNo,r.createdAt.toISOString(),r.client.name,r.client.phone,`${r.deviceBrand} ${r.deviceModel}`,r.imei||'',r.status,r.assignedTo?.name||'',Number(r.total).toFixed(2),paid.toFixed(2),Math.max(0,Number(r.total)-paid).toFixed(2)].map(esc).join(';')})
 const csv='\uFEFF'+[header.map(esc).join(';'),...lines].join('\n')
 return new NextResponse(csv,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="luxury-phone-reparations.csv"'}})
}
