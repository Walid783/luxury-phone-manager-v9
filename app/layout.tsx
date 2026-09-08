import Script from 'next/script'
import './globals.css'
import './repair-readability.css'
import './theme-v151.css'

export const metadata={title:'Luxury Phone Manager V15.1 — Premium Workshop ERP',description:'Gestion atelier, caisse et réparation Luxury Phone'}

export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="fr"><body>{children}<Script id="qz-tray" src="https://cdn.jsdelivr.net/npm/qz-tray@2.2.5/qz-tray.js" strategy="afterInteractive"/></body></html>
}
