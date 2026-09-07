import {redirect} from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import IntakeWizard from '@/components/IntakeWizard'
import {getSession} from '@/lib/auth'
import {prisma} from '@/lib/prisma'
import {ArrowLeft, ShieldCheck} from 'lucide-react'

export default async function NewRepair(){
 const s=await getSession();if(!s)redirect('/login')
 const [clients,team]=await Promise.all([
  prisma.client.findMany({orderBy:{updatedAt:'desc'},take:250,select:{id:true,name:true,phone:true,email:true}}),
  prisma.user.findMany({where:{active:true},orderBy:{name:'asc'},select:{id:true,name:true,role:true}})
 ])
 return <AppShell>
  <div className="v11-page-head"><div><Link href="/repairs" className="back"><ArrowLeft size={16}/> Retour aux prises en charge</Link><div className="eyebrow">COMPLETE INTAKE · V13</div><h1>Nouvelle prise en charge</h1><p>Enregistrez le dépôt, documentez l’appareil et obtenez l’accord client en trois étapes.</p></div><div className="v11-secure-chip"><ShieldCheck size={18}/><div><b>Réception sécurisée</b><small>Historique, photos, QR et impression atelier</small></div></div></div>
  <IntakeWizard clients={clients} team={team}/>
 </AppShell>
}
