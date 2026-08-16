# 3M Travel & Services — Roadmap

## Exportation iCal des Réservations (v253)
- [x] Ajouter la procédure tRPC `exportCalendarIcal` dans `server/routers/tourism.ts` pour générer un flux .ics sécurisé
- [x] Intégrer le bouton d’export iCal dans le composant `AdminCalendarView.tsx` avec téléchargement instantané du fichier
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Système Centralisé de Réservation Multi-Services & PNR / Référence Fournisseur (v254)
- [x] Étendre le schéma Drizzle et les types pour stocker le PNR / référence fournisseur, la catégorie de service et la quittance PDF de réservation
- [x] Créer les procédures d’administration pour enregistrer le PNR GDS / référence, joindre un justificatif PDF et notifier le client
- [x] Intégrer l’affichage des réservations multi-services, des statuts et des PNR originaux dans l’espace client et le back-office
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Tableau Récapitulatif des Paiements de Réservation (v256)
- [x] Ajouter la procédure tRPC `listReservationPayments` pour extraire tous les règlements (Agence, Orange Money) et ID de transaction
- [x] Créer le composant `AdminReservationPayments.tsx` avec recherche par ID de transaction / référence, filtres par mode et statut, et validation rapide
- [x] Intégrer le tableau des paiements en tant qu'onglet ou section dédiée dans le tableau de bord administrateur (`AdminDashboard.tsx`)
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Envoi de Reçu de Paiement par E-mail depuis le Tableau Admin (v257)
- [x] Ajouter la procédure tRPC `sendPaymentReceiptEmail` pour envoyer le reçu de paiement et la quittance au client
- [x] Ajouter le bouton « Envoyer le reçu » dans le tableau admin `AdminReservationPayments.tsx` avec modale de confirmation
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Téléchargement de Reçu de Paiement PDF dans l’Espace Client (v258)
- [x] Ajouter une procédure tRPC pour générer ou récupérer le reçu de paiement PDF sécurisé d’une réservation client
- [x] Intégrer le bouton de téléchargement du reçu dans la liste des réservations de l’espace personnel du candidat
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Téléversement Admin du Document PNR et Alerte Visuelle Client (v259)
- [x] Ajouter une procédure tRPC d'administration pour téléverser et associer un document PDF PNR final à une réservation
- [x] Intégrer l'affichage du document PNR et un badge d'alerte visuelle de nouveau document dans l'espace personnel du client
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Prévisualisation Admin du Document PNR avant Envoi (v260)
- [x] Ajouter une modale de prévisualisation PDF intégrée pour l'administrateur avant de valider le téléversement du PNR final
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Synchronisation E-mail et Espace Client pour le Document PNR Final (v261)
- [x] Étendre la mutation d'administration pour envoyer automatiquement un e-mail au client avec le lien de téléchargement du PNR et les détails de référence dès le stockage réussi
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Indicateur Admin de Consultation et Téléchargement PNR par le Client (v262)
- [x] Étendre le schéma Drizzle et la table des réservations pour suivre l'état de consultation du PNR (`pnrViewedAt`)
- [x] Ajouter une procédure tRPC client pour enregistrer la consultation du PNR lors du clic ou du téléchargement
- [x] Afficher l'indicateur visuel et l'horodatage de lecture dans le tableau administrateur des paiements et réservations
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale
