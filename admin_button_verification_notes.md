# Vérification navigateur — préparation du bilan

URL vérifiée : https://www.3mtravelagency.com/admin
Date : 2026-09-02.

La session administrateur est active. Le tableau affiche le dossier `COMPTE-1110001` et permet d’ouvrir sa fiche 360°. La fiche ne présente plus l’erreur « Dossier d’évaluation introuvable » : le candidat est chargé et l’évaluation apparaît comme validée.

Le contrôle interactif a confirmé l’ouverture de la fiche et l’affichage du champ Objet, du champ de message, de la case de confirmation humaine et du bouton « Envoyer l’évaluation au client ». Ce dossier ayant déjà été envoyé, il n’a pas été réutilisé pour déclencher un second envoi.

Point restant : sélectionner un dossier non envoyé pour vérifier dans l’espace `EvaluationDeliveryEditor` les boutons « Prévisualiser », « Enregistrer », « Valider », « Valider et envoyer » et « Tester SMTP » sans provoquer d’envoi non autorisé.

## Vérification après publication f9484fe1

- URL retestée : `https://www.3mtravelagency.com/admin?version=f9484fe1`.
- Session admin active et dossiers chargés après synchronisation.
- Le dossier interne `COMPTE-1140001` a été ouvert sans message « dossier introuvable ».
- Le domaine public affichait encore le formulaire inline historique dans cette session, tandis que le bundle local contenait le launcher vers `EvaluationDeliveryEditor`. Une propagation de bundle/cache reste donc à surveiller avant de considérer le nouveau launcher vérifié en production.
- Aucun envoi n’a été déclenché pendant cette vérification.

## Vérification du launcher après cache-busting

Après rechargement forcé avec `cache=20260902-2`, le domaine public affiche bien le bouton « Ouvrir l’espace de préparation ». Le clic ouvre `EvaluationDeliveryEditor` en grand espace, mais le chargement retourne encore « Le brouillon n’a pas pu être chargé — Dossier d’évaluation introuvable » pour `COMPTE-1140001`. Le bouton « Réessayer » est visible. Aucun envoi n’a été déclenché.

## Vérification ee425eb6 après debounce

La session admin est reconnue après cache-busting. L’onglet Pré-dossiers s’ouvre et la requête initiale renvoie la liste sans « Unable to transform response from server ». Le filtre doit encore être vérifié après le délai de debounce, puis l’éditeur et ses actions doivent être testés sans diffusion réelle.

## Filtre Pré-dossiers après debounce

Après le rechargement ee425eb6, la session admin reste active. L’onglet Pré-dossiers affiche trois comptes sans dossier et le champ « Rechercher par nom, e-mail, téléphone ou destination… ». La recherche n’a pas reproduit l’erreur de transformation pendant cette vérification ; les actions « Activer le dossier » restent visibles.

## Recherche ciblée ee425eb6

Saisie unique de `COMPTE-1140001` dans Pré-dossiers : la requête se termine après debounce, sans erreur de transformation. Résultat : zéro compte pré-dossier correspondant ; le compte interne semble désormais relever du flux Dossiers/activation plutôt que de la liste Pré-dossiers.

## Dossier interne rattaché

La liste Dossiers montre le compte interne sous la référence `COMPTE-1410001` (source « Compte créé », activation « Activé »). La recherche ciblée a été saisie pour vérifier le chargement de l’éditeur partagé après bootstrap, sans action de diffusion.

## Clic de test sans modification

Le filtre Dossiers retrouve bien `COMPTE-1410001`. Le clic suivant n’a pas déclenché de mutation métier ; le widget d’assistance flottant s’est ouvert, ce qui indique un recouvrement de la zone d’action par un élément flottant dans cette largeur de capture. Aucun dossier n’a été modifié ni envoyé.
