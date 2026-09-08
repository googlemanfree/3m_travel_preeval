# Vérification tRPC de l’accueil — 2026-09-08

URL preview : `https://3000-iny5kjmnfoev8tdfi1ei2-47c1dede.us1.manus.computer/?from_webdev=1&trpc_debug=isolated`

Avant correction, le symptôme rapporté était : « Missing result », « Unable to transform response from server » et « Failed to fetch » sur `/`.

Après correction du transport client avec `maxItems: 1`, une navigation fraîche rend l’accueil complet : hero, CTA, FAQ, formulaire de contact et sections publiques sont présents. La console du navigateur ne produit aucune erreur après le chargement. Les requêtes publiques observées répondent en 200 avec des résultats JSON valides, notamment `customerReview.listApproved`, `customerReview.getStats` et `auth.me`.

La correction vise le problème de réponse batch partielle ; elle ne modifie aucune donnée métier.
