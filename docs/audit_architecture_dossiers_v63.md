# Audit d’architecture — système de gestion de dossiers

**Périmètre.** Cet audit est strictement consultatif : aucune table, colonne, donnée ou migration n’a été créée, supprimée ou modifiée. Il compare le schéma Drizzle, la base réellement connectée, les routeurs enregistrés et les pages routées de l’application au modèle métier demandé pour 3M Travel & Services SARL.

## 1. Synthèse exécutive

L’application possède déjà de nombreux composants utiles : comptes candidats, évaluations, dossiers payants, dépôt de documents, messagerie, paiement, dossiers agence, suivi administratif, notifications administratives et pages séparées pour les espaces client et admin. Elle ne constitue toutefois pas encore **un unique système métier de dossiers**. Les mêmes concepts sont répartis entre plusieurs modèles, parfois sans relation de base de données ni contrôle de propriété uniforme.

> **Conclusion.** La priorité n’est pas de reconstruire le site vitrine ni de supprimer les modèles existants. Il faut d’abord stabiliser le schéma réel, sécuriser les accès aux données de dossier, choisir une source de vérité pour le dossier, puis introduire une couche canonique de workflow par migration progressive.

## 2. État réel observé

| Élément contrôlé | Constat | Niveau |
| --- | --- | --- |
| Tables réellement présentes | 59 tables sont présentes dans la base connectée. | Information |
| Données de test ou d’exploitation | Les tables cœur auditées sont presque vides : 2 comptes `users`, 1 candidat, et aucun dossier/document/paiement observé dans les compteurs disponibles. | Opportunité de consolidation précoce |
| Migrations tracées | Le dossier `drizzle/migrations` ne contient aucun fichier SQL alors que la base contient `__drizzle_migrations`. | **Critique** |
| Relations physiques | Les tables métier auditées ne disposent que de clés primaires et de quelques unicités ; aucune clé étrangère n’a été retournée par `information_schema`. | **Critique** |
| Écart schéma/base | `client_dossiers` et `dossier_updates` sont déclarées dans `drizzle/schema.ts`, mais absentes de la base connectée. | **Critique** |
| Routeurs | De nombreux routeurs historiques et V2/V3 coexistent ; le routeur principal expose plusieurs voies pour le même domaine métier. | Élevé |

## 3. Inventaire des modèles et de leur usage

### 3.1 Identités et accès

| Modèle | Colonnes/usage clés | État | Écart par rapport à la cible |
| --- | --- | --- | --- |
| `users` | OAuth Manus, `openId` unique, rôle `user/admin/translator`. | Présent et utilisé par les procédures génériques. | Ne couvre pas l’authentification e-mail client ni le rôle `super_admin`. |
| `user_accounts` | E-mail, hash de mot de passe, vérification et réinitialisation. | Présent. | Chevauche `candidates` sans lien explicite. |
| `candidates` | Profil client, hash, OTP, destination, statut, score. | Présent, 1 enregistrement observé. | Mélange identité, authentification et état métier ; aucun lien FK vers un dossier canonique. |
| `admin_accounts` | Type d’admin, OTP, mot de passe, session. | Présent. | Parallèle à `users.role=admin`, sans relation formelle entre les deux. |

**Constat.** Trois voies d’identité coexistent (`users`, `user_accounts`, `candidates`) et deux voies administratives (`users` et `admin_accounts`). Une consolidation doit se faire par ponts et migration, jamais par suppression directe.

### 3.2 Dossiers, évaluations et suivi

| Modèle | Usage actuel | État | Risque / manque |
| --- | --- | --- | --- |
| `evaluations` | Pré-évaluations structurées et analyse IA. | Présent. | `candidateId` non contraint ; le statut d’évaluation ne pilote pas un dossier unique. |
| `profile_evaluations` | Évaluation premium multi-pays. | Présent. | Double la majorité des données de `evaluations` et `applications`. |
| `ai_evaluations` | Quiz/score IA et recommandations. | Présent. | Déclaré, mais non relié physiquement au client ou au dossier final. |
| `applications` | Dossier payant en ligne, numéro unique, statut, paiement, affectation et données de profil. | Présent ; c’est le modèle le plus complet. | Contient trop de responsabilités et des documents en JSON ; aucune FK vers candidat, admin, paiement ou document. |
| `agency_dossiers` | Dossiers créés ou gérés en agence. | Présent. | Duplique les données et statuts de `applications`; aucun numéro de dossier unique ni pont avec le compte candidat. |
| `client_dossiers` | Dossier après évaluation IA/paiement. | Déclaré dans le code, **absent de la base**. | Route et code susceptibles d’échouer s’ils atteignent cette table. |
| `dossier_updates` | Timeline et notifications de suivi. | Déclaré dans le code, **absent de la base**. | Le suivi client ne peut pas être durablement complet. |
| `agency_dossier_history` | Historique des dossiers agence. | Présent. | Lié par identifiant libre, sans FK et limité au flux agence. |

### 3.3 Documents, messagerie, paiements et notifications

| Domaine | Modèles présents | Ce qui fonctionne déjà | Écart prioritaire |
| --- | --- | --- | --- |
| Documents | `candidate_files`, `client_documents`, champs JSON de `applications`, pièces de `agency_dossiers`. | Types, stockage, analyse de lisibilité et validation existent selon les flux. | Quatre représentations, aucune checklist canonique, aucune version/document rattachée de manière uniforme à un dossier. |
| Messagerie | `candidate_messages`, `evaluation_comments`. | Fil candidat-conseiller et commentaires existent. | Les messages sont liés au candidat ou au numéro de dossier, pas à un `case_id` ; pas d’attachement ni de destinataire explicite. |
| Paiements | Champs de `applications`, `transactions`, `client_payments`. | CinetPay, journal et validations sont disponibles. | Trois sources de paiement, pas de relation FK à un dossier unique, pas de reçu/facture uniforme. |
| Notifications | `admin_notifications`, logs e-mail. | Alertes admin et plusieurs e-mails transactionnels existent. | Il n’existe pas de table de notifications **client** reliée au dossier. |
| Journalisation | `admin_activity_logs`, `agency_dossier_history`, `dossier_updates` déclaré. | Exports et certaines actions admin sont tracés. | Aucun journal transversal, pas de FK, `dossier_updates` absent de la base. |

## 4. Parcours réellement disponibles

| Parcours | Interfaces / routeurs repérés | État constaté |
| --- | --- | --- |
| Inscription et connexion client | `/register`, `/login`, `candidate`, `signup`, `simpleAuth`, OTP. | Fonctionnalité présente, mais plusieurs routes et modèles d’identité coexistent. |
| Évaluation et ouverture de dossier | `/evaluation`, `/open-dossier`, `evaluation`, `application`, `evaluationAI`. | Fonctionnalité présente avec scoring et paiement. |
| Dossier manuel en agence | `/admin/add-dossier`, `adminDossier.createManualDossier`, `agencyDossier`. | Deux implémentations : l’une crée une `application`, l’autre manipule `agency_dossiers`. |
| Dépôt et vérification documentaire | `/submit-documents`, `/document-upload`, `clientDocuments`, `candidateUpload`, `documentSubmission`. | Fonctionnalité présente, mais fragmentée entre plusieurs tables et contrats. |
| Suivi client | `/dashboard`, `/mon-dossier`, `userDashboard`, `oauthUserDashboard`. | Présent visuellement ; `userDashboard.getDocumentsStatus` retourne actuellement une liste vide codée en dur. |
| Gestion admin | `/admin/*`, `admin`, `adminDossier`, `adminCandidateManagement`. | Pages, filtres et exports présents ; l’accès doit être rationalisé autour d’une seule session serveur. |
| Assurance | `/assurance`, `/admin/insurance-requests`, `insuranceRequests`. | Demande, devis et attestation admin présents. L’attestation n’est pas encore exposée au client par un accès propriétaire. |

## 5. Écarts majeurs par rapport à la structure cible

| Cible demandée | Couverture actuelle | Recommandation sans casse |
| --- | --- | --- |
| `clients` séparé de l’authentification | Partiellement couvert par `candidates`. | Créer un profil `clients` lié progressivement au compte candidat ; ne pas supprimer `candidates`. |
| `cases` unique | Réparti entre `applications`, `agency_dossiers`, `client_dossiers`. | Introduire une table canonique `cases` avec ponts `legacy_application_id` et `legacy_agency_dossier_id`, après gel du schéma. |
| `case_applicants` / dépendants | Informations de famille dans des colonnes ou JSON. | Créer une table enfant normalisée, sans migrer les données avant validation des règles. |
| Checklist documentaire | Absente comme entité transversale. | Créer `document_requirements` lié au dossier canonique ; conserver les documents historiques en lecture seule. |
| Historique de statut | Deux historiques partiels, un modèle absent de la base. | Créer/aligner `case_status_history`, déclenché par chaque transition. |
| Notifications client | E-mails et messages épars. | Créer `client_notifications` avec état lu/non lu et référence de dossier. |
| Tâches et affectation | Affectation textuelle seulement. | Créer `case_tasks` et relier l’agent à un identifiant admin canonique. |
| Notes admin | Notes dans plusieurs tables. | Créer `case_admin_notes` en complément ; migrer progressivement les notes existantes. |
| Journal d’activité | Partiel et sans FK. | Créer `activity_logs` transverse avec acteur, entité et dossier. |

## 6. Risques prioritaires à corriger avant toute extension métier

1. **Dérive schéma/base.** `client_dossiers` et `dossier_updates` sont déclarées mais absentes de la base ; aucune migration SQL n’est tracée. Il faut établir une migration de référence avant de brancher des flux supplémentaires.
2. **Absence de clés étrangères et d’index métier.** La base ne protège pas les liens `candidateId`, `evaluationId`, `applicationId`, `dossierId` ou les affectations administratives. Les rapports et suppressions peuvent donc devenir incohérents.
3. **Accès propriétaire incomplet.** Plusieurs opérations de tableau de bord sont déclarées `publicProcedure` et cherchent un dossier par simple numéro. Toutes les lectures/écritures de données de dossier doivent vérifier le candidat propriétaire ou une session admin.
4. **Dossier manuel non uniformisé.** La création manuelle insère une `application`, alors que le flux agence manipule aussi `agency_dossiers`. Il faut choisir une trajectoire de convergence.
5. **Secret et session historiques.** La route `/admin/change-password` lit encore `adminSessionToken` et `adminEmail` depuis `sessionStorage`. Cette exception doit être supprimée lors de la rationalisation des sessions.
6. **Documents et statuts non centralisés.** Les documents JSON d’`applications` et les tables de documents ne permettent pas de gérer proprement versions, checklist, échéances et droits d’accès par dossier.

## 7. Plan de migration proposé — non exécuté

### Phase A — Stabilisation sans changement de comportement

1. Exporter un schéma de référence et restaurer des migrations SQL versionnées dans `drizzle/migrations`.
2. Comparer chaque table du code avec `information_schema`; générer des migrations uniquement pour les tables/colonnes manquantes.
3. Remplacer les routes de lecture publique de dossier par des procédures protégées avec contrôle de propriété.
4. Définir un registre unique des statuts de dossier et une matrice de transitions autorisées.

### Phase B — Couche canonique additive

Créer de nouvelles tables sans modifier les tables existantes :

```sql
-- Proposition uniquement : ne pas exécuter avant validation fonctionnelle.
CREATE TABLE cases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  case_number VARCHAR(32) NOT NULL UNIQUE,
  client_id INT NULL,
  legacy_application_id INT NULL UNIQUE,
  legacy_agency_dossier_id INT NULL UNIQUE,
  source_channel ENUM('online','agency_manual','whatsapp','email') NOT NULL,
  country_target VARCHAR(100) NULL,
  case_type VARCHAR(80) NULL,
  visa_type VARCHAR(100) NULL,
  current_status VARCHAR(80) NOT NULL,
  assigned_admin_id INT NULL,
  priority ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
  opened_at TIMESTAMP NULL,
  closed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cases_client_status (client_id, current_status),
  INDEX idx_cases_assignee_status (assigned_admin_id, current_status)
);
```

Ensuite seulement, ajouter `case_applicants`, `case_documents`, `document_requirements`, `case_status_history`, `case_tasks`, `client_notifications`, `case_admin_notes` et `activity_logs`. Chaque table doit disposer d’index de recherche, de clés étrangères après nettoyage des données, et de politiques de rétention.

### Phase C — Backfill et bascule contrôlée

1. Créer un dossier canonique pour chaque `applications` et `agency_dossiers` existant, avec journal d’exécution et rapport d’erreurs.
2. Mettre temporairement en place une double écriture contrôlée : les nouveaux flux créent le modèle historique compatible et le dossier canonique.
3. Basculer progressivement les écrans client et admin vers `cases`.
4. Désactiver les doublons seulement après réconciliation chiffrée, sauvegarde et accord explicite ; ne jamais supprimer de données pendant la migration initiale.

## 8. Tests obligatoires avant toute migration

| Domaine | Vérification requise |
| --- | --- |
| Référentiel | Chaque `case_number` est unique et chaque dossier historique a un pont canonique. |
| Autorisation | Un client ne lit que ses dossiers, documents, messages, reçus et attestations. |
| Transition | Toute modification de statut crée un historique et une notification client. |
| Documents | Dépôt, rejet, versionnement, demande complémentaire et téléchargement signé sont testés. |
| Agence | Un dossier créé en agence est visible par le client dès l’association de son compte. |
| Paiement | Les montants, références et reçus pointent vers le même dossier canonique. |
| Reprise | Le backfill est idempotent, journalisé et peut être rejoué sans doublon. |

## 9. Décision attendue

Avant tout développement, valider l’ordre suivant : **(1)** stabilisation des migrations et des accès propriétaire, **(2)** création additive du dossier canonique, **(3)** checklist/documents et historique de statut, **(4)** bascule des espaces client et admin, **(5)** assistant IA encadré. Cette séquence conserve le site existant tout en transformant progressivement le système en back-office professionnel.
