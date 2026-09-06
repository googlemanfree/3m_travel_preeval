# Vérification live isolation documentaire — 2026-09-06

URL contrôlée : https://www.3mtravelagency.com/admin

La session admin est authentifiée. Le tableau de bord affiche 29 dossiers, 5 dossiers en ligne, 12 dossiers agence et 55 documents reçus après synchronisation.

Dans Administration → Documents, la recherche `COMPTE-1140001` propose `TEST INTERNE — Évaluation externe · COMPTE-1140001`. Après sélection, l’interface affiche explicitement : `DOSSIER SOURCE DU DÉPÔT — TEST INTERNE — Évaluation externe · COMPTE-1140001` et `Compte candidat en ligne : les pièces seront conservées uniquement dans ce dossier.` Aucun dépôt, téléchargement, suppression ou modification n’a été effectué.

La même vue présente séparément des cartes d’autres dossiers (par exemple `3M-AGN-270002`, `3M-AGN-240001`, `3M-AGN-270004`, `3M-AGN-420001`, `EVAL-AG-240001`) avec leurs compteurs propres. La preuve live confirme le bornage du sélecteur par dossier ; la comparaison détaillée des documents de deux dossiers reste à poursuivre sans action destructive.

Observation de session : la sélection d’un dossier peut déclencher une nouvelle vérification OAuth si le jeton expire. Dans ce cas, le contrôle doit être repris après reconnexion, sans déclarer le test multi-dossiers terminé.

## Second dossier comparé

Après remplacement de la recherche par `COMPTE-1110001` et sélection de l’option `Fabien Bah · COMPTE-1110001`, le panneau source change explicitement pour : `DOSSIER SOURCE DU DÉPÔT — Fabien Bah · COMPTE-1110001` et `Compte candidat en ligne : les pièces seront conservées uniquement dans ce dossier.`

La sélection de COMPTE-1140001 affichait auparavant `TEST INTERNE — Évaluation externe · COMPTE-1140001`. Les deux sélections produisent donc deux dossiers source distincts ; aucune pièce ou information du premier dossier n’est affichée dans le panneau source du second. Aucun dépôt, téléchargement, suppression ou modification n’a été effectué.

Résultat live : isolation de la cible de dépôt vérifiée sur deux dossiers distincts. La vérification du contenu détaillé des fichiers reste limitée aux compteurs et à la cible affichée, sans ouverture de document pour préserver la non-modification.
