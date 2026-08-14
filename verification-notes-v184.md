# Vérification v184 — inscription et mot de passe oublié

## Desktop

Les routes `/register`, `/login`, `/forgot-password` et `/reset-password` se chargent sans écran blanc. Le formulaire d’inscription affiche la zone de portrait obligatoire. La page de connexion expose les liens « Renvoyer l’email » et « Mot de passe oublié ? ». La page de récupération présente un bouton clair d’envoi du lien. La route reset sans token affiche correctement un état « Lien invalide » et un bouton pour faire une nouvelle demande.

## Mobile

Les quatre routes restent lisibles dans un viewport de 375×812. Le lien « Mot de passe oublié ? » reste accessible sous le bouton de connexion. La page ForgotPassword conserve des marges adaptées, mais le libellé du bouton d’envoi est proche de la largeur disponible ; il reste utilisable et ne déborde pas. Le parcours reset sans token conserve un retour visuel clair.

## Validation fonctionnelle

Le test ciblé couvre l’émission d’un token de reset aléatoire, le stockage haché, la propagation des erreurs d’envoi, le lien de connexion vers ForgotPassword, la préremplissage de l’adresse et l’invalidation du token après usage. Les tests ciblés passent (8/8) et la suite complète passe (253 tests, 4 ignorés). TypeScript passe sans erreur.
