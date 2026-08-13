# Stratégie Globale et Architecture pour la Plateforme de Réservation 3M Travel (Vols, Hôtels & Véhicules)

## Introduction et Vision Stratégique

L’expansion d’une agence de mobilité internationale en Afrique centrale vers une plateforme intégrée de réservation en ligne (**Vols, Hôtels et Location de Véhicules**) représente un levier de croissance majeur. Pour s’imposer comme le leader incontesté face aux acteurs internationaux, la plateforme doit allier la puissance technologique des agrégateurs mondiaux (GDS / Travelport / Amadeus, APIs hôtelières et loueurs) à la proximité indispensable en Afrique centrale (paiements mobiles locaux Orange Money / MTN MoMo, validation en agence, et accompagnement consulaire pour les visas).

Ce document présente l’architecture fonctionnelle, les choix d’intégration, les flux de réservation et le plan de déploiement par étapes pour 3M Travel Agency.

---

## 1. Architecture Fonctionnelle et Expérience Utilisateur (UX)

L’expérience utilisateur doit reposer sur un moteur de recherche unifié en page d’accueil, permettant de composer un voyage complet ou de réserver chaque prestation de manière indépendante.

| Module | Fonctionnalités Clés | Spécificités Marché (Afrique Centrale) |
|---|---|---|
| **Vols** | Recherche multi-destinations, classes de cabine, filtres par escales/alliances, calcul exact Adultes / Enfants / Bébés, classes GDS (*Fare Basis*, *Booking Class*), taxes incluses. | Indication claire des tarifs en direct vs tarifs simulés, et option de validation par l'agence pour les paiements en espèces ou en agence. |
| **Hôtels** | Filtres par standing, piscine, Wi-Fi, petit-déjeuner inclus, politique d'annulation, avis vérifiés, géolocalisation et photos haute définition. | Partenariats avec des hôtels clés sur Douala, Yaoundé, Abidjan, Paris, Montréal et les principales capitales européennes et africaines. |
| **Location de Véhicules** | Choix de la catégorie (Économique, SUV, Berline de luxe), options conducteur additionnel, GPS, siège bébé, kilométrage illimité ou restreint. | Partenariats avec des agences locales (Hertz, Avis, loueurs locaux) avec option de livraison du véhicule à l'aéroport (NSI, DLA). |

---

## 2. Intégrations Fournisseurs et Fiabilité des Tarifs

Pour garantir l'exactitude des tarifs et éviter les écarts constatés avec les systèmes GDS traditionnels, l'architecture technique doit s'appuyer sur des connexions robustes.

```
┌────────────────────────────────────────────────────────┐
│                   3M Travel Frontend                   │
│         (Recherche unifiée Vols / Hôtels / Autos)        │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                API Gateway & Orchestration             │
└────┬─────────────────────┼─────────────────────┬───────┘
     │                     │                     │
     ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  GDS Flights │    │ Hotel Beds / │    │ Car Rental   │
│(Amadeus/Sabre│    │ Booking API  │    │ APIs / Local │
│ / SearchAPI) │    │              │    │ Aggregators  │
└──────────────┘    └──────────────┘    └──────────────┘
```

* **Revalidation Automatique** : Lors de la sélection d'un vol, d'un hôtel ou d'un véhicule, le système interroge l'API fournisseur en temps réel pour verrouiller le tarif (*Fare Quote*) avant le paiement ou la transmission du dossier en agence.
* **Gestion des Quotats et du Cache** : Mise en place d'un cache intelligent (Redis / mémoire) pour les recherches fréquentes, réduisant les appels superflus tout en garantissant un rafraîchissement des prix au moment du panier.

---

## 3. Parcours de Réservation et Paiement Hybride

Le tunnel de conversion doit répondre aux réalités bancaires de la région en combinant paiements numériques sécurisés et validation physique en agence.

1. **Sélection et Composition du Panier** : Le client ajoute son vol, son hôtel et son véhicule. Le récapitulatif affiche clairement le détail des taxes, des frais de service et des conditions d'annulation.
2. **Choix du Mode de Paiement** :
   * **Paiement Mobile & Carte** : Intégration de CinetPay / Stripe pour cartes bancaires (Visa/Mastercard) et Mobile Money (Orange Money, MTN MoMo).
   * **Paiement en Agence** : Génération d'un bon de réservation avec code QR et numéro de PNR/dossier temporaire. Le client dispose de 24h à 48h pour régler en espèces ou par virement en agence.
3. **Validation et Émission** : Dès que le paiement est validé (par l'administrateur dans le dashboard ou par webhook de paiement), le système déclenche l'émission automatique du billet électronique ou du voucher, ainsi que l'e-mail de confirmation VIP.

---

## 4. Espace Client et Tableau de Bord Administrateur

### Espace Client Centralisé
* **Mes Réservations** : Suivi en temps réel de tous les services (statut du vol, voucher d'hôtel, bon de location de voiture).
* **Documents de Voyage** : Téléchargement centralisé des factures, e-billets, attestations d'assurance et guides PDF de destination.
* **Favoris et Historique** : Sauvegarde des recherches fréquentes et des itinéraires favoris.

### Tableau de Bord Administrateur
* **Centralisation des PNR et Dossiers** : Vue unifiée des dossiers contenant vols, hôtels et véhicules.
* **Validation des Paiements Agence** : Interface dédiée pour approuver ou rejeter les paiements en espèces/agence avec notification automatique par e-mail et SMS.
* **Gestion des Fournisseurs et Marges** : Ajustement dynamique des commissions agence par type de prestation.

---

## 5. Plan de Déploiement par Étapes (Roadmap MVP)

* **Phase 1 (MVP Actuel)** : Fondation solide, moteur de vols GDS/simulé, gestion des passeports, espace candidat/admin, e-mails Resend et multilinguisme FR/EN.
* **Phase 2 (Extension Hôtels & Véhicules)** : Intégration des catalogues hôteliers et des partenaires loueurs de voitures avec formulaires de demande et devis automatisés.
* **Phase 3 (Paiement Intégré Avancé)** : Automatisation complète des passerelles de paiement mobile money et cartes avec émission instantanée de billets.
* **Phase 4 (Application Mobile & Fidélisation)** : Lancement d'une application dédiée et d'un programme de fidélité pour les voyageurs fréquents de la diaspora et d'Afrique centrale.

---

## Conclusion

La transformation de 3M Travel Agency en une plateforme omnicanale de référence pour les voyages, les hôtels et les véhicules positionnera l'agence comme le partenaire incontournable de la mobilité internationale. En combinant la rigueur des standards GDS mondiaux et la flexibilité des paiements locaux, la solution garantit à la fois la confiance des clients et l'efficacité opérationnelle des administrateurs.
