
## PR #45 — pages publiques et gate évaluation
- [x] Pages Blog, PartnersHub, Avis, OfficialSources et Fiches enrichies avec héros visuels.
- [x] Logo du gate `/evaluation` corrigé sans modifier la logique d’accès.
- [x] Tests, TypeScript, build et checkpoint validés ; PR45 fusionnée et publiée.

## PR #46 — opérations admin candidats
- [x] PR46 fusionnée dans `main` au commit `0f24b6e9` après validation du diff et du test ciblé.
- [x] Migration 0073 appliquée sur `flight_booking_requests` : colonnes de paiement en ligne présentes.
- [x] Migration 0074 appliquée sur `applications` : champs Protocole N°02 présents.
- [x] `admin.listCandidates` refonctionne après migration ; onglet Dossiers affiche 9 dossiers en ligne et 13 dossiers agence, sans erreur de synchronisation.
- [x] Test ciblé `server/adminOpsCandidats.regression.test.ts` : 4/4 réussis.
- [x] Vérification admin : onglets Pilotage, Dossiers, Pré-dossiers, Activations et Paiements chargés ; « Confirmer ici », renvoi de lien, références `COMPTE-…` et bureau reçus/protocoles visibles.
- [x] Synchronisation locale sur `main` : HEAD `0f24b6e9`.
- [x] Finaliser le build de production et enregistrer le checkpoint de publication post-merge — build vert, checkpoint `0f24b6e9` sauvegardé.

- [x] Contrôler individuellement Pré-dossiers, Activations et Paiements après migration — endpoint sans évaluation HTTP 200 ; Activations affiche 50 comptes, « Renvoyer le lien » et « Confirmer ici » ; Paiements affiche « Bureau reçus & protocoles », 2 protocoles en attente, 1 reçu à préparer, 1 protocole à signer et 4 chaînes complètes.
- [x] Sauvegarder les preuves d’onglets et créer le checkpoint post-merge.
- [x] Mise en ligne production confirmée par le statut WebDev ; domaine public HTTP 200 et marqueur de build `nogit.202610102106` servis.
- [ ] Cockpit PR47 : protection admin production confirmée, mais cockpit absent du DOM preview après deux contrôles (avant/après redémarrage) ; blocage runtime à investiguer avec une nouvelle hypothèse.

## PR #47 — cockpit admin contrôle total
- [x] Vérifier le diff, le test ciblé, TypeScript et le build
- [x] Vérifier les contrôles cockpit sur la preview authentifiée
- [x] Marquer prête, fusionner et publier si tout est vert
