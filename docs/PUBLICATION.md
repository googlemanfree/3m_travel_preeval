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
