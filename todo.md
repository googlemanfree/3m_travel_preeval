
## PR #38 — tarifs digitaux Afrique + synchronisation services — 2026-10-10
- [x] Branche PR38 synchronisée puis fusionnée dans `main` — merge commit `0b6bed51`.
- [x] Correctif TypeScript ciblé poussé sur la branche PR avant fusion — HEAD PR `2e6e6516`.
- [x] 19 tests ciblés verts, `pnpm run check` vert et build production vert.
- [x] `/3m-solutions` vérifiée en production : Essentiel 50 000–150 000 FCFA, Présence digitale 150 000–350 000 FCFA et Business+ 350 000–600 000 FCFA ; Business+ confirmé dans le HTML public sauvegardé.
- [x] Migration `drizzle/migrations/0077_unified_digital_source_type.sql` appliquée puis vérifiée en base : enum `sourceType` contient `digital`.
- [x] Demande digitale QA synthétique `DGT-2026-454168` créée, visible dans l’admin, traitée en `contacted`, note et horodatage persistés.
- [ ] Synchronisation UI côté client à confirmer avec une session candidat QA : le même e-mail, le statut `contacted` et la note sont confirmés côté base/admin ; `/mon-espace` protège correctement l’accès en l’absence de session.
- [ ] Contrôle utilisateur complet du hub Services en ligne et des flux consultation, traduction, assurance, e‑Visa et vols non revendiqué comme test E2E dans cette session ; les tests/build PR couvrent le code et la file unifiée, pas chaque parcours connecté.
- [x] Purge CDN diagnostiquée : connecteur Cloudflare activé mais aucune zone active n’est exposée pour `3mtravelagency.com` ni dans le compte connecté ; purge réelle impossible sans rattacher le bon compte/zone. Cache-busters et redémarrage WebDev effectués.

## Contrôle QA session candidat et zone Cloudflare — 2026-10-10
- [ ] Créer un compte candidat QA synthétique avec confirmation par lien e-mail
- [ ] Se connecter au compte QA et vérifier DGT-2026-454168 dans `/mon-espace`
- [ ] Identifier le bon compte/zone Cloudflare et purger les URLs ciblées si la zone est accessible

## PR #39 — positionnement vivier + traçabilité dossiers
- [x] Sortir la PR39 du brouillon et synchroniser la branche côté Git — fusion `MERGED`, commit `abeeaf43`.
- [x] Vérifier le diff exact du stepper : 5 étapes présentes et couvertes par les assertions de régression.
- [x] Vérifier le diff, tests, TypeScript et build sur le checkout PR39 — tests ciblés, `pnpm run check` et build production verts.
- [x] Sauvegarder le checkpoint — version WebDev `06c8baa4`.
- [ ] Publier la version WebDev : aucun outil de publication direct n’est disponible dans cette session ; la production sert encore l’ancien bundle.
- [ ] Vérifier accueil, QuickActions, pilotage placement et `/procedures` en production après publication ; l’aperçu checkpoint est validé, l’admin reste protégé sans session.
- [x] Vérifier la migration : `unified_client_requests.sourceType` contient déjà `digital` ; PR39 n’ajoute aucune migration SQL.
- [x] Vérifier Cloudflare : la requête de zone `3mtravelagency.com` retourne zéro zone active ; purge impossible avec le compte actuellement connecté.

## PR #40 — livrables employeur + CTA recrutement
- [ ] Sortir la PR40 du brouillon et fusionner sur `main`
- [ ] Vérifier le diff, tests, TypeScript et build
- [ ] Sauvegarder le checkpoint puis publier
- [ ] Vérifier le bloc livrables, le CTA employeur et le wording admin placement
- [ ] Purger le CDN ou documenter l’absence de zone Cloudflare
