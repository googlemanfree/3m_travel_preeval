# Vérification publique — Sources et footer

Date : 24 août 2026.

La page publique `https://www.3mtravelagency.com/sources-officielles?release=c49386f3&footer-verified=1` charge correctement après réinitialisation du cache PWA de vérification. Le filtre par destination est visible, les 12 portails institutionnels sont affichés, et chaque carte propose un lien officiel ainsi qu’un signalement préparé par e-mail sans modification automatique.

Le contenu de la route Sources se termine après son appel à l’évaluation gratuite : aucun footer n’est monté globalement sur cette route. L’accueil monte actuellement `FooterLegal` localement. La correction suivante doit déplacer ce footer partagé dans le layout global et retirer uniquement son rendu local de l’accueil, afin d’obtenir exactement un footer complet sur toutes les pages sans perdre de contenu ou de route.
