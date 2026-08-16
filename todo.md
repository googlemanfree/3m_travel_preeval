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

## Audit et Rapport Complet de Synchronisation Client-Administrateur-E-mail (v263)
- [x] Exécuter la suite complète de tests unitaires et de contrats tRPC pour vérifier l'ensemble des flux
- [x] Éditer et enregistrer le rapport d'audit complet (`audit_synchronisation_3m.md`)
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Relance Client, Audit PNR Exportable et Filtre Financier par Dates (v264)
- [x] Ajouter la relance client en un clic pour les PNR non consultés ou les paiements en attente avec notification e-mail
- [x] Créer la procédure d'exportation CSV du journal d'audit PNR pour l'administration
- [x] Intégrer le filtre par plage de dates dans le tableau des paiements de l'espace administrateur
- [x] Initialiser et formaliser la compétence réutilisable `prime-travel-case-management` avec `skill-creator`
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale et la compétence

## Boutons Spécifiques par Document et Vérification Admin (v265)
- [x] Transformer chaque élément de la checklist documentaire en un bouton d'action dédié (Passeport, Photo, Acte de naissance, Domicile, Ressources)
- [x] Assurer la transmission et la persistance immédiate de chaque type de document vers l'espace administrateur
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Intégration de la Page Facebook Officielle (v266)
- [x] Ajouter le lien officiel https://www.facebook.com/3mtravelcm dans le pied de page social du site
- [x] Vérifier l’accessibilité, l’ouverture dans un nouvel onglet et l’affichage responsive
- [x] Tester et publier la mise à jour

Votre page Facebook officielle à intégrer : https://www.facebook.com/3mtravelcm

Ce lien doit être utilisé dans la navigation, le pied de page ou les zones de contact sociales sans créer de faux contenu ni de témoignages.

## Enrichissement Réseau Social & QR Code Officiel (v267)
- [x] Ajouter des boutons d’appel à l’action Facebook bien visibles sur la page d’accueil et dans la section Contact
- [x] Créer un composant de flux de publications Facebook récentes de 3M Travel & Services sur la page d’accueil
- [x] Générer un QR code officiel pointant vers https://www.facebook.com/3mtravelcm et l'intégrer au pied de page et aux quittances/reçus PDF
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Parcours e-Visa Intelligent & Assisté par IA (v268)
- [x] Créer une page dédiée de lancement e-Visa par pays (`/evisa/lancer/:countryCode`) avec formulaire spécifique et checklist documentaire ciblée
- [x] Intégrer une assistance IA prudente pour analyser l'éligibilité et guider le candidat sur les pièces requises
- [x] Synchroniser les soumissions e-Visa avec le back-office et l'espace client (référence unique, pièces jointes, suivi de dossier)
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Suivi e-Visa en Direct dans l’Espace Client (v269)
- [x] Ajouter une section de suivi e-Visa dans l’espace personnel du candidat avec statut, étapes de progression et pièces jointes
- [x] Exposer les requêtes de suivi e-Visa synchronisées avec le back-office administrateur
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Barre de Progression Visuelle e-Visa (v270)
- [x] Intégrer une frise de progression à 3 étapes sur chaque carte e-Visa de l'espace client (Soumission ➔ Vérification pièces ➔ Traitement consulaire & Décision)
- [x] Valider avec les tests et TypeScript puis publier la version finale

## Remise Automatique du e-Visa Final (v271)
- [x] Étendre le modèle de données et l'administration e-Visa pour téléverser et valider le document e-Visa final approuvé
- [x] Automatiser l'envoi simultané par e-mail au client et l'affichage avec bouton de téléchargement dans son espace personnel
- [x] Valider avec les tests et TypeScript puis publier la version finale

## Envoi WhatsApp e-Visa Admin (v272)
- [x] Intégrer un bouton WhatsApp avec message prérempli et lien du document e-Visa final dans la gestion admin
- [x] Valider avec les tests et TypeScript puis publier la version finale
