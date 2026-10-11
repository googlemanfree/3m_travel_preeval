
## Demande de pièce depuis la vue globale et statut documentaire — VALIDÉ
- [x] Action admin protégée `requestCandidate360Document` depuis la vue globale 360° : demande liée au dossier, notification client, message, journal et e-mail sans donnée sensible superflue.
- [x] Statut explicite pour chaque document client : Validé, En vérification ou À corriger, avec panneau mobile-first dans l’onglet Documents.
- [x] Tests ciblés : 3 fichiers / 26 tests verts ; `pnpm run check` vert ; `vite build` vert. Aucun schéma/migration supplémentaire requis : réutilisation des tables de clarification existantes.
