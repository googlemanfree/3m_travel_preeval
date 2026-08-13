# Vérification du chargement différé

## Résultat

Le helper `client/src/lib/lazyWithTimeout.ts` définit un délai par défaut de 15 000 ms. Lorsque le module différé ne répond pas dans ce délai, il rejette une erreur dont le message reprend la signature « Failed to fetch dynamically imported module ». Cette signature est reconnue par le mécanisme de récupération déjà présent dans `ErrorBoundary.tsx`, qui tente un rechargement unique par session au lieu de laisser le fallback global affiché indéfiniment.

Les 103 déclarations de pages différées dans `client/src/App.tsx` utilisent désormais `lazyWithTimeout`. Le fallback global et les providers existants ont été conservés.

## Contrôles visuels

Les routes `/procedures`, `/flights` et `/evisa` ont été ouvertes sur desktop en 1280 × 720. Les routes `/procedures` et `/flights` ont également été vérifiées sur mobile en 390 × 844. Elles sortent correctement du chargement différé et affichent leur contenu sans écran blanc. Aucun blocage visible n’a été constaté pendant la vérification.

## Limite de la vérification

Le déclenchement artificiel d’un téléchargement de chunk suspendu n’est pas simulé par l’aperçu visuel. La couverture de contrat vérifie néanmoins le délai de 15 secondes, la course entre le loader et le timeout, le nettoyage du timer, la signature d’erreur compatible et l’enveloppement des 103 routes.
