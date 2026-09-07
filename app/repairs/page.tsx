import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { eur,statusLabel,statusClass,dateOnlyFr } from '@/lib/format'
import { ClipboardList, Search, Plus, List, Columns3, Download, UserRound, Clock3, ChevronRight, FolderOpen, Archive, CalendarDays, CheckCircle2, Wrench, PackageSearch, XCircle, SlidersHorizontal, ExternalLink, TimerReset, UserCheck, CircleDollarSign, Sparkles } from 'lucide-react'

const statusCards=[
 ['ALL','Tous',ClipboardList,'dark'],['DIAGNOSTIC','En diagnostic',Search,'purple'],['WAITING_APPROVAL','En attente accord',Clock3,'amber'],['REPAIRING','En réparation',Wrench,'blue'],['WAITING_PART','Attente de pièces',PackageSearch,'orange'],['READY','Prêt à restituer',CheckCircle2,'green'],['DELIVERED','Restitué',ClipboardList,'mint'],['CANCELLED','Abandonné',XCircle,'red']
] as const

export default async function Repairs({searchParams}:{searchParams:Promise<{q?:string,status?:string,view?:string,scope?:string,tech?:string,mine?:string,late?:string,paid?:string}>}){
 const s=await getSession(); if(!s)redirect('/login')
 const sp=await searchParams
 const q=(sp.q||'').trim(), status=sp.status||'', view=sp.view==='kanban'?'kanban':'list', scope=sp.scope||'active', tech=sp.tech||'', mine=sp.mine==='1', late=sp.late==='1', paid=sp.paid||''
 const where:any={}
 if(status&&status!=='ALL')where.status=status
 if(scope==='archive')where.status={in:['DELIVERED','CANCELLED']}; else if(!status)where.status={notIn:['DELIVERED','CANCELLED']}
 if(mine)where.assignedToId=s.id; else if(tech)where.assignedToId=tech
 if(late)where.AND=[...(where.AND||[]),{promisedAt:{lt:new Date()}},{status:{notIn:['READY','DELIVERED','CANCELLED']}}]
 if(q)where.AND=[...(where.AND||[]),{OR:[{deviceBrand:{contains:q,mode:'insensitive'}},{deviceModel:{contains:q,mode:'insensitive'}},{imei:{contains:q,mode:'insensitive'}},{issue:{contains:q,mode:'insensitive'}},{client:{is:{OR:[{name:{contains:q,mode:'insensitive'}},{phone:{contains:q}}]}}}]}]
 const [repairs,allCounts,techs,overdueCount]=await Promise.all([
  prisma.repair.findMany({where,orderBy:[{promisedAt:'asc'},{updatedAt:'desc'}],include:{client:true,payments:true,assignedTo:true}}),
  prisma.repair.groupBy({by:['status'],_count:{_all:true}}),
  prisma.user.findMany({where:{active:true},orderBy:{name:'asc'}}),
  prisma.repair.count({where:{promisedAt:{lt:new Date()},status:{notIn:['READY','DELIVERED','CANCELLED']}}})
 ])
 const filtered=paid?repairs.filter(r=>{const p=r.payments.reduce((a,x)=>a+Number(x.amount),0);const due=Math.max(0,Number(r.total)-p);return paid==='paid'?due<=0:due>0}):repairs
 const countMap=Object.fromEntries(allCounts.map(x=>[x.status,x._count._all])), total=Object.values(countMap).reduce((a,b)=>a+Number(b),0)
 const qs=(patch:Record<string,string>)=>{const p=new URLSearchParams();Object.entries({...sp,...patch}).forEach(([k,v])=>{if(v)p.set(k,v)});return `?${p.toString()}`}
 const back=qs({})
 return <AppShell>
  <div className="v7-page-head compact-head"><div><div className="eyebrow">COMPLETE WORKSHOP · V13</div><h1>Prises en charge</h1><p>Pilotez chaque appareil du dépôt à la restitution, avec une vue atelier temps réel.</p></div><div className="v7-title-actions"><Link className="btn secondary" href="/api/repairs/export"><Download size={16}/> Exporter CSV</Link><Link className="btn v7-primary" href="/repairs/new"><Plus size={17}/> Nouvelle prise en charge</Link></div></div>

  <section className="card v7-commandbar"><div className="segmented"><Link className={view==='list'?'active':''} href={qs({view:'list'})}><List size={16}/> Liste</Link><Link className={view==='kanban'?'active':''} href={qs({view:'kanban'})}><Columns3 size={16}/> Kanban</Link></div><div className="v7-command-divider"/><div className="v7-mini-stat"><Sparkles size={15}/><b>{filtered.length}</b><span>dossiers affichés</span></div><div className="toolbar-spacer"/><button className="soft-btn"><SlidersHorizontal size={15}/> Personnaliser les statuts</button></section>

  <div className="scope-tabs v7-scope-tabs"><Link className={scope==='active'?'active':''} href={qs({scope:'active',status:'',late:''})}><FolderOpen size={16}/> Actifs</Link><Link className={scope==='archive'?'active':''} href={qs({scope:'archive',status:'',late:''})}><Archive size={16}/> Archives</Link></div>

  <div className="status-cards v7-status-cards">{statusCards.map(([key,label,Icon,tone])=>{const n=key==='ALL'?total:(countMap[key]||0);return <Link className={`status-card ${tone} ${status===key?'selected':''}`} href={qs({status:key==='ALL'?'':key,scope:key==='DELIVERED'||key==='CANCELLED'?'archive':'active',late:''})} key={key}><Icon size={19}/><strong>{n}</strong><span>{label}</span></Link>})}</div>

  <section className="card v7-filter-card"><form className="v7-filters" method="get"><input type="hidden" name="view" value={view}/><input type="hidden" name="scope" value={scope}/><div className="search-box grow"><Search size={17}/><input name="q" defaultValue={q} placeholder="Rechercher ticket, client, téléphone, IMEI, appareil…"/></div><select name="status" defaultValue={status}><option value="">Tous les statuts</option>{Object.entries(statusLabel).map(([k,v])=><option value={k} key={k}>{v}</option>)}</select><select name="tech" defaultValue={tech}><option value="">Tous les techniciens</option>{techs.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select><select name="paid" defaultValue={paid}><option value="">Tous les paiements</option><option value="due">Reste à payer</option><option value="paid">Soldé</option></select><button className="btn secondary"><Search size={15}/> Filtrer</button></form><div className="v7-filter-chips"><Link className={mine?'active':''} href={qs({mine:mine?'':'1',tech:''})}><UserCheck size={14}/> Les miens</Link><Link className={late?'danger active':'danger'} href={qs({late:late?'':'1'})}><TimerReset size={14}/> En retard <b>{overdueCount}</b></Link><Link className={paid==='due'?'active':''} href={qs({paid:paid==='due'?'':'due'})}><CircleDollarSign size={14}/> À encaisser</Link></div></section>

  <section className="card v7-board-card">
   {view==='list'?<div className="table-wrap v7-table"><table><thead><tr><th>N° ticket</th><th>Appareil / client</th><th>Statut</th><th>Date</th><th>Planification</th><th>Technicien</th><th>Reste dû</th><th>Actions</th></tr></thead><tbody>{filtered.map(r=>{const paidTotal=r.payments.reduce((a,p)=>a+Number(p.amount),0),due=Math.max(0,Number(r.total)-paidTotal),isLate=!!r.promisedAt&&r.promisedAt<new Date()&&!['READY','DELIVERED','CANCELLED'].includes(r.status);return <tr key={r.id} className={isLate?'late-row':''}><td><b>TKT-{new Date(r.createdAt).getFullYear()}-{String(r.ticketNo).padStart(5,'0')}</b>{isLate&&<small className="late-label"><TimerReset size={11}/> En retard</small>}</td><td><strong>{r.deviceBrand} {r.deviceModel}</strong><small className="cell-sub"><UserRound size={11}/> {r.client.name} · {r.client.phone}</small></td><td><span className={`badge ${statusClass[r.status]}`}>{statusLabel[r.status]}</span></td><td>{dateOnlyFr(r.createdAt)}</td><td>{r.promisedAt?<span className={`plan-pill ${isLate?'late-plan':''}`}><CalendarDays size={13}/>{dateOnlyFr(r.promisedAt)}</span>:<span className="muted-pill">À planifier</span>}</td><td>{r.assignedTo?.name||'—'}</td><td><b className={due>0?'due-text':'paid-text'}>{eur(due)}</b></td><td><div className="v7-row-actions"><form action={`/api/repairs/${r.id}/quick-status`} method="post"><input type="hidden" name="back" value={`/repairs${back}`}/><select name="status" defaultValue={r.status} aria-label="Changer le statut"><option value="DIAGNOSTIC">Diagnostic</option><option value="WAITING_APPROVAL">Attente accord</option><option value="WAITING_PART">Attente pièces</option><option value="REPAIRING">En réparation</option><option value="READY">Prêt</option><option value="DELIVERED">Restitué</option><option value="CANCELLED">Abandonné</option></select><button className="soft-btn mini">OK</button></form><Link className="soft-btn mini" href={`/repairs/${r.id}`}>Voir</Link><Link className="icon-link" target="_blank" href={`/repairs/${r.id}`} title="Ouvrir dans un nouvel onglet"><ExternalLink size={15}/></Link></div></td></tr>})}</tbody></table></div>:<div className="kanban-board v7-kanban">{['DIAGNOSTIC','WAITING_APPROVAL','WAITING_PART','REPAIRING','READY'].map(st=><div className="kanban-col" key={st}><div className="kanban-head"><span className={`dot ${statusClass[st]}`}/><b>{statusLabel[st]}</b><em>{filtered.filter(r=>r.status===st).length}</em></div><div className="kanban-stack">{filtered.filter(r=>r.status===st).map(r=>{const p=r.payments.reduce((a,x)=>a+Number(x.amount),0),due=Math.max(0,Number(r.total)-p);return <Link href={`/repairs/${r.id}`} key={r.id} className="kanban-ticket v7-ticket"><small>TKT-{String(r.ticketNo).padStart(5,'0')}</small><strong>{r.deviceBrand} {r.deviceModel}</strong><span>{r.client.name}</span><div className="v7-ticket-meta"><em>{r.assignedTo?.name||'Non assigné'}</em><b>{eur(due)}</b></div><footer>{r.promisedAt?`Prévu ${dateOnlyFr(r.promisedAt)}`:'Non planifié'}<ChevronRight size={14}/></footer></Link>})}</div></div>)}</div>}
   {!filtered.length&&<div className="empty v7-empty"><ClipboardList size={28}/><b>Aucun dossier</b><span>Aucune prise en charge ne correspond aux filtres sélectionnés.</span><Link className="btn" href="/repairs/new"><Plus size={16}/> Créer un dossier</Link></div>}
  </section>
 </AppShell>
}
