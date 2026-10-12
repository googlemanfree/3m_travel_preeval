
## PR82 — centre documentaire candidat jusqu’à 16 pièces
- [x] PR82 sortie du draft; commit exact `301c12c4` validé : 2 suites / 8 tests verts et `pnpm run check` vert.
- [x] PR82 squash-mergée sur `main` au commit `8d7f099e`.
- [x] Checkout local synchronisé sur `user_github/main` (`8d7f099e`) sans modification de dossier actif.
- [x] WebDev redémarré sur `8d7f099e`; dépendances, LSP et TypeScript OK.
- [x] Périmètre publié : checklist structurée jusqu’à 16 pièces, compteur X/16, demandes conseiller prioritaires, synchronisation documents agence/client via `case_documents`.
- [x] Smoke test authentifié QA en lecture seule réalisé : espace client ouvert sur `COMPTE-1440001`, centre documentaire affiché avec checklist structurée **10/16** (plafond 16), catégories, actions de dépôt et section « Documents synchronisés ». Le back-office Documents a également été ouvert et affiche la file documentaire. Aucun fichier n’a été envoyé et aucune mutation métier réelle n’a été exécutée; le round-trip de synchronisation par dépôt reste volontairement non simulé.

## Smoke test QA PR82 — résultat final
- [x] Session admin authentifiée vérifiée; module Documents chargé en contrôle contrôlé.
- [x] Compteurs et checklist documentaire visibles dans l’admin (file Documents active).
- [x] Session candidat QA authentifiée; espace `/mon-espace?section=documents` chargé.
- [x] Dépôt candidat d’un PDF factice réalisé; enregistrement confirmé dans `candidate_files` (candidat QA 1410001, type passeport, statut `uploaded`, fichier non sensible).
- [ ] Synchronisation vers `case_documents` non confirmée : aucune ligne correspondante au fichier candidat.
- [ ] Dépôt inverse admin non exécuté : le dossier affiché `3M-AGN-390001` correspond à une ligne `cases`, mais la référence attendue par `adminCaseDesk.depositDocument` (`agency_<id>`) ne trouve aucun enregistrement correspondant dans `agency_dossiers`; l’appel a été refusé avec `Dossier agence introuvable`, sans mutation.
- [x] Aucun dossier actif existant n’a été réécrit; aucun document réel, e-mail ou notification externe n’a été envoyé.
- Verdict : PR82 est publiée et le dépôt candidat fonctionne; la synchronisation bidirectionnelle complète reste à diagnostiquer séparément à cause de l’écart entre `cases` et `agency_dossiers` dans les données QA.

## PR83 — pack candidature international
- [x] Auditer les checks, le diff et les garde-fous de PR83.
- [x] Fusionner PR83 après correction, synchroniser WebDev et vérifier le build.
- [ ] Smoke test des surfaces CV/lettre/publication avec compte approprié; aucun dossier actif ne doit être modifié.

## PR83 — résultat de validation
- [x] Audit du diff effectué : périmètre admin, génération CV/lettre, publication du pack et alignement placement; aucune migration déclarée.
- [x] Tests ciblés sur le commit PR83 `4db63539` : **2 suites / 16 tests verts**.
- [ ] Typecheck bloqué : `server/routers/cvDraft.ts:78` référence `agencyDossierDocuments.uploadedAt` inexistant; `server/routers/cvDraft.ts:115` utilise des actions/champs non autorisés par le schéma `adminActivityLogs` (`cv_pack_saved`, `cv_pack_cleared`, `adminEmail`).
- [ ] Build non lancé jusqu’au bout après l’échec de `pnpm run check`.
- [ ] PR83 non fusionnée et WebDev non synchronisé; aucun dossier actif modifié.
- Décision : arrêt avant publication; une correction ciblée de PR83 est nécessaire.

## PR83 — correctif TypeScript poussé
- [x] `agencyDossierDocuments.uploadedAt` remplacé par la colonne réelle `createdAt`.
- [x] Journal des événements du pack déplacé vers `adminAuditLogs`, dont le schéma accepte les actions `cv_pack_saved` / `cv_pack_cleared`; `adminActivityLogs` reste utilisé pour l’export PDF existant.
- [x] Tests ciblés : **2 suites / 16 tests verts**.
- [x] `pnpm run check` vert et `vite build` vert sur le worktree exact PR83.
- [x] Correctif commit `9aca5165` poussé sur `cursor/cv-application-pack-eda6`.
- [ ] PR83 reste à fusionner puis à synchroniser dans WebDev; aucune fusion ni publication exécutée dans cette étape.

## PR83 — fusion et synchronisation
- [x] Correctif TypeScript `9aca5165` intégré dans PR83; PR83 sortie du draft et squash-mergée sur `main`.
- [x] `main` local synchronisé sur `user_github/main` au commit `41f520db`.
- [x] WebDev redémarré sur `41f520db`; serveur actif, dépendances OK, LSP et TypeScript sans erreur.
- [x] Aucun dossier actif modifié; aucune migration appliquée.
- [ ] Smoke test métier CV/lettre/publication à réaliser séparément avec un compte admin approprié.
