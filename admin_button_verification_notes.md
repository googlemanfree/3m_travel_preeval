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
