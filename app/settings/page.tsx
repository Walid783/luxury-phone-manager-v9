import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { getSession } from '@/lib/auth'
import { Building2,ReceiptText,ShieldCheck,Bell,Printer,Monitor,ArrowRight } from 'lucide-react'
export default async function SettingsPage(){
 const s=await getSession();if(!s)redirect('/login')
 return <AppShell><div className="page-heading"><div><div className="eyebrow">CONFIGURATION · V15.4 FUNCTIONAL PRO</div><h1>Paramètres atelier</h1><p>Accédez uniquement à des réglages et modules réellement disponibles.</p></div></div><div className="settings-grid">
  <Link href="/" className="card setting-card v9-setting-link"><Building2/><div><h2>Entreprise</h2><p>Retour au tableau de bord atelier et aux informations principales Luxury Phone.</p></div><span className="btn secondary">Ouvrir <ArrowRight size={15}/></span></Link>
  <Link href="/invoices" className="card setting-card v9-setting-link"><ReceiptText/><div><h2>Facturation</h2><p>Consulter les factures, règlements et documents générés.</p></div><span className="btn secondary">Ouvrir <ArrowRight size={15}/></span></Link>
  <Link href="/settings/print" className="card setting-card v9-setting-link"><Printer/><div><h2>Caisse & impression</h2><p>Ticket thermique, QZ Tray, documents et étiquettes atelier.</p></div><span className="btn"><Monitor size={16}/> Ouvrir</span></Link>
  {s.role==='ADMIN'?<Link href="/team" className="card setting-card v9-setting-link"><ShieldCheck/><div><h2>Sécurité & rôles</h2><p>Gérer l’équipe et les profils administrateur / technicien.</p></div><span className="btn secondary">Ouvrir <ArrowRight size={15}/></span></Link>:<div className="card setting-card"><ShieldCheck/><div><h2>Sécurité & rôles</h2><p>Gestion réservée à l’administrateur.</p></div><span className="badge slate">ADMIN REQUIS</span></div>}
  <Link href="/communications" className="card setting-card v9-setting-link"><Bell/><div><h2>Notifications & communications</h2><p>Journal client, appareils prêts et communications enregistrées.</p></div><span className="btn secondary">Ouvrir <ArrowRight size={15}/></span></Link>
 </div></AppShell>
}
