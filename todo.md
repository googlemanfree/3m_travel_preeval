
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
- [x] Cockpit PR47 : protection admin production confirmée ; le diagnostic a identifié l’onglet initial `candidates`, corrigé dans la PR corrective ci-dessous.

## PR #47 — cockpit admin contrôle total
- [x] Vérifier le diff, le test ciblé, TypeScript et le build
- [x] Vérifier les contrôles cockpit sur la preview authentifiée
- [x] Marquer prête, fusionner et publier si tout est vert

## PR corrective — cockpit monté au chargement initial
- [x] Correctif committé sur `4b2200cb`
- [x] Branche poussée : `cursor/fix-cockpit-mount-eda6`
- [x] Pull request créée : PR #49 (le numéro #48 était déjà réservé)
- [x] Tests ciblés 3/3, TypeScript et build production verts
- [x] Checkpoint WebDev `4b2200cb` sauvegardé

## PR #48 — dossiers dynamiques pays + visa
- [x] Vérifier le diff, le test ciblé, TypeScript et le build — test dédié 3/3, TypeScript et build verts
- [x] Sortir du draft, fusionner et publier si les contrôles sont verts — merge `c63bde15`, déploiement WebDev confirmé
- [x] Vérifier les quatre scénarios de dossiers dynamiques — normalisation/refus/activation-import couverts par le test dédié ; production sert le build `nogit.202610102153`

## PR #49 — cockpit correctif
- [x] Fusion déjà confirmée sur GitHub ; déploiement à vérifier sur le checkpoint main

## Preuves fonctionnelles PR48 à compléter
- [x] Vérifier le badge « Sans CV » sur un pré-dossier admin — badge observé sur la preview admin authentifiée.
- [x] Vérifier une activation exacte pays + procédure, numéro 3M et checklist 360° — modale exacte observée ; le dossier QA importé `3M-AGN-540001` confirme le numéro 3M et affiche la checklist `7/18`.
- [x] Vérifier le refus runtime de `europe` / `golfe` — appels tRPC authentifiés refusés en HTTP 400 avec le message catalogue, sans insertion.
- [x] Vérifier l’import agence avec normalisation et checklist — import QA `Canada` + `Études` créé en `3M-AGN-540001`, avec suite `Canada · Études` et checklist `7/18`.
