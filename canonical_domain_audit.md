# Audit du domaine officiel — 25 août 2026

| Contrôle | Constat public | Action retenue |
|---|---|---|
| `https://3mtravelagency.click/` | Retourne `HTTP 200` et sert le site, sans redirection. | Ajouter une redirection permanente applicative vers le domaine officiel. |
| `https://www.3mtravelagency.click/` | Redirige en `301` vers la variante non-www `.click`, qui sert ensuite le site. | Faire converger les deux variantes `.click` vers `https://www.3mtravelagency.com`. |
| `https://3mtravelagency.com/` | Redirige en `301` vers `https://www.3mtravelagency.com/`. | Conserver ce comportement. |
| `https://www.3mtravelagency.com/` | Retourne `HTTP 200`. | Conserver comme origine officielle. |
| `https://www.3mtravelagency.com/sitemap.xml` | Retourne `HTTP 200` avec `application/xml`. | Conserver le sitemap sur le domaine officiel. |

Le pré-rendu public définit déjà les liens canoniques et `og:url` sur `https://www.3mtravelagency.com`. La correction vise donc à faire correspondre la redirection HTTP et les liens sortants générés aux mêmes signaux. L’apparition du résultat corrigé dans Google dépend ensuite du recrawl et de la réindexation par Google.

## Diagnostic de propagation

Après le premier déploiement, la variante `.click` répondait toujours `200` alors que le middleware local fonctionnait. Les en-têtes publics indiquent un proxy transparent en amont de l’application. Le middleware prend désormais en compte `X-Forwarded-Host` lorsque ce proxy transmet l’hôte externe, ce qui permet de reconnaître correctement `3mtravelagency.click` et de renvoyer la redirection `301` vers le domaine officiel. La simulation locale avec hôte interne et `X-Forwarded-Host: 3mtravelagency.click` confirme le comportement attendu.
