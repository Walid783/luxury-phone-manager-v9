# Remplacement du Planning Atelier par Luxury Phone Manager — protocole de migration sûre
Date : 8 novembre 2026 — **préparation, sans bascule de production**

## Dépôts et origine des données vérifiés
- Site client et planning actuel : `Walid783/-luxury-phone` (Vercel projet `luxury-phone`), chemin `/planning`.
- Nouveau Manager : `Walid783/luxury-phone-manager-v9` (Vercel `luxury-phone-manager-v9`), branche premium `plan/integration-manager-finance-atelier-20261108`.
- Ancien planning : Drizzle PostgreSQL, `appointments`, `repair_orders`, `repair_payments`, `spare_parts`, `repair_services`. Authentification dédiée par cookie `luxury_planning_session`.
- Nouveau Manager : Prisma PostgreSQL, `Client`, `Repair`, `Payment`, `InventoryItem`, `RepairPart`, `Invoice`. Authentification JWT cookie `lpm_session`.
- **Aucune preuve de partage de la même base**. Il est interdit d'assumer que le Manager voit les rendez-vous du site client.

## Correspondances à implémenter en lecture seule d'abord
| Planning actuel | Manager cible | Règle |
|---|---|---|
| appointments.id (UUID) | nouvelle table de mapping LegacyAppointment | Conserver UUID original, unicité et lien vers Client/Repair |
| appointments.public_code | champ d'ID source distinct | Conserver public_code / QR de suivi |
| client_name, phone, email | Client | Pas de fusion automatique sur téléphone seul ; contrôle des homonymes |
| device_type / brand / model / issue | Repair | Mapper catégories et caractères sans perte |
| appointment_date, start_time, duration_minutes | modèle Appointment à créer dans le Manager | Le Manager actuel n'a pas de modèle Appointment dédié ; ne pas transformer un RDV en Repair sans conserver l'horaire |
| status français | statuts de RDV à définir | Mapping explicite ; garder statut original pour audit |
| repair_orders (1:1 appointment) | Repair | Conserver diagnostic, photos, IMEI, accessoires et consentements |
| repair_orders.price_cents / deposit_cents | Repair total / acompte et paiements | Sommes en centimes exacts ; éviter de compter acompte et Payment 2 fois |
| repair_payments.request_key | clé d'idempotence conservée | Dédupliquer lors d'une reprise ou synchronisation |
| spare_parts + repair_services | InventoryItem + catalogue prestations | Stock initial réconcilié, sans soustraire une deuxième fois les pièces déjà consommées |

## Protocole
1. Sauvegarder les deux bases (dump chiffré) et tester une restauration **hors production**.
2. Identifier le bon environnement Vercel et les domaines; vérifier que preview n'utilise aucune variable PostgreSQL de production, y compris `DIRECT_URL`.
3. Créer une base de test isolée et y charger des données fictives ou un extrait anonymisé.
4. Ajouter au Manager les tables de RDV et correspondance legacy par **migrations versionnées** réversibles ; ne pas exécuter `prisma db push` sur production.
5. Écrire un importeur relançable (idempotent) sans envoyer de notification, avec décompte source/cible, hash des données et audit.
6. Tester : RDV passés/futurs, déplacements, clients, fiches, encaissements et remboursements, stock, prix, suivi par QR code, concurrence et session.
7. Prévoir un mécanisme de double lecture/gel des écritures pendant la bascule pour garantir zéro perte; pas de double écriture en aveugle.
8. Quand tous les comptes et soldes concordent et que les deux applications sont sécurisées : changer /planning vers le Manager avec redirection contrôlée (SSO ou connexion dédiée), conserver un moyen de retour arrière, et surveiller les erreurs.
9. Garder le site client et sa prise de rendez-vous publique ; raccorder leur API au nouveau modèle de planning testé avant de supprimer la page ancienne.

## Critères de validation / non-régression
- 100% des RDV et dossiers transférés, IDs d'origine traçables.
- Totaux encaissés et impayés identiques, aucun doublon de paiements.
- Réception des nouveaux RDV du site client confirmée en test.
- Fonctionnement des notifications e-mail et Telegram vérifié sans envois réels en preview.
- Authentification sécurisée, mot de passe administrateur historique révoqué si encore actif.
- Test PWA sur Windows, UI noir et violet.
- Aucun accès production, aucune redirection /planning et aucune migration jusqu'à contrôle et validation.

## Situation actuelle
Branche de préparation uniquement. **Remplacement non exécuté.**
