

## Hero — focalisation mobile et logo recadré
- [x] Vérifier le hero à 375, 390 et 430 px.
- [x] Décaler le point focal mobile à `50% 38%`, avec retour au centre dès `sm`.
- [x] Recadrer le logo dans un conteneur circulaire pour réduire les marges blanches; tests ciblés : 2 suites / 14 tests verts.
- [x] Diff propre; typecheck global bloqué uniquement par l’erreur préexistante `shared/aureolSiteKnowledge.ts:43` (`/\\p{M}/gu`).
