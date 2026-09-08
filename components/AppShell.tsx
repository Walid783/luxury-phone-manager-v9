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
   ['/','Tableau de bord V16', LayoutDashboard],
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
   .v6-shell .v6-brand{margin:2px 5px 18px;gap:9px}.v6-shell .v6-brand .brand-mark{width:32px;height:32px}.v6-shell .v6-brand small{font-size:9px;letter-spacing:.35px;opacity:.76}
   .v6-shell .workspace-card{width:100%;display:flex;align-items:center;gap:9px;text-align:left;margin:0 0 16px;padding:10px 11px;border:1px solid #202d3d;border-radius:12px;background:linear-gradient(135deg,#111a27,#0c131e);color:#e9eef7;cursor:pointer;text-decoration:none}.v6-shell .workspace-card>div:nth-child(2){min-width:0;flex:1}.v6-shell .workspace-card b,.v6-shell .workspace-card small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v6-shell .workspace-card b{font-size:12px}.v6-shell .workspace-card small{font-size:10px;color:#8c99ab;margin-top:2px}.v6-shell .workspace-avatar{width:31px;height:31px;border-radius:8px;background:#381016;color:#ff6b74;display:grid;place-items:center;font-weight:900;font-size:12px}
   .v6-shell .v6-nav-scroll{overflow:auto;scrollbar-width:thin}.v6-shell .nav-section-label{padding:10px 10px 6px;color:#7d8899;font-size:9px;font-weight:900;letter-spacing:1.15px}.v6-shell .v6-nav{gap:2px}.v6-shell .v6-nav a{position:relative;padding:10px 10px;border:1px solid transparent;border-radius:9px;color:#b8c1cf;font-size:13px;transition:.16s ease}.v6-shell .v6-nav a svg{width:16px;height:16px;opacity:.9}.v6-shell .v6-nav a:hover{background:#171016;border-color:#3d1b21;color:#fff;transform:translateX(1px)}.v6-shell .v6-nav a:focus-visible{outline:2px solid #d71920;outline-offset:1px}.v6-shell .v6-nav a em{margin-left:auto;font-style:normal;font-size:8px;color:#ff8188;background:#2d1116;border:1px solid #5b2028;border-radius:999px;padding:3px 5px}
   .v6-shell .side-bottom{gap:6px;padding-top:10px;border-top:1px solid #29212a}.v6-shell .user-pill{padding:8px 9px;border-radius:10px;background:#0d141f;border-color:#1d2a3a}.v6-shell .user-pill b{font-size:12px}.v6-shell .user-pill small{font-size:10px}.v6-shell .avatar{width:29px;height:29px;border-radius:8px;font-size:11px}.v6-shell .icon-btn{width:35px;height:35px;border-radius:9px}
   .v6-shell .v6-topbar{height:70px;padding:0 26px;border-bottom:1px solid #2a1f22;background:#0d0d0f;backdrop-filter:blur(12px);gap:20px}.v6-shell .global-search{height:42px;border-radius:11px;border:1px solid #33262a;background:#171719;box-shadow:none;transition:.16s ease}.v6-shell .global-search:focus-within{border-color:#8a262e;box-shadow:0 0 0 3px #d7192022;background:#1b1b1d}.v6-shell .global-search input{font-size:14px;color:#fff}.v6-shell .global-search input::placeholder{color:#888}.v6-shell .kbd{border-color:#3b3033;background:#111;color:#aaa;font-size:10px}
   .v6-shell .topbar-actions{gap:9px}.v6-shell .today{height:38px;padding:0 11px;border:1px solid #33262a;border-radius:9px;background:#171719;color:#c8c8cc;font-size:11px}.v6-shell .top-icon{width:38px;height:38px;border:1px solid #33262a;border-radius:9px;background:#171719;color:#d6d6da;position:relative;display:grid;place-items:center}.v6-shell .top-icon i{width:6px;height:6px;position:absolute;right:7px;top:6px;border-radius:50%;background:#e22830;box-shadow:0 0 0 2px #171719}.v6-shell .top-create{height:38px;padding:0 14px;border-radius:9px;background:#d71920;color:#fff;box-shadow:0 6px 16px #d7192038;font-size:12px}.v6-shell .top-create:hover{filter:brightness(1.08);transform:translateY(-1px)}
   .v6-shell .repair-context-dock{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:10px 18px;background:#141416;border-bottom:1px solid #2d2427;overflow:auto}.v6-shell .repair-context-title{display:flex;align-items:center;gap:9px;color:#fff;min-width:max-content}.v6-shell .repair-context-title b{display:block;font-size:12px}.v6-shell .repair-context-title small{display:block;font-size:9px;color:#929299;margin-top:1px}.v6-shell .repair-context-dock nav{display:flex;gap:7px;flex-wrap:nowrap}.v6-shell .repair-context-dock nav a{display:inline-flex;align-items:center;gap:6px;min-width:max-content;padding:8px 10px;border:1px solid #35292d;border-radius:9px;background:#1b1b1e;color:#dedee2;font-size:11px;font-weight:800;text-decoration:none}.v6-shell .repair-context-dock nav a:hover{border-color:#8c242c;background:#261216;color:#fff}.v6-shell .repair-context-dock nav a:nth-child(2){background:#8f141b;border-color:#b31b23;color:#fff}
   .v6-shell .v6-main{padding:25px 28px;background:linear-gradient(180deg,#101012 0%,#151517 100%);min-height:calc(100vh - 70px);color:#f3f3f4}
   @media(max-width:800px){.v6-shell .v6-topbar{height:auto;padding:10px 14px;flex-wrap:wrap}.v6-shell .global-search{order:1;flex:1;min-width:210px}.v6-shell .topbar-actions{order:2}.v6-shell .today{display:none}.v6-shell .v6-main{padding:18px 14px;min-height:calc(100vh - 62px)}.v6-shell .repair-context-title{display:none}}
  `}</style>
  <aside className="side suite-side v6-side">
   <div className="brand suite-brand v6-brand"><div className="brand-mark"><Crown size={17}/></div><div>LUXURY <span>PHONE</span><small>ATELIER OS · V16 WORKFLOW PRO</small></div></div>
   <Link href="/settings" className="workspace-card" title="Ouvrir les paramètres de l'atelier"><div className="workspace-avatar">L</div><div><b>LUXURY PHONE</b><small>Poissy · Propriétaire</small></div><ChevronDown size={16}/></Link>
   <div className="v6-nav-scroll">{groups.map(g=><div key={g.label}><div className="nav-section-label">{g.label}</div><nav className="nav suite-nav v6-nav">{g.items.map(([href,label,Icon])=><Link key={href} href={href}><Icon size={17}/><span>{label}</span>{href==='/pos'&&<em>V15 POS</em>}{href==='/repairs'&&<em>V16 ERP</em>}</Link>)}</nav></div>)}</div>
   <div className="side-bottom"><div className="user-pill"><div className="avatar">{s?.name?.[0]||'A'}</div><div><b>{s?.name}</b><small>{s?.role==='ADMIN'?'Administrateur':'Technicien'}</small></div></div><form action="/api/auth/logout" method="post"><button className="icon-btn" title="Déconnexion"><LogOut size={17}/></button></form></div>
  </aside>
  <section className="suite-workspace">
   <header className="suite-topbar v6-topbar"><form action="/repairs" method="get" className="global-search"><Search size={17}/><input name="q" placeholder="Rechercher ticket, client, appareil, IMEI..."/><span className="kbd"><Command size={12}/> K</span></form><div className="topbar-actions"><div className="today"><CalendarDays size={16}/><span>{today}</span></div><Link href="/repairs?late=1" className="top-icon" title="Voir les dossiers en retard"><Bell size={18}/><i/></Link><Link className="btn top-create" href="/repairs/new"><Plus size={17}/> Nouvelle prise en charge</Link></div></header>
   <RepairContextDock/>
   <main className="main suite-main v6-main">{children}</main>
  </section>
 </div>
}
