
## PR57 — correctif urgent poste 360 — VALIDÉ
- [x] Branche synchronisée au commit PR57 `e097bcd9`, puis correctif TypeScript poussé et PR squash-mergée sur `main` au commit `39fa28c0`.
- [x] `getCandidateDetails` est en lecture seule ; la résolution EVAL→3M reste manuelle via le bouton ; le fallback admin sans `activeDossierNumber` est conservé.
- [x] `drizzle/0079_active_dossier_number.sql` confirmé en base : `candidates.activeDossierNumber` existe en `varchar(80)` ; aucune réapplication destructive.
- [x] TypeScript vert, build production vert, régression cockpit 360 : 4/4 tests verts ; preview redémarrée sur `39fa28c0`.
- [ ] Contrôle authentifié de plusieurs fiches (3M-AGN, EVAL-AG, pré-dossier) non réalisé : la session admin n’est pas active dans le navigateur ; le contrôle public confirme seulement la garde « Accès réservé aux administrateurs ».
- [x] Purge CDN externe non exécutée : la zone Cloudflare n’est pas visible dans le connecteur autorisé, après une tentative ciblée déjà documentée ; aucun compte erroné n’a été utilisé.
