

## PWA — invite et hors connexion
- [x] Ajout de « Plus tard » (session) et « Ne plus proposer » (stockage permanent) pour l’invite d’installation.
- [x] Ajout d’une pulsation limitée à trois cycles, désactivée avec `prefers-reduced-motion`.
- [x] Nouvelle page `/offline.html` avec logo circulaire, état hors connexion et bouton Réessayer.
- [x] Service Worker v59 : cache de la page hors ligne et du logo, fallback navigation vers `/offline.html`.
- [x] Validation : `pnpm run check`, 1 suite / 2 tests ciblés et build production verts; page hors ligne vérifiée visuellement.
