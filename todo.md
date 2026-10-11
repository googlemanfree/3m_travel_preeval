
## Validation documentaire admin — VALIDÉ
- [x] Sélection multiple et validation groupée des pièces non validées ; les pièces déjà validées/non requises ne sont pas sélectionnables, et le bouton d’action est désactivé sans sélection ou pendant l’envoi.
- [x] Commentaire explicatif obligatoire conservé et testé lors du statut « À corriger » ; le commentaire est affiché au candidat et journalisé côté admin.
- [x] Tests ciblés : 3 fichiers / 40 tests verts ; `pnpm run check` et `vite build` verts.
- [x] Suite complète : 575 fichiers et 3 125 tests verts, 5 échecs hors périmètre préexistants (Home-density, Jinko externe, sources pays). Aucun de ces échecs ne concerne cette évolution.
