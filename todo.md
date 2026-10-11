
## Correctif tRPC candidate.getProfile — VALIDÉ
- [x] Cause confirmée dans les logs : `activeDossierSetAt` absent alors que le modèle Drizzle et le flux de sélection l’utilisent.
- [x] Migration additive `drizzle/0080_candidate_active_dossier_set_at.sql` créée et appliquée ; aucune donnée modifiée ni suppression exécutée.
- [x] Serveur redémarré ; accueil preview rendu correctement ; aucune nouvelle erreur `candidate.getProfile` après correction.
- [x] `pnpm run check` et `pnpm exec vite build` verts.
- [x] Administration production accessible avec la session active ; aucun dossier exploitable supplémentaire n’était disponible pour une ouverture 360 sans créer de données.
