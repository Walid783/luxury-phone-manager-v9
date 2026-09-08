import Link from 'next/link'
import { getSession } from '@/lib/auth'
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
   ['/','Tableau de bord V15.4', LayoutDashboard],
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
  {label:'CAISSE & VENTE',items:[
   ['/pos','Vente rapide V15',ShoppingCart],
   ['/pos/sales','Ventes & remboursements',ReceiptText],
   ['/cash','Caisse Pro V15',Monitor],
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
 return <div className="shell suite-shell v6-shell">
  <style>{`
   .v6-shell .v6-side{padding:18px 13px;background:linear-gradient(180deg,#080d15 0%,#060a10 100%);border-right:1px solid #1c2736}
   .v6-shell .v6-brand{margin:2px 5px 18px;gap:9px}.v6-shell .v6-brand .brand-mark{width:32px;height:32px}.v6-shell .v6-brand small{font-size:8px;letter-spacing:.35px;opacity:.72}
   .v6-shell .workspace-card{width:100%;display:flex;align-items:center;gap:9px;text-align:left;margin:0 0 16px;padding:9px 10px;border:1px solid #202d3d;border-radius:12px;background:linear-gradient(135deg,#111a27,#0c131e);color:#e9eef7;cursor:pointer;text-decoration:none}.v6-shell .workspace-card>div:nth-child(2){min-width:0;flex:1}.v6-shell .workspace-card b,.v6-shell .workspace-card small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v6-shell .workspace-card b{font-size:10px}.v6-shell .workspace-card small{font-size:8px;color:#7f8da1;margin-top:2px}.v6-shell .workspace-avatar{width:29px;height:29px;border-radius:8px;background:#1a2a40;color:#72aef5;display:grid;place-items:center;font-weight:900;font-size:11px}
   .v6-shell .v6-nav-scroll{overflow:auto;scrollbar-width:thin}.v6-shell .nav-section-label{padding:9px 10px 5px;color:#65748a;font-size:8px;font-weight:900;letter-spacing:1.15px}.v6-shell .v6-nav{gap:2px}.v6-shell .v6-nav a{position:relative;padding:9px 10px;border:1px solid transparent;border-radius:9px;color:#9eabbd;font-size:11px;transition:.16s ease}.v6-shell .v6-nav a svg{width:15px;height:15px;opacity:.8}.v6-shell .v6-nav a:hover{background:#101a28;border-color:#1d2b3d;color:#eef4fb;transform:translateX(1px)}.v6-shell .v6-nav a:focus-visible{outline:2px solid #6ea8ed;outline-offset:1px}.v6-shell .v6-nav a em{margin-left:auto;font-style:normal;font-size:7px;color:#70a8ed;background:#14243a;border:1px solid #24486f;border-radius:999px;padding:3px 5px}
   .v6-shell .side-bottom{gap:6px;padding-top:10px;border-top:1px solid #192535}.v6-shell .user-pill{padding:7px 8px;border-radius:10px;background:#0d141f;border-color:#1d2a3a}.v6-shell .user-pill b{font-size:10px}.v6-shell .user-pill small{font-size:8px}.v6-shell .avatar{width:27px;height:27px;border-radius:8px;font-size:10px}.v6-shell .icon-btn{width:33px;height:33px;border-radius:9px}
   .v6-shell .v6-topbar{height:68px;padding:0 26px;border-bottom:1px solid #dfe6ee;background:rgba(255,255,255,.94);backdrop-filter:blur(12px);gap:20px}.v6-shell .global-search{height:40px;border-radius:11px;border:1px solid #d9e2ec;background:#f8fafc;box-shadow:none;transition:.16s ease}.v6-shell .global-search:focus-within{border-color:#9bbde7;box-shadow:0 0 0 3px #6ea8ed18;background:#fff}.v6-shell .global-search input{font-size:11px}.v6-shell .global-search input::placeholder{color:#8a97a8}.v6-shell .kbd{border-color:#d8e1eb;background:#fff;color:#8491a2;font-size:9px}
   .v6-shell .topbar-actions{gap:9px}.v6-shell .today{height:36px;padding:0 10px;border:1px solid #e0e6ed;border-radius:9px;background:#fff;color:#647287;font-size:9px}.v6-shell .top-icon{width:36px;height:36px;border:1px solid #e0e6ed;border-radius:9px;background:#fff;color:#53647a;position:relative;display:grid;place-items:center}.v6-shell .top-icon i{width:5px;height:5px;position:absolute;right:7px;top:6px;border-radius:50%;background:#e24d5b;box-shadow:0 0 0 2px #fff}.v6-shell .top-create{height:36px;padding:0 12px;border-radius:9px;background:#1f67c8;color:#fff;box-shadow:0 6px 16px #1f67c826;font-size:10px}.v6-shell .top-create:hover{filter:brightness(1.04);transform:translateY(-1px)}
   .v6-shell .v6-main{padding:25px 28px;background:linear-gradient(180deg,#f8fafc 0%,#f4f7fb 100%);min-height:calc(100vh - 68px)}
   @media(max-width:800px){.v6-shell .v6-topbar{height:auto;padding:10px 14px;flex-wrap:wrap}.v6-shell .global-search{order:1;flex:1;min-width:210px}.v6-shell .topbar-actions{order:2}.v6-shell .today{display:none}.v6-shell .v6-main{padding:18px 14px;min-height:calc(100vh - 62px)}}
  `}</style>
  <aside className="side suite-side v6-side">
   <div className="brand suite-brand v6-brand"><div className="brand-mark"><Crown size={17}/></div><div>LUXURY <span>PHONE</span><small>ATELIER OS · V15.4 FUNCTIONAL PRO</small></div></div>
   <Link href="/settings" className="workspace-card" title="Ouvrir les paramètres de l'atelier"><div className="workspace-avatar">L</div><div><b>LUXURY PHONE</b><small>Poissy · Propriétaire</small></div><ChevronDown size={16}/></Link>
   <div className="v6-nav-scroll">{groups.map(g=><div key={g.label}><div className="nav-section-label">{g.label}</div><nav className="nav suite-nav v6-nav">{g.items.map(([href,label,Icon])=><Link key={href} href={href}><Icon size={17}/><span>{label}</span>{href==='/pos'&&<em>V15 POS</em>}{href==='/repairs'&&<em>V15.4 ERP</em>}</Link>)}</nav></div>)}</div>
   <div className="side-bottom"><div className="user-pill"><div className="avatar">{s?.name?.[0]||'A'}</div><div><b>{s?.name}</b><small>{s?.role==='ADMIN'?'Administrateur':'Technicien'}</small></div></div><form action="/api/auth/logout" method="post"><button className="icon-btn" title="Déconnexion"><LogOut size={17}/></button></form></div>
  </aside>
  <section className="suite-workspace">
   <header className="suite-topbar v6-topbar"><form action="/repairs" method="get" className="global-search"><Search size={17}/><input name="q" placeholder="Rechercher ticket, client, appareil, IMEI..."/><span className="kbd"><Command size={12}/> K</span></form><div className="topbar-actions"><div className="today"><CalendarDays size={16}/><span>{today}</span></div><Link href="/repairs?late=1" className="top-icon" title="Voir les dossiers en retard"><Bell size={18}/><i/></Link><Link className="btn top-create" href="/repairs/new"><Plus size={17}/> Nouvelle prise en charge</Link></div></header>
   <main className="main suite-main v6-main">{children}</main>
  </section>
 </div>
}
