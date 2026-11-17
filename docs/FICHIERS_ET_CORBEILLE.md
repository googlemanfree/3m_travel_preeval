# CV qui « disparaissent » après ouverture, et suppression de dossiers

## CV et pièces : ce qui a été corrigé

Le code ne supprime jamais un fichier quand on l'ouvre ou le télécharge. Les causes possibles trouvées, et corrigées :

1. **Fiche 360° vidée par une erreur passagère.** Les listes de documents de la fiche (pièces demandées, documents du dossier, documents agence) renvoyaient une liste VIDE quand la base répondait mal une fois (délai dépassé, connexion perdue) : la fiche s'affichait « sans CV » jusqu'au rafraîchissement suivant, typiquement au retour de l'onglet du CV qu'on venait d'ouvrir. Ces lectures relancent maintenant l'erreur (seule une table absente donne une liste vide) : l'écran garde les dernières données reçues.
2. **Service worker.** Il pouvait garder une copie des fichiers dans le cache du navigateur : le lien signé qu'elle contenait expire, et le fichier devenait introuvable à la réouverture (et des documents de candidats restaient dans le cache). Les fichiers déposés (`/manus-storage/…`) ne sont plus jamais interceptés, et les anciens caches sont vidés (version v61).
3. **Téléchargement.** Les liens « Télécharger » utilisaient l'attribut `download`, ignoré par les navigateurs quand l'adresse redirige vers un autre site : le fichier s'ouvrait à la place de la page et la fiche était quittée. Le téléchargement passe maintenant par le serveur (`?download=1&name=…`) qui renvoie le fichier avec son nom, en pièce jointe.
4. **Stockage.** Le lien signé est demandé jusqu'à trois fois ; une erreur durable renvoie un message clair (« réessayez », ou « fichier introuvable — il n'a pas été supprimé par cette ouverture ») au lieu d'une page vide.

## Corbeille des dossiers

« 0 dossier(s) archivé(s), 1 échec(s) » ne disait pas pourquoi. Maintenant :
- le message du serveur est affiché (« Raison : … ») ;
- un dossier déjà dans la corbeille compte comme un succès ;
- un échec du retour du compte en pré-compte, après la mise en corbeille, ne fait plus croire que la suppression a échoué ;
- les **évaluations faites sans compte** (lignes « Évaluation seule / sans compte ») peuvent être mises à la corbeille : repère réversible dans les réglages de l'agence (`evaluation_archived:<n>`), sans migration ni suppression ; l'évaluation reste visible dans le tableau des évaluations, se retrouve dans la corbeille et se restaure comme les autres.

Rappel : la mise à la corbeille est réservée au super administrateur.
