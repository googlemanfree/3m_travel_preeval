# Contrôle Google Search Console — 27 août 2026

- Propriété validée par le propriétaire : `3mtravelagency.com` (propriété de domaine via enregistrement DNS TXT).
- État observé dans la capture du propriétaire : le rapport « Performances » sur trois mois indique que le traitement des données est en cours et recommande un nouveau contrôle dans environ un jour ; aucune métrique n’est encore disponible.
- Le propriétaire a indiqué que le rapport « Pages » affiche le même message de traitement. Les chiffres d’indexation, exclusions, erreurs et inspections d’URL ne sont donc pas encore produits.
- Suite prévue après la période de collecte : contrôler « Pages », « Sitemaps », « Performances » et inspecter `/`, `/canada`, `/procedures` et `/contact`, sans soumettre ou valider une action dans Search Console sans confirmation expresse.

Source : https://search.google.com/search-console/about

## Vérifications publiques préliminaires

Le 27 août 2026, les ressources `https://www.3mtravelagency.com/robots.txt` et `https://www.3mtravelagency.com/sitemap.xml` répondaient en HTTP 200. Le fichier robots autorise l’exploration publique et bloque explicitement les espaces privés et l’API ; il annonce le sitemap sous le domaine canonique `.com`. Les routes `/`, `/canada`, `/procedures` et `/contact` renvoyaient chacune HTTP 200 avec un titre, une description, la directive `index,follow`, une URL canonique HTTPS `.com`, une carte Open Graph et un bloc JSON-LD.

Le sitemap public observé contient les pages principales mais pas les 107 fiches de destination. Cela limite la découverte directe de ces fiches par les robots, même si elles restent accessibles depuis l’annuaire. Cet écart devra être traité lors de l’audit SEO, puis confronté aux rapports Search Console dès qu’ils seront disponibles.
