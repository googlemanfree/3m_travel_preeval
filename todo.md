
## Fiche synthèse employeurs/agences — VALIDÉE EN CHECKPOINT
- [x] Consentements séparés PDF/photo, sans coordonnées, passeport ni CV brut.
- [x] Reconstruction normalisée des pièces (1 entrée/type), empreinte et passage automatique à « À revalider » après changement.
- [x] Candidate 360 : brouillon JSON éditable, décision Valider/Refuser, génération d’un PDF 1 page anonymisé et accès téléchargement.
- [x] Partenaire : bouton « Télécharger la synthèse (PDF) » seulement si fiche validée, consentement PDF actif et soumission à l’organisation ; sinon « Aucune fiche validée ».
- [x] Tests ciblés : 3 fichiers / 27 tests verts ; `pnpm run check` vert ; `vite build` vert.
- [x] Migration `drizzle/0078_placement_profile_summaries.sql` appliquée avec succès sur la base WebDev ; les 10 colonnes ont été ajoutées.
