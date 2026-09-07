import {redirect} from 'next/navigation'
import AppShell from '@/components/AppShell'
import {getSession} from '@/lib/auth'
import PrintSettingsClient from '@/components/PrintSettingsClient'
export default async function PrintSettings(){if(!(await getSession()))redirect('/login');return <AppShell><div className="v9-page-head"><div><div className="eyebrow">CAISSE, IMPRESSION & ÉTIQUETTES</div><h1>Encaissement, impression et étiquettes</h1><p>Pilotez les reçus, tickets thermiques, étiquettes atelier et préférences d'impression de ce poste.</p></div><div className="v9-help-box">Réglages locaux du poste Luxury Phone · V13 Complete ERP</div></div><PrintSettingsClient/></AppShell>}
