
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
