import Script from 'next/script'
import './globals.css'
import './repair-readability.css'

export const metadata={title:'Luxury Phone Manager V13 — Complete Workshop ERP',description:'Gestion atelier, caisse et impression Luxury Phone'}

export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="fr"><body>{children}<Script id="qz-tray" src="https://cdn.jsdelivr.net/npm/qz-tray@2.2.5/qz-tray.js" strategy="afterInteractive"/></body></html>
}
