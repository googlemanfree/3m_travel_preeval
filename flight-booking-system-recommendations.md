# Recommandations pour l'optimisation du système de réservation en ligne de 3M Travel Agency

## Introduction

Le système de réservation de vols en ligne de **3M Travel Agency** (disponible sur `/flights`) [1] constitue le point d'entrée clé pour les voyageurs d'Afrique centrale, en particulier pour les liaisons vers le Canada, l'espace Schengen et les États-Unis [2]. Bien que l'architecture actuelle intègre une recherche en temps réel, un panier multi-services, une sélection des catégories de passagers (adultes, enfants, bébés) et un parcours de checkout structuré avec collecte des données de passeport [3], le contexte spécifique du marché et les exigences de fiabilité GDS nécessitent une feuille de route d'amélioration rigoureuse.

Ce document présente une évaluation détaillée des forces actuelles, des points de friction potentiels et des recommandations opérationnelles structurées pour propulser l'expérience de réservation au meilleur standard international.

---

## 1. Analyse de l'existant et points forts

Le parcours actuel se distingue par plusieurs choix techniques et ergonomiques adaptés aux attentes des agences de mobilité internationale :

- **Recherche GDS et filtres multi-critères** : Les utilisateurs peuvent filtrer les résultats par prix, durée et nombre d'escales, avec un indicateur visuel des compagnies aériennes et des vols directs [3].
- **Gestion rigoureuse des passagers et des passeports** : Le formulaire de checkout collecte les informations réglementaires indispensables à l'émission des billets et à l'analyse consulaire ultérieure [3].
- **Continuité multicanal et post-booking** : La confirmation s'accompagne d'options d'export (PDF, Apple/Google Wallet, calendrier `.ics`) et de canaux de contact direct avec l'agence (WhatsApp, e-mail, téléphone) [3].
- **Résilience anti-blocage** : Le site bénéficie d'un mécanisme de récupération automatique en cas d'erreur de chunk et d'un filet de sécurité JavaScript autonome de 15 secondes [4].

---

## 2. Évaluation des points de friction et risques opérationnels

Pour les utilisateurs d'Afrique centrale, plusieurs défis subsistent lors de la réservation de vols en ligne :

| Composante du parcours | Risques identifiés | Impact utilisateur |
| :--- | :--- | :--- |
| **Tarification et disponibilité** | Décalage entre les tarifs affichés en ligne et les fluctuations GDS en temps réel | Frustration si le tarif change au moment de la validation manuelle par l'agence [3]. |
| **Moyens de paiement locaux** | Absence de passerelle directe pour les paiements mobiles (Orange Money, MTN MoMo) et cartes locales | Obligation de contacter l'agence physiquement ou par WhatsApp pour régler l'acompte [3]. |
| **Synchronisation des dossiers** | Saisie des passeports sans vérification instantanée de la lisibilité de la zone MRZ | Risque de rejet de la réservation par les compagnies aériennes en raison d'une faute de frappe [3]. |
| **Suivi post-réservation** | Absence de tableau de bord client centralisant l'historique des requêtes de vols en attente | Difficulté pour le client de suivre l'avancement de la revalidation GDS par les agents [3]. |

---

## 3. Recommandations prioritaires et feuille de route

### A. Fiabilisation des tarifs et connexion GDS en temps réel
- **Intégration stricte des sources GDS** : Veiller à ce que les tarifs proviennent de flux authentifiés (via SearchAPI / Galileo / Amadeus) avec indication claire de la politique bagages et des conditions d'annulation [3].
- **Mise en place d'un cache intelligent** : Conserver un cache court (5 à 10 minutes) sur les recherches fréquentes pour réduire les temps de latence tout en garantissant l'exactitude des prix au moment du checkout [3].

### B. Intégration des paiements mobiles et locaux (Afrique centrale)
- **Passerelle CinetPay / agrégateurs régionaux** : Intégrer un module de paiement sécurisé permettant le règlement direct par Orange Money, MTN Mobile Money et cartes bancaires internationales (Visa/Mastercard) [3].
- **Statut de paiement transparent** : Afficher clairement les états *En attente de paiement*, *Acompte réglé* et *Émis* dans l'espace client et le tableau de bord administrateur [3] [5].

### C. Automatisation de la vérification des passeports
- **Validation MRZ instantanée** : Permettre aux clients de téléverser la page d'identification de leur passeport pour une extraction automatique des données (nom, prénom, date de naissance, numéro) afin d'éliminer les erreurs de saisie manuelle au checkout [3].
- **Règle de conformité** : Alerter immédiatement le passager si la date d'expiration du passeport est inférieure à 6 mois par rapport à la date du voyage (exigence consulaire standard pour le Canada et Schengen) [3].

### D. Enrichissement de l'espace client et des notifications
- **Historique des recherches et des devis** : Permettre aux utilisateurs connectés de retrouver leurs recherches de vols sauvegardées et de transformer un devis en réservation ferme en un clic [3].
- **Notifications multicanal** : Déclencher des alertes automatiques par e-mail (via Resend) et par WhatsApp dès que l'agence valide l'émission du billet électronique [3].

---

## Conclusion

Le système de réservation de vols de **3M Travel Agency** dispose d'une base technique solide, moderne et résiliente. En y ajoutant le paiement mobile régional, l'extraction automatique des passeports et un suivi en temps réel des revalidations GDS, l'agence s'affirmera comme la référence incontournable de la mobilité internationale en Afrique centrale [3].

---

## Références

[1] Page publique de réservation de vols de 3M Travel Agency. URL : `https://www.3mtravelagency.com/flights`
[2] Documentation interne du projet : `todo.md` et `action-plan-improvements.md`.
[3] Spécifications techniques et parcours utilisateur : `client/src/pages/FlightBookingCheckout.tsx`, `client/src/pages/Flights.tsx`.
[4] Mécanismes de résilience et de bootstrap : `client/index.html`, `client/src/components/ErrorBoundary.tsx`.
[5] Gestion des paiements et rôles administrateur : `drizzle/schema.ts`, `server/routers.ts`.
