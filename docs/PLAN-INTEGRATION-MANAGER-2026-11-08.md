# Plan d'intégration — Luxury Phone Manager (08/11/2026)

> Document de conception uniquement. Branche isolée `plan/integration-manager-finance-atelier-20261108`.
> Aucune migration Prisma, aucune connexion à la base de production, aucun déploiement, aucune notification.

## Objectif
Intégrer l'expérience de gestion atelier, caisse, crédits clients, stock et tableaux de bord dans le Manager actuel, en réutilisant les entités et pages existantes.

## État vérifié dans le dépôt
- Next.js 16, React 19, Prisma 6 et PostgreSQL : `package.json`, `prisma/schema.prisma`.
- Modèles existants : Client, Repair, Payment, Invoice, CashSession, CashMovement, InventoryItem, RepairPart, PosSale, PosRefund, RepairEvent, AuditLog.
- Pages existantes : `/repairs`, `/cash`, `/pos`, `/inventory`, `/reports`, `/clients`, `/invoices`.
- La présence du code ne prouve pas que les fonctions sont connectées à la production.

## Problèmes constatés à traiter en priorité
1. `app/api/repairs/[id]/status/route.ts` enregistre `total:Number(f.get('total')||0)` : une soumission sans champ total peut remettre le total à zéro. Ne jamais modifier le montant sans champ explicitement présent et validé.
2. `app/api/repairs/[id]/payment/route.ts` valide seulement le montant positif : pas de comparaison au solde, pas de liste blanche de moyens de paiement, pas d'exigence de session ouverte pour les espèces.
3. `app/api/cash/quick-payment/route.ts` dispose de contrôles de solde, mais les deux chemins ne partagent pas une transaction de paiement. Risques de paiement concurrent / double encaissement : ajouter idempotence et transaction PostgreSQL.
4. `app/api/repairs/[id]/status/route.ts` exige facture et règlement complet pour DELIVERED : conserver cette politique ou la rendre explicitement paramétrable après validation métier ; pas de changement implicite.
5. `app/reports/page.tsx` calcule le CA encaissé depuis les paiements de réparations uniquement : les ventes POS et remboursements ne sont pas rapprochés. Le bénéfice réel ne peut pas être déduit du CA.

## Architecture cible
- UI serveur/client Next.js conservée ; design noir/violet progressivement harmonisé.
- Service central `lib/finance/` (à développer ultérieurement) : soldes, encaissement, annulation/remboursement, opérations idempotentes, monnaie en centimes ou Decimal exact.
- Registre unifié des événements financiers avec source (réparation / vente / remboursement / dépense), horodatage, opérateur, moyen de paiement ; éviter les doubles comptages.
- Les réparations conservent leur statut opérationnel distinct du statut financier calculé :
  - NON_PAYE : solde = total
  - PARTIEL : 0 < encaissé net < total
  - PAYE : encaissé net >= total (écarts et trop-perçus signalés, pas ignorés)
- Lien vers stock existant via RepairPart/InventoryItem ; coût de pièce figé à la consommation (à envisager dans migration dédiée).
- Tableau de bord : CA encaissé net par jour/mois, ventes boutique, acomptes, soldes dus, dépenses, marge brute estimée avec coûts présents, anomalies.
- Authentification et journal AuditLog existants réutilisés ; autorisations vérifiées serveur ; minimisation des données client.

## Phases et critères d'acceptation
### Phase 0 — Audit et isolement (sans écriture sur production)
- Vérifier que ce dépôt est bien celui du projet Vercel Manager en production ; relever branche de déploiement.
- Sauvegarde restaurable contrôlée ; créer base PostgreSQL de test distincte avec données fictives.
- Relever les parcours UX réels (création réparation → acompte → fin → encaissement → restitution ; vente POS et remboursement).
- Conserver `main` inchangée ; ne pas configurer de preview avec la base de production.

### Phase 1 — Règlements fiables (priorité)
- Créer un service de paiement transactionnel unique pour la fiche réparation et la caisse rapide.
- Vérifier autorisation, montant, solde, méthode, fermeture de caisse, idempotence, audit.
- Afficher `total / encaissé net / reste dû` à partir d'une même fonction sur toutes les pages.
- Tests : réparation 109 € + règlement 109 € => solde 0, statut PAYE ; 50 + 59 => 0 ; deuxième tentative répétée => pas de doublon ; surpaiement refusé ; total absent dans formulaire de statut => total préservé.

### Phase 2 — Retrait du téléphone et documents
- Conserver les contrôles qualité/signature ; encaissement affiché dans le parcours de restitution.
- Synchroniser facture et état financier ; ticket/QR et historique.
- Cas de politique métier (paiement à la restitution) à confirmer avant d'ajuster la règle DELIVERED.

### Phase 3 — Caisse / stock / ventes
- Rapprochement ventes POS, remboursements, paiements atelier et espèces effectivement en caisse.
- Gérer coûts des pièces et corrections de stock avec historique sans double mouvement.
- Tester journée mixte réparation + vente + remboursement + dépôt.

### Phase 4 — Rapports et design
- Synthèse unifiée avec définitions des KPI (brut/net, TTC/HT, dates de paiement).
- Responsive PWA, noir/violet ; vues bureau et iPhone.
- Prévisualisation sur environnement de test, validation écrite, puis PR non fusionnée.

## Garde-fous impératifs
- Ne jamais exécuter `prisma db push`, `migrate deploy` ou un seed sur production durant ces phases.
- Ne pas réutiliser `DATABASE_URL` de production pour test ou preview.
- Ne pas envoyer e-mails / Telegram réels depuis la prévisualisation.
- Ne pas créer/éditer des rendez-vous clients réels.
- PR de test et revue des migrations/risques avant toute fusion ou déploiement.
- Pas de modification effective de production sans nouvelle demande explicite.
