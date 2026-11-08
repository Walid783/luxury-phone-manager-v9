# Rapport de vérification — 8 novembre 2026

## Portée
Contrôle statique des fichiers GitHub sur la branche isolée et simulations arithmétiques du solde en centimes. Aucun accès à PostgreSQL, aucune compilation du projet, aucun test HTTP, aucun déploiement.

## Vérification statique du code
- [x] Le changement de statut conserve le total si le champ total est absent.
- [x] Les deux routes d'encaissement appellent `recordRepairPayment`.
- [x] Refus du montant supérieur au reste dû.
- [x] Refus du paiement si la réparation est déjà soldée.
- [x] Espèces nécessitant une session de caisse ouverte.
- [x] Transaction SERIALIZABLE avec nouvelle tentative P2034.
- [x] Mise à jour de facture et audit à l'intérieur de la transaction.
- [ ] Clé d'idempotence durable et contrainte unique absentes.
- [ ] Compilation TypeScript / Next.js non exécutée.
- [ ] Test d'intégration PostgreSQL non exécuté.
- [ ] Test réel de concurrence et de soumission répétée non exécuté.

## Simulations des règles de calcul
| Cas | Résultat attendu | Résultat simulé |
| --- | --- | --- |
| 109 € sur 109 € | reste 0 € | OK |
| 50 € + 59 € sur 109 € | reste 0 € | OK |
| 50 € sur 109 € | reste 59 € | OK |
| 110 € sur 109 € | refus, reste 109 € | OK |
| 109 € puis 109 € sur 109 € | second refus, reste 0 € | OK |

Ces simulations testent le calcul en mémoire, pas le code exécuté avec la base de données.

## Critères avant déploiement
1. Ajouter clé d'idempotence enregistrée avec unicité dans la base de test et lier les écritures aux requêtes.
2. Exécuter `npm ci && npm run build` sur un checkout isolé.
3. Utiliser une base de test entièrement séparée ; ne jamais partager `DATABASE_URL` production.
4. Tester via HTTP les deux parcours, absence du champ `total`, caisse fermée, double soumission et simultanéité.
5. Vérifier les totaux, factures, mouvements de caisse et audit après transaction.
6. Faire valider les résultats avant toute mise en production.
