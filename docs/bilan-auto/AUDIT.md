# Bilan automatisé — audit du dépôt (projet TRAVAIL)

Statut : branche de test `feature/bilan-automatique`. Rien n'est déployé. Tout est inerte tant que `BILAN_AUTO_ENABLED` n'est pas `true`.

## 1. Confirmé par le code (réutilisé, non recréé)

| Besoin | Élément existant |
|---|---|
| Stack | React 19 + Vite, tRPC 11, Drizzle (dialecte MySQL), Express, Node 22, Vitest. Hébergement réel : Manus ; Railway = aperçu sans base. |
| Soumission | `evaluation.submitEvaluation` (table `evaluations`, code dossier, `candidateId`), dépôt du CV `evaluationValidation.attachCv`, pièces `uploadSupportingDocument` (table `client_documents`). |
| Consentement CV | `cvAnalysisConsented` (consentement DISTINCT à la lecture du CV) : respecté, son absence donne un complément, jamais une lecture. |
| Lecture CV | `cvTextLoader` / `cvExcerpt` : PDF avec texte, extrait masqué et borné (minimisation). Pas de reconnaissance d'image aujourd'hui (voir §4). |
| Parcours de validation | `evaluation_validation_cases` + `evaluationValidationCore` (statuts, publication, demande de complément, e-mail avec réservation anti-doublon). Le bilan automatisé y publie (`publishedReportJson`) : l'espace client existant l'affiche. |
| IA | `server/_core/llm.ts` (`invokeLLM`, passerelle Forge de Manus), sorties JSON, fichiers PDF/images pris en charge. |
| E-mail | `server/_core/email.ts` (SMTP, expéditeur officiel imposé). |
| PDF | `jspdf` + papier à en-tête `shared/brandLetterhead` + logo (`utils/brandLogo`) : réutilisés. |
| Stockage | `server/storage.ts` (`storagePut`, lien signé `storageGetSignedUrl`). **Pas de fonction de suppression.** |
| Charte | `findForbiddenTerms` / `findSensitiveValues` (`shared/evaluationValidation`). |
| Confidentialité | Carte « Mes données » (`PrivacyDataCard`), demandes de suppression/rectification déjà présentes côté candidat. |
| Tâches planifiées | `server/scheduled/*` (appel externe, `SCHEDULED_JOBS_MODE=off` par défaut). Aucune file de travaux dédiée. |

## 2. Ajouts de cette branche

- `shared/bilanAuto/*` : grille versionnée (non approuvée), faits avec provenance, politique de conservation (proposition).
- `server/services/bilanAuto/*` : notation déterministe, extraction (sorties validées par schéma), orientations (règle Canada), contrôles A/B/C, rapport texte/HTML/PDF, pipeline (file, reprises, idempotence, outbox), stores mémoire et MySQL, worker.
- `server/routers/adminBilanAuto.ts` + `client/src/pages/AdminBilansAutomatises.tsx` (route `/admin/bilans`) ; bouton « Bilan prêt à valider (N) » dans la liste des candidats.
- Affichage candidat : variante « bilan automatisé » dans `EvaluationReportView` + téléchargement du PDF par lien signé (`evaluationValidation.myBilanPdfUrl`, réservé au propriétaire).
- Déclencheurs (sans analyse dans la requête) : fin de `submitEvaluation`, `attachCv`, `respondToInfoRequest`, `uploadSupportingDocument`.

## 3. Migrations et retour arrière

Trois tables additives : `bilan_auto_runs`, `bilan_auto_events`, `bilan_auto_outbox` (fichier `drizzle/bilanAutoSchema.ts`). Création par `CREATE TABLE IF NOT EXISTS` au premier usage, **uniquement si le flag est actif** (les migrations Drizzle ne se rejouent pas sur l'hébergement actuel). Aucune table existante modifiée.
Retour arrière : `BILAN_AUTO_ENABLED=false` (données conservées), puis éventuellement `DROP TABLE bilan_auto_outbox, bilan_auto_events, bilan_auto_runs`.
Correspondance avec les entités demandées : `evaluation_runs` = `bilan_auto_runs` ; `extracted_facts`, `scoring_results`, `country_recommendations`, `evidence_sources`, `report_versions`, `clarification_requests` = colonnes JSON de `bilan_auto_runs` (une ligne par version des entrées, donc immuable) ; `notification_outbox` = `bilan_auto_outbox` ; `audit_events` = `bilan_auto_events`.

## 4. Manques, secrets et risques

- **Aucun secret n'a été configuré ni consulté.** Il faut côté Manus : `BUILT_IN_FORGE_API_URL` / `BUILT_IN_FORGE_API_KEY` (déjà utilisés par le site s'ils sont présents), SMTP (`SMTP_HOST/PORT/USER/PASS/FROM`), stockage Forge.
- **Lecture visuelle des scans** : désactivée (`BILAN_AUTO_VISION_ENABLED`). Le site affirmait ne pas envoyer d'image à un service de vision ; l'activer change cette promesse (information candidat et accord préalables).
- **Recherche de sources (offres, salaires)** : non branchée. Sans source, le bilan indique « salaire à documenter » et n'affiche aucune offre. Un référentiel de sources saisi par l'agence ou un service de recherche reste à choisir.
- **Suivi de livraison e-mail** : le SMTP ne renvoie ni identifiant ni événements. L'état reste « acceptée par le serveur d'envoi » ; « délivrée » exige un fournisseur à webhooks (le traitement des événements est prêt et testé, le point d'entrée HTTP signé n'est pas exposé).
- **Hébergement Manus** : le worker tourne dans le processus serveur (toutes les 60 s) ; si le serveur est mis en veille, les traitements attendent sans se perdre (file en base, verrou à expiration).
- **Parcours validation existant** : une publication automatisée s'inscrit comme une version publiée du parcours ; une nouvelle version après publication ouvre une réévaluation (comportement existant).
- **Règle Canada** : l'âge est utilisé uniquement pour l'orientation, jamais pour la note. À valider juridiquement (traitement de l'âge).

## 5. Décisions encore nécessaires

1. Mode d'exploitation (validation administrateur par défaut, ou automatique) — voir `EXPLOITATION.md`.
2. Approbation écrite des sous-critères (`BAREME.md`).
3. Fournisseur/modèle de production et conditions du prestataire (`COUTS.md`).
4. Activer ou non la lecture visuelle des scans.
5. Source des offres et des salaires.
6. Durées de conservation (`CONSERVATION.md`) et textes candidat (`INFORMATION_CANDIDAT.md`).
