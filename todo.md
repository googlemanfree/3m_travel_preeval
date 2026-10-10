
## Validation production et contrat de synchronisation — 2026-10-10
- [x] Compte candidat QA synthétique créé en production et données sans identité réelle.
- [x] Tests historiques de polling alignés sur 45 secondes, `staleTime` et absence de refetch au focus.
- [x] PR #36 fusionnée dans `main`.
- [x] Page Luxembourg vérifiée sans liens job boards clients ; fiche admin QA accessible par API.
- [x] Dossier Luxembourg QA `3M-AGN-510001` créé avec données synthétiques.
- [x] Rafraîchissement public/admin vérifié avec cache-busters ; état Cloudflare documenté.
- [x] Tests de contrat 45 s : 23 tests ciblés verts, TypeScript et build verts.

## Publication PR #37 — 2026-10-10
- [x] Build `main` `4357541f` déployé et nouveau bundle confirmé en production (`index-BotVqWvK.js`, `AdminDashboard-CtO0anKM.js`).
- [x] Diagnostic Cloudflare effectué : connecteurs Cloudflare et Cloudflare API restent désactivés après soumission ; aucune purge API possible dans cette session.
- [x] Validation live du bundle : marqueurs Italie, Australie, Canada, e‑Visa, Pilotage dynamique et Candidatures Luxembourg présents dans les chunks production ; tests ciblés PR37 16/16, TypeScript et build verts.
