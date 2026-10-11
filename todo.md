
## PR75 — protocole agence dans Aujourd’hui et cockpit 360
- [x] PR75 sortie du draft; validation locale du commit `383b8eea` : 2 suites / 6 tests verts, typecheck et build verts.
- [x] PR75 squash-mergée sur `main` au commit `c6572e95`.
- [x] WebDev synchronisé et redémarré sur `c6572e95`. Contrôle lecture seule admin chargé; les tests et le code confirment la lecture `agency_settings`/PDF signé, `agreementSigned` agence dans Aujourd’hui, et `protocolOneSigned` dans le cockpit 360, sans rewrite de statut. Le jeu courant exposait 0 dossier agence, donc aucun cas métier agence réel n’a été ouvert ni muté; le checkpoint final reste à créer ci-dessous.
- [ ] Checkpoint WebDev final PR75 à créer avant publication du résultat.
