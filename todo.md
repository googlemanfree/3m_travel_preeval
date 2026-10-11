
## UX phases client et prévisualisation admin — VALIDÉ
- [x] Guide accessible des 7 phases ajouté directement dans la vue globale client, avec infobulles clavier/survol et détails sans jargon.
- [x] Bannière distinctive « Prévisualisation administrateur — lecture seule » ajoutée dans la modale admin, avec garde explicite contre les mutations.
- [ ] Vérification authentifiée non réalisée : le navigateur affiche encore « Accès réservé aux administrateurs ». La garde publique est confirmée et aucune mutation métier n’a été exécutée.
- [x] 2 suites / 11 tests verts ; `pnpm run check` vert ; `vite build` vert (avertissement de chunks volumineux uniquement).
