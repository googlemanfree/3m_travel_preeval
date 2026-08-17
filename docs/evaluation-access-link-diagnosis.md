# Diagnostic — lien e-mail d’évaluation

Le lien différé actuel cible `/mon-espace?dossier=<référence>`. Sans session active, la page affiche l’accès réservé aux membres sans conserver de parcours explicite vers le dossier concerné. Le correctif doit diriger le candidat vers une connexion sécurisée, puis vers son espace associé, sans exposer les données d’un autre dossier.

Le nouveau format a été vérifié : il ouvre directement la page de connexion sur le domaine canonique `www.3mtravelagency.com` et conserve la destination `/mon-espace?dossier=<référence>` dans le paramètre de retour. Après une connexion valide, la page Login restitue cette destination.
