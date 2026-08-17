# Référence technique — e‑Visa et back-office administrateur

**Projet :** 3M Travel & Services — Prime Travel Service  
**État de référence :** version publiée `32b8a7ce` (17 août 2026)  
**Public :** équipe de développement, QA et responsables techniques

> Ce document décrit le système tel qu’il est actuellement implémenté. Il ne remplace pas la vérification consulaire : les règles d’entrée, les frais, les délais et l’éligibilité restent à confirmer sur le portail officiel à chaque dossier.

## 1. Objectif et périmètre

Le module e‑Visa permet au candidat de choisir une destination, d’obtenir les exigences de procédure, de saisir une demande ciblée, de téléverser et faire analyser son passeport, puis de suivre le traitement dans son espace. Le poste administrateur constitue le bureau de production : il centralise l’examen de la demande, les documents, les messages, les liens consulaires, les décisions et la livraison du e‑Visa final.

La plateforme maintient deux représentations complémentaires. Le **catalogue normalisé côté client** sert à guider la sélection de destination et à générer des messages cohérents. Le **routeur e‑Visa côté serveur** porte les opérations de création, de suivi, de brouillon, de passeport et de livraison. Le back-office récupère ces signaux au sein de la fiche Client 360° et les conserve dans l’historique opérationnel. [1] [2] [3]

## 2. Architecture fonctionnelle

| Couche | Responsabilité | Composants principaux |
|---|---|---|
| Front-office e‑Visa | Catalogue, choix du pays, formulaire conditionnel, brouillons et suivi | `client/src/pages/Evisas.tsx`, `client/src/pages/EvisaApplication.tsx`, `client/src/pages/ClientEvisaTracking.tsx` |
| Catalogue normalisé | Métadonnées destination, exigences, portail, date de vérification, frais et délais indicatifs | `client/src/data/evisasDatabaseComplete.ts` |
| API e‑Visa | Listage, création, suivi, brouillon cloud, analyse passeport, livraison finale | `server/routers/evisaRouter.ts` |
| Bureau administrateur | Vue 360°, tâches, documents, paiements, workflow, communications et journal | `client/src/components/Candidate360Workspace.tsx`, `server/routers/admin.ts` |
| Communication | Notification espace client, e-mail SMTP, pièces jointes, instantanés e‑Visa et audit | `candidate_messages`, `client_notifications`, `case_activity_logs` |
| Stockage | Documents passeport et e‑Visa final via stockage S3 du projet | `server/storage.ts`, `storagePut()` |

## 3. Catalogue e‑Visa et règle de vérification

Le type `EvisaDestination` comprend un identifiant stable, le pays, la région, les documents, les frais et délais indicatifs, les étapes de procédure, ainsi que les champs optionnels `officialPortalUrl`, `officialPortalLabel` et `officialVerifiedAt`. Les destinations non entièrement confirmées sont explicitement marquées **« éligibilité à confirmer »** ; leurs textes imposent une vérification avant paiement ou réservation. [2]

Le catalogue est la source utilisée dans la modale de communication administrateur. Il ne doit pas être confondu avec la table SQL historique `evisas` utilisée par certains endpoints de `evisaRouter`. Toute extension de pays doit mettre à jour la fiche normalisée, le portail officiel, la date de contrôle, les tests de catalogue et, si le flux SQL est concerné, l’enregistrement SQL correspondant.

### Règles d’édition d’une destination

| Élément | Règle technique |
|---|---|
| Identifiant | Stable, en minuscules et sans dépendre du libellé commercial. |
| Portail | URL HTTPS du portail gouvernemental ou de l’opérateur officiellement désigné. |
| Date de vérification | Chaîne explicite et lisible ; actualiser après chaque contrôle documentaire. |
| Exigences | Décrire les pièces nécessaires sans affirmer une éligibilité individuelle. |
| Frais/délai | Indiquer « à confirmer » quand la source officielle ne permet pas une valeur fiable. |
| Régression | Ne jamais remplacer le catalogue par un lot plus court sans fusion et test de non-régression. |

## 4. Flux candidat e‑Visa

1. Le candidat choisit une destination dans le catalogue e‑Visa.
2. Le formulaire utilise les données de destination pour afficher les exigences et les informations de procédure.
3. Le passeport peut être téléversé ; l’analyse IA récupère des champs, puis le candidat les relit et les corrige. Les corrections sont auditées dans `evisa_passport_correction_history` lors de la soumission. [1]
4. La demande est enregistrée dans `evisa_requests` avec les informations personnelles, pays, frais, notes et références documentaires.
5. Le candidat peut retrouver sa demande et son statut depuis son espace.
6. Lorsqu’un administrateur téléverse un PDF e‑Visa final, le fichier est contrôlé, stocké, lié à la demande, rendu téléchargeable et notifié par e-mail. [1]

### États e‑Visa principaux

| État | Signification | Action administrative attendue |
|---|---|---|
| `submitted` | Demande soumise par le candidat | Vérifier la cohérence des données et pièces. |
| `pending` | En attente de prise en charge ou paiement | Demander les éléments manquants / confirmer la suite. |
| `processing` | Traitement en cours | Mettre à jour le dossier et informer le candidat si nécessaire. |
| `approved` | Décision ou document final disponible | Téléverser le PDF, notifier et tracer la livraison. |
| `rejected` | Refus ou dossier impossible à poursuivre | Ajouter un motif opérationnel explicite et guider le candidat. |
| `completed` | Traitement clos | Conserver documents, journal et décision. |

## 5. Sécurité e‑Visa

La livraison administrative du e‑Visa final ne repose pas sur la seule présence d’un jeton. `adminUploadEvisaPdf` appelle `requireValidAdminSession`, contrôle l’existence et la validité du compte administrateur, vérifie l’encodage, la taille maximale, la signature `%PDF-` et normalise le nom de fichier avant stockage. Le fichier n’est donc jamais accepté uniquement sur une extension déclarée par le navigateur. [1]

Le document final est d’abord enregistré dans le stockage et le statut de la demande est mis à jour. L’échec de l’e-mail n’annule pas une décision déjà enregistrée ; il est journalisé afin d’éviter les faux succès tout en préservant le résultat disponible dans l’espace client. [1]

> **Dette technique à planifier :** quelques endpoints historiques du routeur utilisent encore des requêtes SQL construites par interpolation (`sql.raw`) ou une procédure publique de lecture par e-mail. Toute évolution de ces endpoints doit prioriser la paramétrisation des requêtes, la limitation des entrées et un contrôle d’appartenance par session candidat. Le flux de livraison finale est, lui, déjà protégé par session admin valide.

## 6. Back-office : fiche Client 360°

La fiche `Candidate360Workspace` est la surface opérationnelle principale. Elle interroge `admin.getCandidate360` avec un jeton de session admin et se rafraîchit explicitement après chaque mutation. Les domaines de travail sont **Vue d’ensemble**, **Évaluation**, **Documents**, **Paiements**, **Échanges** et **Historique**. [3]

| Domaine | Opérations principales |
|---|---|
| Vue d’ensemble | Statut opérationnel, priorité, conseiller, échéance, libellés et prochaine action. |
| Évaluation | Brouillon IA, données à vérifier, édition, versions, validation humaine et livraison du bilan. |
| Documents | Checklist par pays/procédure, pièces déposées, pièces manquantes, refus et relances. |
| Paiements | Lecture du statut, justificatifs, références et actions de validation métier. |
| Échanges | Message libre, modèles, pièce jointe, insertion e‑Visa, notifications et export PDF. |
| Historique | Changement d’étape, notes, actions, responsables et horodatages. |

### Synchronisation de progression

La mutation `admin.updateCandidate360Workflow` fait évoluer le cas opérationnel et propage un statut compatible vers les données visibles par le candidat. Les étapes de travail du bureau sont `new`, `qualifying`, `waiting_customer`, `documents_review`, `payment_review`, `processing`, `submitted`, `completed`, `closed` et `rejected`. Le front affiche une confirmation explicite lorsque la progression devient visible dans l’espace client. [3] [4]

## 7. Communications, instantanés e‑Visa et audit

La mutation `admin.sendCandidate360Message` exige une session administrateur valide. Elle enregistre une notification espace client, un message dans `candidate_messages`, une tentative d’e-mail et une activité dans `case_activity_logs`. Une pièce jointe peut être associée au message par URL, nom, type MIME et taille. [4]

### Insertion e‑Visa dans le message

Dans la modale de message, l’administrateur sélectionne une destination. `buildEvisaMessageTemplate` injecte le portail, la date de vérification, les exigences, frais, délai et lien de procédure. L’administrateur conserve toujours la possibilité de modifier le texte avant l’envoi. `buildEvisaMessageSnapshot` produit en parallèle la structure versionnée archivée. [5]

Lors de l’envoi, l’API conserve dans `candidate_messages.evisaSnapshotJson` :

```json
{
  "version": 1,
  "sharedAt": "ISO-8601",
  "sharedByAdminId": 123,
  "messageContentAtSend": "texte exact envoyé",
  "items": [
    {
      "destinationId": "kenya",
      "country": "Kenya",
      "officialPortalUrl": "https://…",
      "officialVerifiedAt": "…",
      "requirements": "…",
      "fee": "…",
      "delay": "…",
      "procedureUrl": "/evisas/request?destination=kenya"
    }
  ]
}
```

L’historique du dossier affiche l’instantané associé au message. Une évolution future du catalogue ne modifie donc jamais la version effectivement communiquée au candidat. La colonne SQL `candidate_messages.evisaSnapshotJson` est nullable pour préserver la compatibilité avec les messages antérieurs. [4] [6]

## 8. Export PDF d’historique

Le bouton **« Exporter l’historique PDF »** de l’onglet Échanges construit localement un document A4 avec : messages, notifications, pièces jointes référencées, instantanés e‑Visa, identité du candidat, numéro de dossier, date d’export, en-tête 3M Travel et filigrane « 3M TRAVEL ». [3] [7]

Après génération, le front appelle `admin.recordCandidate360CommunicationExport`. Cette mutation vérifie à nouveau la session administrateur et crée l’activité `communications_pdf_exported` dans `case_activity_logs`. L’export est donc audit-able, sans stocker une copie brute du PDF dans la base. [4]

## 9. Évaluation IA et lien avec la gestion des dossiers

Le CV alimente un brouillon d’évaluation IA interne. Le conseiller peut corriger les données, le score, les recommandations et le texte. La validation humaine reste obligatoire avant livraison. Cette validation crée le numéro de dossier final, puis alimente simultanément l’espace client et l’e-mail. Après huit heures sans validation, la file admin signale une priorité interne ; elle ne diffuse jamais automatiquement un bilan non approuvé. [8]

## 10. Données et tables clés

| Table / modèle | Utilité |
|---|---|
| `evisa_requests` | Demandes e‑Visa issues du formulaire ciblé, statut et URL de PDF final. |
| `evisa_passport_correction_history` | Trace des extractions IA et corrections manuelles du passeport. |
| `evisa_drafts` | Brouillons e‑Visa synchronisés par e-mail et pays. |
| `candidate_messages` | Messages candidat/conseiller, pièces jointes et `evisaSnapshotJson`. |
| `client_notifications` | Notifications visibles dans l’espace candidat. |
| `cases` / `case_activity_logs` | Cas opérationnel et journal administratif. |
| `applications` / `agency_dossiers` | Données source des dossiers en ligne et dossiers agence. |
| `evaluation_bilan_versions` | Versions, validations et audit des bilans d’évaluation. |

## 11. Contrats tRPC à connaître

| Procédure | Rôle |
|---|---|
| `evisa.getAllEvisas`, `getEvisaByCountry` | Catalogue SQL historique et détail e‑Visa. |
| `evisa.submitRequest` | Soumission front-office d’une demande e‑Visa. |
| `evisa.getMyEvisaRequests` | Suivi de demandes par e-mail dans le parcours existant. |
| `evisa.saveCloudDraft`, `getCloudDraft` | Reprise multi-appareil d’un brouillon. |
| `evisa.adminUploadEvisaPdf` | Livraison admin du PDF e‑Visa final, stockage et e-mail. |
| `admin.getCandidate360` | Charge l’agrégat dossier, documents, paiements, communications, audit et conseillers. |
| `admin.updateCandidate360Workflow` | Met à jour le workflow et la synchronisation client. |
| `admin.sendCandidate360Message` | Envoie message, notification, pièce jointe, e-mail et instantané e‑Visa. |
| `admin.recordCandidate360CommunicationExport` | Journalise l’export PDF administratif. |

## 12. Vérification et reprise par l’équipe

Avant tout déploiement d’une modification e‑Visa ou administrative, exécuter les contrôles suivants :

```bash
pnpm exec tsc --noEmit
pnpm test -- --reporter=dot
pnpm exec playwright test e2e/admin-dossier-workspace.spec.ts --reporter=line
```

Les suites pertinentes couvrent le catalogue, l’autorisation d’upload e‑Visa, l’insertion e‑Visa dans un message, l’instantané de communication, l’export PDF et la fiche Client 360°. En cas de modification du schéma Drizzle, générer et examiner la migration SQL avant application ; si les snapshots Drizzle historiques sont invalides, documenter l’écart et appliquer uniquement une migration SQL non destructive explicitement revue.

## 13. Priorités techniques recommandées

1. **Uniformiser les sources e‑Visa** : converger progressivement le catalogue TypeScript et les tables SQL `evisas` vers un contrat unique versionné.
2. **Durcir les endpoints historiques** : remplacer les interpolations SQL restantes par des requêtes paramétrées et supprimer les consultations par e-mail non authentifiées.
3. **Automatiser le contrôle des portails** : produire une file de vérification des destinations dont `officialVerifiedAt` est ancien.
4. **Ajouter des tests d’intégration serveur** : simuler une session admin, l’écriture du message et l’enregistrement de l’instantané dans une base de test.
5. **Normaliser les documents** : enregistrer les clés S3 et les métadonnées de stockage de manière homogène pour les e‑Visas, PNR, bilans et quittances.

## Références internes

[1]: ../server/routers/evisaRouter.ts "Routeur e‑Visa"
[2]: ../client/src/data/evisasDatabaseComplete.ts "Catalogue e‑Visa normalisé"
[3]: ../client/src/components/Candidate360Workspace.tsx "Fiche Client 360°"
[4]: ../server/routers/admin.ts "Routeur du back-office administrateur"
[5]: ../client/src/lib/evisaMessageTemplate.ts "Modèle et instantané de message e‑Visa"
[6]: ../drizzle/schema.ts "Schéma Drizzle — messages candidats"
[7]: ../client/src/components/CommunicationHistoryPdfButton.tsx "Export PDF de l’historique"
[8]: ../server/routers/unifiedRequests.ts "Évaluation, validation et livraison synchronisée"
