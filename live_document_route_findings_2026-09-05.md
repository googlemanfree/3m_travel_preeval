# Vérification publique documentaire — 2026-09-05

URL vérifiée : https://www.3mtravelagency.com/document-upload

Résultat observé : la route rend la page « Dépôt de documents | 3M Travel & Services » et affiche le garde « Connexion requise — Vous devez être connecté pour téléverser vos documents », avec bouton « Se connecter ». Aucun document ni liste d’un autre dossier n’est visible sans authentification. La route historique est donc utilisable et aboutit au parcours sécurisé de dépôt ; le test d’upload réel et le contrôle multi-dossiers nécessitent une session candidat/admin authentifiée.

Action client exacte : ouvrir `/document-upload`, puis cliquer « Se connecter ». Action admin à vérifier séparément : ouvrir `/admin` → Centre documentaire et rechercher deux numéros de dossier distincts ; chaque pièce doit rester sous son dossier source.
