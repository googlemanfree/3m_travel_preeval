

## Reçus, protocoles et espace candidat
- [x] Badges de type de visa accessibles sur la page des reçus (Travail / Études / Visiteurs / famille).
- [x] Aperçu admin en lecture seule avant envoi du protocole, sans envoi automatique (bureau reçus et cockpit 360°).
- [x] Export/téléchargement des protocoles signés et reçus validés personnalisés dans l’espace candidat.
- [x] Propagation explicite de `destination` et `visaType` vers le bureau des reçus.
- [x] Régressions ciblées protocoles + PDF : 11/11 vertes ; `git diff --check` vert.
- [ ] `pnpm run check` global : 4 erreurs TypeScript préexistantes hors périmètre (`CountryDetailPage.tsx`, `ProceduresAdvanced.tsx`, `server/routers/admin.ts`).
