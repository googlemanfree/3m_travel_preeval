# Diagnostic — écran de maintenance signalé

**Signalement reçu :** capture mobile du 26 août 2026 affichant « Ce site est en maintenance ».  
**Contrôle effectué :** 26 août 2026, lecture seule.

Les variantes publiques ont été comparées sans modification DNS. `www.3mtravelagency.com` répond en HTTP 200 avec le contenu complet de 3M Travel & Services. `3mtravelagency.click` renvoie une redirection HTTP 301 vers le domaine officiel ; sa variante `www` redirige d’abord vers le domaine racine, puis vers le .com. Le domaine de prévisualisation répond aussi en HTTP 200.

Une vérification navigateur sur le .com et la variante .click affiche la page publique complète, les formulaires et les contrôles de navigation, sans écran de maintenance. Aucun texte ou composant de maintenance n’est servi par l’application. Le signalement est donc compatible avec une page temporaire de plateforme, un cache intermédiaire ou une URL distincte non visible dans la capture ; il n’est pas reproductible sur les domaines officiels au moment du contrôle.

Les parcours protégés restent protégés : l’entrée employeur présente le formulaire de connexion sans exposer de données candidates. Aucune action métier, modification DNS, paiement, e-mail ou changement de dossier n’a été déclenché pendant le diagnostic.
