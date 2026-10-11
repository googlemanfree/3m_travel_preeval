
## PR #57 — photo passeport travail, cockpit 360 et dossier actif — VALIDÉE LOCALEMENT
- [x] Activation Travail déclenche l’exigence photo passeport, notification espace client et e-mail ; dépôt Profil remplace la photo de profil.
- [x] Admin : aperçu/téléchargement/demande photo passeport ; garde du dossier actif 3M-AGN et annulation paiement/étape conservées.
- [x] Contrats d’informations complémentaires et fallback inscription restaurés après fusion avec main.
- [x] `pnpm run check` vert ; 4 suites ciblées / 14 tests verts ; `vite build` vert avec avertissement de chunks volumineux uniquement.
- [x] Checkpoint/publication production confirmés : version WebDev `fdcb5837`, build live `nogit.202610110127` sur les quatre domaines.
- [x] Purge CDN tentée de façon ciblée, mais non exécutée : le connecteur Cloudflare autorisé retourne zéro zone (`GET /zones`, 200). Aucun mauvais compte ni purge globale n’a été utilisé.
