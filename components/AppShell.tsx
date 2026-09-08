import Link from 'next/link'
import { getSession } from '@/lib/auth'
import RepairContextDock from '@/components/RepairContextDock'
import {
  LayoutDashboard, ClipboardList, Sparkles, ReceiptText, FileText, Users, ShieldCheck,
  MessageSquareText, ShoppingCart, Monitor, Package, Truck, CalendarDays, UserCog, Settings,
  Search, Bell, Plus, Crown, LogOut, Command, HandCoins, Smartphone, ChevronDown,
  BarChart3, Printer, ShieldAlert, ClipboardCheck, TabletSmartphone, WalletCards
} from 'lucide-react'

export default async function AppShell({children}:{children:React.ReactNode}){
 const s=await getSession()
 const groups=[
  {label:'ATELIER',items:[
   ['/','Tableau de bord', LayoutDashboard],
   ['/frontdesk','Réception express',Sparkles],
   ['/repairs','Prises en charge',ClipboardList],
   ['/checklists','Listes de contrôle',ClipboardCheck],
   ['/signatures','Signature client',TabletSmartphone],
   ['/invoices','Factures',ReceiptText],
   ['/quotes','Devis',FileText],
   ['/deposits','Acomptes',HandCoins],
  ]},
  {label:'RELATION CLIENT',items:[
   ['/clients','Clients',Users],
   ['/warranties','SAV & Garanties',ShieldCheck],
   ['/communications','Communications',MessageSquareText],
  ]},
  {label:'CAISSE & VENTE',items:[
   ['/pos','Vente rapide',ShoppingCart],
   ['/pos/sales','Ventes & remboursements',ReceiptText],
   ['/cash','Caisse',Monitor],
   ['/cash/quick','Encaissement réparation',WalletCards],
   ['/settings/print','Impression',Printer],
  ]},
  {label:'OPÉRATIONS',items:[
   ['/orders','À commander',ShoppingCart],
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
 return <div className="shell suite-shell v16-shell">
  <style>{`
   .v16-shell{background:#f7f8fb;color:#172033}
   .v16-shell .v6-side{padding:14px 12px;background:#fff;border-right:1px solid #e6e8ee;box-shadow:4px 0 18px rgba(25,35,55,.035)}
   .v16-shell .v6-brand{margin:3px 5px 18px;gap:9px;color:#111827}.v16-shell .v6-brand .brand-mark{width:34px;height:34px;background:#111827;color:#fff;border-radius:10px}.v16-shell .v6-brand span{color:#d71920}.v16-shell .v6-brand small{font-size:9px;color:#8a93a3;letter-spacing:.3px;opacity:1}
   .v16-shell .workspace-card{width:100%;display:flex;align-items:center;gap:9px;text-align:left;margin:0 0 16px;padding:10px 11px;border:1px solid #e4e7ec;border-radius:11px;background:#f8f9fb;color:#2c3444;cursor:pointer;text-decoration:none}.v16-shell .workspace-card:hover{border-color:#d7dbe3;background:#fff}.v16-shell .workspace-card>div:nth-child(2){min-width:0;flex:1}.v16-shell .workspace-card b,.v16-shell .workspace-card small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v16-shell .workspace-card b{font-size:12px}.v16-shell .workspace-card small{font-size:10px;color:#9aa1ad;margin-top:2px}.v16-shell .workspace-avatar{width:31px;height:31px;border-radius:8px;background:#ffe8ea;color:#c9202a;display:grid;place-items:center;font-weight:900;font-size:12px}
   .v16-shell .v6-nav-scroll{overflow:auto;scrollbar-width:thin}.v16-shell .nav-section-label{padding:10px 10px 6px;color:#a0a7b4;font-size:9px;font-weight:900;letter-spacing:1px}.v16-shell .v6-nav{gap:2px}.v16-shell .v6-nav a{position:relative;padding:10px 10px;border:1px solid transparent;border-radius:9px;color:#4d586c;font-size:13px;transition:.14s ease}.v16-shell .v6-nav a svg{width:16px;height:16px;color:#667085}.v16-shell .v6-nav a:hover{background:#fff0f1;border-color:#ffd9dc;color:#c51f29}.v16-shell .v6-nav a:hover svg{color:#c51f29}.v16-shell .v6-nav a:focus-visible{outline:2px solid #d71920;outline-offset:1px}.v16-shell .v6-nav a em{margin-left:auto;font-style:normal;font-size:8px;color:#c51f29;background:#fff0f1;border:1px solid #ffd7da;border-radius:999px;padding:3px 6px}
   .v16-shell .side-bottom{gap:6px;padding-top:10px;border-top:1px solid #eceef2}.v16-shell .user-pill{padding:8px 9px;border-radius:10px;background:#f7f8fa;border-color:#e5e7eb;color:#30384a}.v16-shell .user-pill b{font-size:12px}.v16-shell .user-pill small{font-size:10px;color:#969dab}.v16-shell .avatar{width:29px;height:29px;border-radius:8px;font-size:11px;background:#ffe8ea;color:#c9202a}.v16-shell .icon-btn{width:35px;height:35px;border-radius:9px;background:#fff;border:1px solid #e1e4e8;color:#697386}
   .v16-shell .v6-topbar{height:66px;padding:0 24px;border-bottom:1px solid #e6e8ed;background:#fff;gap:20px}.v16-shell .global-search{height:40px;border-radius:10px;border:1px solid #dfe3e9;background:#f8f9fb;box-shadow:none;transition:.14s ease}.v16-shell .global-search:focus-within{border-color:#f0a2a8;box-shadow:0 0 0 3px #d7192014;background:#fff}.v16-shell .global-search input{font-size:14px;color:#263044}.v16-shell .global-search input::placeholder{color:#9aa3b2}.v16-shell .kbd{border-color:#dfe3e9;background:#fff;color:#8f98a8;font-size:10px}
   .v16-shell .topbar-actions{gap:9px}.v16-shell .today{height:38px;padding:0 11px;border:1px solid #e2e5ea;border-radius:9px;background:#fff;color:#737d8f;font-size:11px}.v16-shell .top-icon{width:38px;height:38px;border:1px solid #e2e5ea;border-radius:9px;background:#fff;color:#6b7587;position:relative;display:grid;place-items:center}.v16-shell .top-icon i{width:6px;height:6px;position:absolute;right:7px;top:6px;border-radius:50%;background:#e22830;box-shadow:0 0 0 2px #fff}.v16-shell .top-create{height:38px;padding:0 14px;border-radius:9px;background:#d71920;color:#fff;box-shadow:0 5px 14px #d7192025;font-size:12px}.v16-shell .top-create:hover{filter:brightness(1.04);transform:translateY(-1px)}
   .v16-shell .repair-context-dock{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:9px 20px;background:#fff;border-bottom:1px solid #eceef2;overflow:auto}.v16-shell .repair-context-title{display:flex;align-items:center;gap:9px;color:#30384a;min-width:max-content}.v16-shell .repair-context-title b{display:block;font-size:12px}.v16-shell .repair-context-title small{display:block;font-size:9px;color:#9aa1ad;margin-top:1px}.v16-shell .repair-context-dock nav{display:flex;gap:7px;flex-wrap:nowrap}.v16-shell .repair-context-dock nav a{display:inline-flex;align-items:center;gap:6px;min-width:max-content;padding:8px 10px;border:1px solid #e0e4e9;border-radius:9px;background:#fff;color:#5a6578;font-size:11px;font-weight:800;text-decoration:none}.v16-shell .repair-context-dock nav a:hover{border-color:#f0b8bd;background:#fff5f6;color:#c51f29}.v16-shell .repair-context-dock nav a:nth-child(2){background:#d71920;border-color:#d71920;color:#fff}
   .v16-shell .v6-main{padding:22px 26px;background:#f7f8fb;min-height:calc(100vh - 66px);color:#1f2937}
   @media(max-width:800px){.v16-shell .v6-topbar{height:auto;padding:10px 14px;flex-wrap:wrap}.v16-shell .global-search{order:1;flex:1;min-width:210px}.v16-shell .topbar-actions{order:2}.v16-shell .today{display:none}.v16-shell .v6-main{padding:16px 12px;min-height:calc(100vh - 62px)}.v16-shell .repair-context-title{display:none}}
  `}</style>
  <aside className="side suite-side v6-side">
   <div className="brand suite-brand v6-brand"><div className="brand-mark"><Crown size={17}/></div><div>LUXURY <span>PHONE</span><small>ATELIER OS · V16.2 SIMPLE PRO</small></div></div>
   <Link href="/settings" className="workspace-card" title="Ouvrir les paramètres de l'atelier"><div className="workspace-avatar">L</div><div><b>LUXURY PHONE</b><small>Poissy · Propriétaire</small></div><ChevronDown size={16}/></Link>
   <div className="v6-nav-scroll">{groups.map(g=><div key={g.label}><div className="nav-section-label">{g.label}</div><nav className="nav suite-nav v6-nav">{g.items.map(([href,label,Icon])=><Link key={href} href={href}><Icon size={17}/><span>{label}</span>{href==='/repairs'&&<em>ERP</em>}</Link>)}</nav></div>)}</div>
   <div className="side-bottom"><div className="user-pill"><div className="avatar">{s?.name?.[0]||'A'}</div><div><b>{s?.name}</b><small>{s?.role==='ADMIN'?'Administrateur':'Technicien'}</small></div></div><form action="/api/auth/logout" method="post"><button className="icon-btn" title="Déconnexion"><LogOut size={17}/></button></form></div>
  </aside>
  <section className="suite-workspace">
   <header className="suite-topbar v6-topbar"><form action="/repairs" method="get" className="global-search"><Search size={17}/><input name="q" placeholder="Rechercher ticket, client, appareil, IMEI..."/><span className="kbd"><Command size={12}/> K</span></form><div className="topbar-actions"><div className="today"><CalendarDays size={16}/><span>{today}</span></div><Link href="/repairs?late=1" className="top-icon" title="Voir les dossiers en retard"><Bell size={18}/><i/></Link><Link className="btn top-create" href="/repairs/new"><Plus size={17}/> Nouvelle prise en charge</Link></div></header>
   <RepairContextDock/>
   <main className="main suite-main v6-main">{children}</main>
  </section>
 </div>
}
