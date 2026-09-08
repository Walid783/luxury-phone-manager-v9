'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, FileText, MessageSquareText, Printer, ShieldCheck, Tags, WalletCards } from 'lucide-react'

export default function RepairContextDock(){
  const pathname=usePathname()
  const match=pathname.match(/^\/repairs\/([^/]+)$/)
  if(!match)return null
  const id=match[1]
  return <div className="repair-context-dock">
    <div className="repair-context-title"><ClipboardList size={16}/><div><b>Dossier atelier V16</b><small>Toutes les actions principales au même endroit</small></div></div>
    <nav>
      <Link href={`/repairs/${id}`}><ClipboardList size={15}/> Dossier</Link>
      <Link href={`/cash/quick?repair=${id}`}><WalletCards size={15}/> Encaisser</Link>
      <Link href={`/communications?repair=${id}`}><MessageSquareText size={15}/> Client</Link>
      <Link href={`/warranties?repair=${id}`}><ShieldCheck size={15}/> SAV</Link>
      <Link href={`/tickets/${id}`} target="_blank"><Printer size={15}/> Ticket</Link>
      <Link href={`/labels/${id}`} target="_blank"><Tags size={15}/> Étiquette</Link>
      <Link href="/invoices"><FileText size={15}/> Factures</Link>
    </nav>
  </div>
}
