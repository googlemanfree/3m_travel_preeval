# Audit domaine et contenu des procédures — 27 août 2026

## Domaine public

Les deux hôtes historiques redirigent par HTTP 301 vers `https://www.3mtravelagency.com/` : l’hôte racine `.click` redirige directement et son sous-domaine `www` transite d’abord par l’hôte racine. Le domaine `.com` sert un canonical, une balise `og:url` et un robots `index,follow` tous alignés sur `https://www.3mtravelagency.com/`.

La présence de résultats `.click` dans les moteurs est donc un historique d’indexation. Les correctifs applicatifs peuvent renforcer le signal `.com`, mais l’actualisation des résultats dépend ensuite du nouveau crawl et de la validation dans les outils des moteurs.

## Ressources procédures

Le catalogue public actif couvre les 107 fiches : 91 procédures et 16 e-Visas. Les routes publiques de détail lisent ce catalogue plutôt que les prototypes anciens. Les fichiers encore accessibles dans l’espace de travail ne comprennent que deux guides Canada et un document hors corpus ; les 107 PDF annoncés ne sont donc pas tous disponibles pour une nouvelle extraction.

L’enrichissement devra réutiliser le contenu déjà relié à chaque fiche, conserver les liens institutionnels vérifiés et signaler toute source absente comme « à vérifier ». Les PDF manquants devront être retransmis pour une révision documentaire complète de chaque destination.

## Contrôle de route

La route canonique `https://www.3mtravelagency.com/procedures/canada-travail` charge une fiche détaillée avec guide PDF associé, étapes, documents, portail institutionnel et date de contrôle. Le chargement différé initial est transitoire : la fiche est ensuite rendue normalement. La même structure s’applique à partir du catalogue public ; le contrôle complet devra donc tester toutes les routes générées et non les anciens prototypes de pages procédures.
