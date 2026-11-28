# Publication du site

## Production : Manus

Le site www.3mtravelagency.com et sa base de données sont hébergés chez **Manus**. Une fusion sur `main` ne met pas le site à jour : Manus doit récupérer `origin/main`, enregistrer une nouvelle version (checkpoint) puis la publier.

Contrôle après publication : `https://www.3mtravelagency.com/build-commit.json` doit avoir une date `generatedAt` postérieure à la fusion.

## Instance de test : Railway

Le service Railway `3m_travel_preeval` (projet `perceptive-victory`, adresse `3mtravelpreeval-production.up.railway.app`) est une instance séparée : **elle ne sert pas le site officiel**, n'a ni base de données, ni SMTP, ni WhatsApp configurés, donc n'envoie aucun message.

Le déploiement automatique se coupe ou se réactive avec les « watch patterns » du service : `/.deploiement-railway-desactive/**` (aucun fichier ne correspond, tout déploiement est ignoré) ou `/**` (chaque fusion sur `main` déclenche un déploiement).

## Historique

- 2026-11-27 : déploiement de l'instance de test Railway demandé par le propriétaire (watch patterns ouverts le temps du déploiement, puis à refermer).
- 2026-11-27 : les commits restés « SKIPPED » (watch patterns fermés) ont été rejoués par Railway ; un commit final pousse la tête de `main` pour que le déploiement actif soit le plus récent.

## `PUBLIC_BUILD_COMMIT` figé sur WebDev (2026-11-28)

La variable `PUBLIC_BUILD_COMMIT=08913b3f`, posée à la main sur WebDev et impossible à supprimer depuis l'interface, bloquait la publication : `scripts/build-marker-resolve.mjs` lui donnait la priorité absolue et le build strict s'arrêtait dès que Git donnait un autre commit (« Publication bloquée »).

Désormais :
- `PUBLIC_BUILD_COMMIT` ne fait plus partie des variables fiables : elle ne prime sur rien et ne bloque jamais le build. Elle est signalée dans le journal puis ignorée. **Il n'y a rien à supprimer chez Manus.**
- Avec Git : le marqueur est le HEAD réel. Sans Git ni variable de plateforme : le build passe avec le marqueur « nogit » (jamais l'ancien commit).
- `build-commit.json` contient en plus `sourceHash` : empreinte du code embarqué. `node scripts/source-hash.mjs` la calcule sur un dépôt local pour la comparer au site en ligne. Elle est indicative (des fichiers ajoutés par la plateforme la modifieraient) ; la date `generatedAt` reste le premier contrôle.
