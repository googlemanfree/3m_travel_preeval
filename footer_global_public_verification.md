# Vérification publique — footer global

Date : 24 août 2026.

L’URL `https://www.3mtravelagency.com/?release=870aec46&footer-final=1` a chargé une version antérieure du bundle public : elle conserve les anciens blocs « Nous Sommes Officiellement Enregistrés », les informations Douala et les sections détaillées de contact qui précèdent le footer. Cette réponse ne reflète pas le module d’assistance compact ni le footer global présents dans le build local validé.

La cause est une diffusion différée ou un cache d’assets du domaine public. Avant de conclure le contrôle, une nouvelle révision de diffusion doit forcer le chargement du bundle contenant le footer global et la section d’assistance compacte. Aucune route, composant fonctionnel ou donnée n’est supprimé dans cette action de diffusion.

## Vérification après la révision PWA v12

URL contrôlée : `https://www.3mtravelagency.com/?release=b37b3095&footer-global=1`.

Le bundle public affiche désormais le module compact « Préparer votre démarche avec les bonnes informations » avec un lien vers les sources officielles, sans les anciens blocs détaillés de coordonnées. En bas de la page, un seul footer continu présente l’alerte anti-fraude, les liens utiles, Yaoundé (WhatsApp principal et fixe), Ottawa et les informations légales. Les anciennes sections de contact ne sont plus rendues comme des pieds de page distincts.

## Vérification après la révision PWA v13 — mini-plan

URLs contrôlées : `https://www.3mtravelagency.com/?release=b347e4ff&footer-mini-sitemap=1` et `https://www.3mtravelagency.com/tarifs?release=b347e4ff&footer-mini-sitemap=1`.

Le domaine public affiche désormais, dans le footer unique, le titre accessible « Mini-plan du site » et les six raccourcis attendus : « Évaluation gratuite », « 3M Booking », « Procédures », « e-Visas », « Tarifs » et « Sources officielles ». Le contrôle de la page secondaire `/tarifs` confirme que le même footer partagé est hérité hors de l’accueil. La révision PWA v13 a évacué le bundle obsolète précédemment servi, sans suppression de route, de composant fonctionnel ou de contenu.

## Vérification après la révision PWA v14 — interactions de raccourcis

URL contrôlée : `https://www.3mtravelagency.com/tarifs?release=524017f3&footer-shortcut-motion=1`.

Après actualisation, le DOM public confirme pour chacun des six liens du mini-plan la présence de l’animation de survol `hover:translate-x-1`, de l’anneau de focus clavier visible et de la désactivation des animations lorsque la préférence « mouvement réduit » est activée. La révision PWA v14 a donc bien diffusé les interactions du footer partagé.

## Vérification après la révision PWA v16 — plan du site et aides contextuelles

URL contrôlée : `https://www.3mtravelagency.com/plan-du-site?release=4be59b3d&footer-tooltips=public-verified`.

Après propagation, le domaine public affiche le plan du site structuré en quatre catégories, avec une description pour chaque accès. Le footer partagé conserve ses raccourcis et présente des infobulles accessibles : au focus clavier, le raccourci « Évaluation gratuite » affiche « Démarrer une orientation gratuite sans créer de compte. » ; l’icône Facebook affiche son aide contextuelle. Le service worker actif est `sw.js?revision=2026-08-24-sitemap-footer-tooltips-static`, avec le cache v16. Cette vérification confirme aussi la bannière de mise à jour disponible pour les navigateurs utilisant encore une version antérieure.

## Vérification publique — recherche et bascule bilingue

URL contrôlée : `https://www.3mtravelagency.com/plan-du-site?release=56fce112&navigation-search-language=public-v17`.

Le domaine public affiche la barre « Rechercher dans le plan du site », les commandes « Français » et « English », ainsi que la page complète en anglais. La bascule vers le français a été vérifiée dans la même session : les titres, descriptions et raccourcis du footer sont revenus en français. L’infobulle du raccourci « Évaluation gratuite » est visible au focus clavier en français. Le registre d’engagement minimal a été migré et le code de suivi est diffusé ; aucun clic de démonstration n’a été envoyé afin de ne pas fausser les statistiques réelles. À ce contrôle, le chemin statique du worker public renvoyait encore le cache v16, mais le bundle de navigation v17 et ses fonctionnalités sont effectivement chargés et vérifiés sur le domaine public.

## Vérification après la révision PWA v18 — menu global et recherche à synonymes

URL contrôlée : `https://www.3mtravelagency.com/plan-du-site?release=608959b8&footer-analytics-menu-bilingual=deployment-confirmed`.

Le domaine public a chargé le menu principal issu de la révision v18. Après sélection de « English », les éléments observés sont notamment « Home », « Procedures », « Resources », « PDF guide », « Quick assessment » et « Case tracking », avec les actions « Client access » et « Sign up ». La recherche publique accepte le synonyme `hotel` et conserve le résultat « 3M Booking » (`1 results`). La route admin locale affiche le refus d’accès sans authentification, tandis que le résumé agrégé d’engagement est contrôlé côté serveur par une session administrateur valide. Aucun clic artificiel n’a été enregistré dans le registre d’engagement.

## Vérification après la révision PWA v21 — indexabilité et crédibilité

URL contrôlée : `https://www.3mtravelagency.com/?release=eac7c02a&public-prerender-credibility=propagated`.

Le domaine public sert désormais un contenu initial indexable avant l’exécution complète du JavaScript : le HTML contient un titre unique, une meta description, une balise `robots` à `index,follow`, une balise Open Graph et un titre éditorial (`h1`). Le header affiche en continu l’identité légale centralisée : « 3M Travel Agency SARL · RC/YAO/2019/A/2567 · NIU M112417203369H ». Le module « Consulter les sources officielles » est visible sur l’accueil sans afficher de statistiques de placement non étayées. Le worker public est propagé en cache v21.
