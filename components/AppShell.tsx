import Link from 'next/link'
import { getSession } from '@/lib/auth'
import {
  LayoutDashboard, ClipboardList, Sparkles, ReceiptText, FileText, Users, ShieldCheck,
  MessageSquareText, ShoppingCart, Monitor, Package, Truck, CalendarDays, UserCog, Settings,
  Search, Bell, Plus, Crown, LogOut, Command, HandCoins, Smartphone, ChevronDown,
  BarChart3, Printer, ShieldAlert, ClipboardCheck, TabletSmartphone
} from 'lucide-react'

export default async function AppShell({children}:{children:React.ReactNode}){
 const s=await getSession()
 const groups=[
  {label:'ATELIER',items:[
   ['/', 'Tableau de bord V14', LayoutDashboard],
   ['/frontdesk','Réception express',Sparkles],
   ['/repairs','Prises en charge',ClipboardList],
   ['/checklists','Listes de contrôle',ClipboardCheck],
   ['/signatures','Tablette de signature',TabletSmartphone],
   ['/invoices','Factures',ReceiptText],
   ['/quotes','Devis',FileText],
   ['/deposits','Acomptes',HandCoins],
  ]},
  {label:'RELATION CLIENT',items:[
   ['/clients','Clients',Users],
   ['/warranties','SAV & Garanties',ShieldCheck],
   ['/communications','Communications',MessageSquareText],
  ]},
  {label:'OPÉRATIONS',items:[
   ['/orders','À commander',ShoppingCart],
   ['/cash','Caisse Pro',Monitor],
   ['/settings/print','Caisse & impression',Printer],
   ['/inventory','Stock',Package],
   ['/purchases','Achats',Truck],
   ['/loans','Appareils de prêt',Smartphone],
   ['/agenda','Agenda',CalendarDays],
  ]},
  {label:'PILOTAGE',items:[
   ['/reports','Rapports',BarChart3],
   ...(s?.role==='ADMIN'?[['/team','Équipe',UserCog] as const,['/audit','Journal d’audit',ShieldAlert] as const]:[]),
   ['/settings','Paramètres',Settings],
  ]},
 ] as const
 const today=new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'2-digit',month:'long'}).format(new Date())
 return <div className="shell suite-shell v6-shell">
  <aside className="side suite-side v6-side">
   <div className="brand suite-brand v6-brand"><div className="brand-mark"><Crown size={17}/></div><div>LUXURY <span>PHONE</span><small>ATELIER OS · V14 ULTIMATE WORKSHOP ERP</small></div></div>
   <button className="workspace-card"><div className="workspace-avatar">L</div><div><b>LUXURY PHONE</b><small>Poissy · Propriétaire</small></div><ChevronDown size={16}/></button>
   <div className="v6-nav-scroll">{groups.map(g=><div key={g.label}><div className="nav-section-label">{g.label}</div><nav className="nav suite-nav v6-nav">{g.items.map(([href,label,Icon])=><Link key={href} href={href}><Icon size={17}/><span>{label}</span>{href==='/repairs'&&<em>V14 ERP</em>}</Link>)}</nav></div>)}</div>
   <div className="side-bottom"><div className="user-pill"><div className="avatar">{s?.name?.[0]||'A'}</div><div><b>{s?.name}</b><small>{s?.role==='ADMIN'?'Administrateur':'Technicien'}</small></div></div><form action="/api/auth/logout" method="post"><button className="icon-btn" title="Déconnexion"><LogOut size={17}/></button></form></div>
  </aside>
  <section className="suite-workspace">
   <header className="suite-topbar v6-topbar">
    <form action="/repairs" method="get" className="global-search"><Search size={17}/><input name="q" placeholder="Rechercher ticket, client, appareil, IMEI..."/><span className="kbd"><Command size={12}/> K</span></form>
    <div className="topbar-actions"><div className="today"><CalendarDays size={16}/><span>{today}</span></div><button className="top-icon" title="Notifications"><Bell size={18}/><i/></button><Link className="btn top-create" href="/repairs/new"><Plus size={17}/> Nouvelle prise en charge</Link></div>
   </header>
   <main className="main suite-main v6-main">{children}</main>
  </section>
 </div>
}
