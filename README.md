# Luxury Phone Manager V13 — Complete Workshop ERP

V13 consolide l'atelier, la caisse, l'impression et la traçabilité dans une seule suite.

## Modules principaux
- Tableau de bord et pipeline atelier
- Prise en charge 4 étapes avec client, appareil, photos, consentements, acompte et signature
- Dossiers réparation, planning, techniciens, statuts, devis, factures et paiements
- Stock, pièces consommées, achats et commandes
- Caisse avec ouverture, fond de caisse, mouvements, clôture et calcul d'écart
- SAV & garanties avec réclamations liées au dossier d'origine
- Communications CRM journalisées (SMS, WhatsApp, email, appel)
- Impression QZ Tray, ticket 80/58 mm, étiquette Brother et QR client
- Suivi client sécurisé par jeton QR unique
- Journal d'audit administrateur
- Rapports, équipe, agenda et appareils de prêt

## Installation
```powershell
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Copier `.env.example` vers `.env` puis renseigner `DATABASE_URL`, `AUTH_SECRET` et `NEXT_PUBLIC_APP_URL`.

## Déploiement Vercel
Build command recommandé :
```bash
npx prisma generate && next build
```

Variables Vercel : `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`.
