# Vérification des accès protégés

- La route `/admin` affiche une page d’accès refusé et un bouton de connexion administrateur lorsque la session est absente.
- La route `/mon-espace` affiche une page de connexion ou d’inscription lorsque la session candidate est absente.
- Les deux pages protégées restent rendables, sans écran blanc ni erreur visible, dans l’aperçu de développement.
