# Reproduction publique — /mon-espace sans session

URL exacte testée : https://www.3mtravelagency.com/mon-espace?section=dossier

Méthode : suppression des clés `3m_candidate_token`, `3m_candidate_info` et `3m_candidate_session_expires_at` de localStorage et sessionStorage dans le navigateur de test, puis navigation fraîche.

Résultat observé après propagation publique : la page ne reste pas sur un chargement infini. Elle affiche « Accès Réservé aux Membres », le message « Veuillez créer un compte ou vous connecter pour accéder à votre espace », ainsi que les boutons « Se connecter » et « Inscription ».

Observation initiale de la session héritée : une session locale candidate persistante affichait auparavant « Chargement de votre tableau de bord… ». Le test propre sans clés candidat n’a pas reproduit ce chargement après navigation fraîche.

Limite : ce constat montre que le fallback public est déjà présent dans la version publiée ; il ne démontre pas encore que tous les cas de restauration intermédiaire sont bornés par un délai. Le correctif doit donc sécuriser la transition de restauration pour éviter toute attente indéfinie si une session périmée ou incohérente est présente.
