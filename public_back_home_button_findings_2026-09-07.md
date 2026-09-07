# Vérification finale — bouton Retour à l’accueil

URL testée sur le preview : `https://3000-iny5kjmnfoev8tdfi1ei2-47c1dede.us1.manus.computer/mon-espace?section=dossier&back_home_test=preview-after-restart`

Résultat avant clic : l’écran « Accès Réservé aux Membres » affiche, dans l’ordre, « Se connecter », « Inscription », puis « ← Retour à l’accueil ».

Action réelle : clic sur « ← Retour à l’accueil ».

Résultat après clic : navigation vers la racine du preview `https://3000-iny5kjmnfoev8tdfi1ei2-47c1dede.us1.manus.computer/` ; la page d’accueil 3M Travel s’affiche.

Note domaine public : la redirection sans session vers `/login` reste observable sur le domaine public au moment du test, avec un bundle CDN qui conservait encore l’ancienne configuration `autoRedirect`. Le preview redémarré sert bien la version checkpointée et le clic réel est validé dessus.
