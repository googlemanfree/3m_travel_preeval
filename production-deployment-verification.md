# Vérification du déploiement public

Vérification effectuée le 13 août 2026 à 22:44 GMT. Les domaines `www.3mtravelagency.com`, `3mtravelagency.click` et `3mtravelpre-gebuu8iq.manus.space` servent tous le bootstrap avec `boot-countdown`, `boot-progress-bar` et `boot-retry`. Le domaine canonique sert le module `/assets/index-6IE05yMO.js`.

L’en-tête HTTP `Last-Modified` retourné par les domaines actifs est `Thu, 13 Aug 2026 22:37:08 GMT`, avec `Cache-Control: no-cache, no-store, must-revalidate`. Le contenu actuellement servi correspond donc au correctif publié après le checkpoint `c22c1ef2`, et non à l’ancien loader simple. Les variantes sans `www` redirigent vers leur domaine canonique.

Une nouvelle publication sera néanmoins forcée par checkpoint afin de créer une version de déploiement fraîche et de faire repasser le contenu par le chemin de publication/cache du projet.
