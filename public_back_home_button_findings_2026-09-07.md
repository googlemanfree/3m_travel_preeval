# Vérification publique — bouton Retour à l’accueil

URL de départ : https://www.3mtravelagency.com/mon-espace?section=dossier&back_home_test=published

Résultat : la redirection sans session vers `/login?redirect=1&from=...` fonctionne. Le contenu public observé expose encore l’ancien lien « ← Back to home » en bas de la carte et ne montre pas le nouveau bouton sous le bouton de connexion. Le clic tenté sur l’élément public indexé 31 n’a pas changé l’URL pendant l’observation.

Le code local et le checkpoint `14fb2fba` contiennent bien le nouveau bouton dans `Login.tsx`, ainsi que le bouton dans `AuthGuard.tsx`. Hypothèse à vérifier avant de conclure : cache PWA/service worker ou propagation de la version publique, car le domaine sert une structure antérieure au code publié.
