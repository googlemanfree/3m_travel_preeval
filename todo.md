

## Logo navigation et installation PWA
- [x] Fondu de chargement du logo avec gestion `onLoad`/`onError`.
- [x] Survol et focus visibles du logo circulaire, avec respect de `prefers-reduced-motion`.
- [x] Bouton d’installation PWA personnalisé via `beforeinstallprompt` et `appinstalled`, largeur mobile adaptée.
- [x] Régression ciblée : 1 suite / 2 tests verts; `git diff --check` vert.
- [ ] `pnpm run check` reste bloqué par l’erreur préexistante dans `Candidate360Workspace.tsx:285` sur la forme de `timeline`, sans lien avec ce lot.
