# Audit domaine et contenu des procédures — 27 août 2026

## Domaine public

Les deux hôtes historiques redirigent par HTTP 301 vers `https://www.3mtravelagency.com/` : l’hôte racine `.click` redirige directement et son sous-domaine `www` transite d’abord par l’hôte racine. Le domaine `.com` sert un canonical, une balise `og:url` et un robots `index,follow` tous alignés sur `https://www.3mtravelagency.com/`.

La présence de résultats `.click` dans les moteurs est donc un historique d’indexation. Les correctifs applicatifs peuvent renforcer le signal `.com`, mais l’actualisation des résultats dépend ensuite du nouveau crawl et de la validation dans les outils des moteurs.

## Ressources procédures

Le catalogue public actif couvre les 107 fiches : 91 procédures et 16 e-Visas. Les routes publiques de détail lisent ce catalogue plutôt que les prototypes anciens. Les fichiers encore accessibles dans l’espace de travail ne comprennent que deux guides Canada et un document hors corpus ; les 107 PDF annoncés ne sont donc pas tous disponibles pour une nouvelle extraction.

L’enrichissement devra réutiliser le contenu déjà relié à chaque fiche, conserver les liens institutionnels vérifiés et signaler toute source absente comme « à vérifier ». Les PDF manquants devront être retransmis pour une révision documentaire complète de chaque destination.

## Contrôle de route

La route canonique `https://www.3mtravelagency.com/procedures/canada-travail` charge une fiche détaillée avec guide PDF associé, étapes, documents, portail institutionnel et date de contrôle. Le chargement différé initial est transitoire : la fiche est ensuite rendue normalement. La même structure s’applique à partir du catalogue public ; le contrôle complet devra donc tester toutes les routes générées et non les anciens prototypes de pages procédures.

## Vérification complémentaire d’indexation

Le 27 août 2026, une recherche publique conserve une entrée historique pour `https://3mtravelagency.click/submit-review`, tandis que la page d’accueil `.com` est également retrouvée. Les deux hôtes `.click` redirigent en HTTP 301 vers l’équivalent `.com` avec une canonical et l’en-tête `X-Robots-Tag: noindex, nofollow, noarchive`.

Le chemin cible `https://www.3mtravelagency.com/submit-review` répond toutefois encore `503 Site under maintenance`. Une réponse publique non indexable accompagnée d’un renvoi explicite vers le formulaire d’évaluation actuel est nécessaire pour éviter que ce chemin historique ne ralentisse la consolidation du domaine `.com` lors du prochain crawl.

## Propriété Google Search Console

Le compte Google professionnel est connecté à Search Console, mais aucune propriété ne couvre encore le domaine racine `3mtravelagency.com`. Le 27 août 2026, Search Console a demandé une vérification de propriété **Domain** par enregistrement DNS (TXT recommandé ou CNAME). Le jeton de vérification n’est pas reproduit dans ce document ni dans le code : il reste affiché uniquement dans la fenêtre Search Console ouverte pour le propriétaire. Une fois le DNS confirmé par le gestionnaire du domaine, l’inspection et la demande d’exploration de l’accueil `.com` pourront être effectuées.

La propriété `sc-domain:3mtravelagency.com` a été vérifiée avec succès le 27 août 2026 par le fournisseur de nom de domaine. Au moment de la vérification, Search Console indique que les rapports de performances, d’indexation et d’expérience sont encore en cours de collecte et demandent de revenir ultérieurement. La propriété couvre le domaine racine ainsi que ses variantes `www`, HTTP et HTTPS.

L’inspection de `https://www.3mtravelagency.com/` confirme que l’URL est déjà présente dans Google, indexable et servie en HTTPS. Googlebot smartphone a récupéré la page avec succès le 27 août 2026 à 08:37 UTC. Le canonical déclaré et celui sélectionné par Google sont tous deux `https://www.3mtravelagency.com/`. Les références historiques observées incluent encore des URLs `.click`, dont `/submit-review` et `/evaluation-primaire`, ce qui justifie le maintien des redirections permanentes, de la désindexation du domaine historique et de l’alias de compatibilité. Aucun sitemap référent n’est encore attribué dans ce rapport initial.

Une demande d’exploration de l’URL canonique a été initiée depuis Search Console le 27 août 2026, après validation de son indexabilité en direct. La confirmation de mise en file d’attente doit être attendue avant de poursuivre avec la soumission du sitemap.

Search Console a ensuite confirmé « Indexing requested » pour l’accueil `https://www.3mtravelagency.com/`. Le sitemap `https://www.3mtravelagency.com/sitemap.xml` a été soumis avec succès le même jour, lu par Google et a déclaré 133 pages découvertes. Cette opération ne modifie pas instantanément l’affichage des résultats : la consolidation des anciennes URLs `.click` dépendra des prochains passages du robot d’exploration et du traitement des redirections permanentes.
