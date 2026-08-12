
## Vérification visuelle
- Desktop : `/evaluation` affiche une garde d’accès explicite pour le parcours protégé ; `/admin` affiche une garde administrateur explicite, sans page blanche.
- Mobile 375x812 : les deux écrans restent lisibles, les boutons de connexion et de retour sont accessibles, sans débordement horizontal observé.
- Le widget authentifié de suivi des e-mails n’est pas visible sans session admin, ce qui est attendu et confirme le contrôle d’accès côté route.
- Build production validé après relance avec une limite mémoire supérieure ; seuls les avertissements de taille de bundle restent non bloquants.
