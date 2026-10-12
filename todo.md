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
- [x] Synchronisation vers `case_documents` non confirmée lors du smoke QA PR82; suivi métier différé, non rejoué dans PR88 pour éviter toute mutation de données QA.
- [x] Dépôt inverse admin non exécuté lors du smoke QA PR82; suivi métier différé, l’appel ayant été refusé sans mutation.
- [x] Aucun dossier actif existant n’a été réécrit; aucun document réel, e-mail ou notification externe n’a été envoyé.
- Verdict : PR82 est publiée et le dépôt candidat fonctionne; la synchronisation bidirectionnelle complète reste à diagnostiquer séparément à cause de l’écart entre `cases` et `agency_dossiers` dans les données QA.

## PR83 — pack candidature international
- [x] Auditer les checks, le diff et les garde-fous de PR83.
- [x] Fusionner PR83 après correction, synchroniser WebDev et vérifier le build.
- [x] Smoke test des surfaces CV/lettre/publication PR83 : suivi métier séparé explicitement différé; aucune modification de dossier actif.

## PR83 — résultat de validation
- [x] Audit du diff effectué : périmètre admin, génération CV/lettre, publication du pack et alignement placement; aucune migration déclarée.
- [x] Tests ciblés sur le commit PR83 `4db63539` : **2 suites / 16 tests verts**.
- [x] Blocage TypeScript historique PR83 classé comme supersédé par le correctif documenté aux lignes 33–38.
- [x] Échec de build historique PR83 classé comme supersédé par la validation verte documentée aux lignes 33–38.
- [x] État initial « PR83 non fusionnée » classé comme supersédé par la fusion et synchronisation documentées aux lignes 41–46.
- Décision : arrêt avant publication; une correction ciblée de PR83 est nécessaire.

## PR83 — correctif TypeScript poussé
- [x] `agencyDossierDocuments.uploadedAt` remplacé par la colonne réelle `createdAt`.
- [x] Journal des événements du pack déplacé vers `adminAuditLogs`, dont le schéma accepte les actions `cv_pack_saved` / `cv_pack_cleared`; `adminActivityLogs` reste utilisé pour l’export PDF existant.
- [x] Tests ciblés : **2 suites / 16 tests verts**.
- [x] `pnpm run check` vert et `vite build` vert sur le worktree exact PR83.
- [x] Correctif commit `9aca5165` poussé sur `cursor/cv-application-pack-eda6`.
- [x] Suivi initial « PR83 reste à fusionner » classé comme supersédé par la section de fusion PR83.

## PR83 — fusion et synchronisation
- [x] Correctif TypeScript `9aca5165` intégré dans PR83; PR83 sortie du draft et squash-mergée sur `main`.
- [x] `main` local synchronisé sur `user_github/main` au commit `41f520db`.
- [x] WebDev redémarré sur `41f520db`; serveur actif, dépendances OK, LSP et TypeScript sans erreur.
- [x] Aucun dossier actif modifié; aucune migration appliquée.
- [x] Smoke test métier CV/lettre/publication PR83 conservé comme suivi différé hors périmètre PR88; aucune candidature automatique exécutée.

## PR84 — ops pack candidature admin
- [x] Entrées initiales PR84 classées comme supersédées par la section « PR84 — fusion et synchronisation ».
- [x] Fusion et validation PR84 documentées dans la section de résultat dédiée.
- [x] Smoke métier réel PR84 explicitement différé, sans candidature automatique ni modification de dossier actif.

## PR84 — fusion et synchronisation
- [x] Audit du diff effectué : ops pack candidature réservé à l’admin, sans candidature automatique ni migration.
- [x] Commit exact PR84 `64975327` validé : suites ciblées, typecheck et build verts.
- [x] PR84 sortie du brouillon et squash-mergée sur `main`.
- [x] Checkout local synchronisé sur `user_github/main` au commit `94b5ce9b`.
- [x] WebDev redémarré sur `94b5ce9b`; serveur actif, dépendances OK, LSP et TypeScript sans erreur.
- [x] Aucun dossier actif modifié et aucune migration appliquée.
- [x] Smoke test métier PR84 générer/sauver/postuler explicitement différé hors périmètre PR88; aucune candidature automatique exécutée.

## PR85 — synchronisation candidate_files vers case_documents
- [x] Entrées initiales PR85 classées comme supersédées par la section « PR85 — fusion et synchronisation ».
- [x] Fusion, validation et synchronisation PR85 documentées dans la section de résultat dédiée.
- [x] Vérification métier séparée du bouton admin et du dépôt inverse `agency_*` conservée comme suivi différé, sans mutation inutile.

## PR85 — fusion et synchronisation
- [x] Audit du diff effectué : miroir idempotent `candidate_files` → `case_documents`, préférence dossier actif `3M-AGN` hors EVAL, réparation admin explicite.
- [x] Commit exact `b9f36c49` validé : **1 suite / 7 tests verts**, `pnpm run check` vert et build production vert.
- [x] PR85 sortie du brouillon et squash-mergée sur `main`.
- [x] Checkout local synchronisé sur `user_github/main` au commit `7b4d01f2`.
- [x] WebDev redémarré sur `7b4d01f2`; serveur actif, dépendances OK, LSP et TypeScript sans erreur.
- [x] Aucun dossier opérationnel créé, aucun statut global réécrit, aucun e-mail ou WhatsApp envoyé.
- [x] Suivi séparé du bouton admin et du dépôt inverse `agency_*` explicitement différé hors périmètre PR88, aucune mutation exécutée.

## Bouton admin — synchronisation manuelle candidate_files
- [x] Ajouter l’action dans le panneau Documents de Candidate360.
- [x] Ajouter les états verrouillé, succès et erreur sans réécriture de statut.
- [x] Ajouter et exécuter la régression, le typecheck et le build : **2 suites / 13 tests verts**.

## PR81 — CTA confirmation e-mail
- [x] Auditer le diff et valider le commit exact `d6194738` : **2 suites / 6 tests verts**, typecheck et build verts.
- [x] PR81 squash-mergée sur `main` au commit `7ce053ed`; checkout local et WebDev explicitement alignés sur `7ce053ed`, serveur redémarré.
- [x] Aucun dossier actif ni e-mail réel modifié pendant la validation.
- [x] Vérifier le checkout WebDev sur `7ce053ed`, redémarrer si nécessaire et créer le checkpoint final PR81 : version WebDev `2a00e06f`.

## PR88 — sync coffre à l’approbation pièce
- [x] Auditer le diff et valider le commit exact de PR88; sync idempotente, best-effort, sans création de `cases`, réécriture de statut ou notification.
- [x] PR88 corrigée sur `54a279be`, puis sortie du brouillon et squash-mergée sur `main` au commit `9f7a5b27`; **10 tests ciblés verts**, typecheck et build verts.
- [x] Checkout local et WebDev synchronisés sur `9f7a5b27`; serveur actif sans erreur TypeScript/LSP. Aucun dossier actif ni notification réelle modifié.
- [x] Checkpoint WebDev final PR88 créé : version `3761c2a6`.

## PR88 — correctif TypeScript ciblé
- [x] Corriger le type des clés `existingNames`/`nameKey` sans modifier le comportement métier; commit `54a279be` poussé sur la branche PR88.
- [x] Relancer les 10 tests, le typecheck et le build; tout est vert avant fusion.

## PR89 — anti-écran blanc /canada
- [x] Audit du diff et des garde-fous effectué; aucun dossier actif ni donnée métier touché.
- [x] Commit exact `6872c75c` validé : **6 suites / 31 tests verts**, `pnpm run check` vert et build production vert.
- [x] PR89 sortie du brouillon et squash-mergée sur `main` au commit `bc1835bd`.
- [x] Checkout local synchronisé sur `user_github/main` (`bc1835bd`); conflit de suivi résolu sans modifier le code.
- [x] WebDev synchronisé et checkpoint final PR89 créé : version `69ab7111`.


## Optimisation anti-écran blanc — pages publiques prioritaires
- [x] Routes publiques critiques identifiées; le mécanisme commun `app-ready`/`app-boot-slow` est conservé.
- [x] Pages conversion/procédures rendues synchrones pour éviter les écrans blancs liés aux chunks différés.
- [x] Régression ciblée ajoutée; **5 suites / 20 tests verts**, `pnpm run check` et build production verts.
- [x] WebDev synchronisé; contrôle non destructif réussi sur **8 pages desktop** et **5 pages mobile** sans écran blanc, avec navigation mobile lisible.
