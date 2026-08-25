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

## Vérification publique après diffusion

La navigation navigateur depuis `https://3mtravelagency.click/procedures?country=CA` aboutit sur `https://www.3mtravelagency.com/procedures?country=CA` grâce au repli navigateur publié. Les balises `canonical` et `og:url` de la page officielle, ainsi que le sitemap XML, pointent correctement vers `www.3mtravelagency.com`.

En revanche, une requête HTTP directe de la variante `.click` reçoit encore `200` du proxy amont au lieu du `301` applicatif attendu. Ce comportement empêche de prétendre qu’une redirection serveur permanente est vérifiée. La dernière révision PWA v31 n’est pas encore servie par le worker public, qui retourne encore v30. Une redirection `301` configurée au niveau du domaine, du CDN ou du registrar reste nécessaire pour fournir à Google le signal de consolidation le plus robuste.

## Vérification LWS

La session LWS affiche `3mtravelagency.com` comme domaine géré par LWS. Une recherche de `3mtravelagency.click` dans les services du compte ne retourne aucun résultat. LWS ne peut donc pas créer la redirection de ce domaine secondaire depuis ce compte : son enregistrement et sa redirection sont vraisemblablement gérés par un autre fournisseur ou par la plateforme qui l’a ajouté comme domaine personnalisé.

La consultation RDAP publique identifie **Global Domain Group LLC** (IANA 3956) comme registrar de `3mtravelagency.click`, avec les serveurs de noms `ns1.globaldomaingroup.com` et `ns2.globaldomaingroup.com`. La redirection permanente doit donc être configurée dans le compte de ce registrar, ou auprès de son support, et non dans le compte LWS actuellement ouvert.

## Gestion Manus du domaine `.click`

La rubrique **Settings → Domains** de Manus confirme que `3mtravelagency.click` et `www.3mtravelagency.click` sont enregistrés avec Manus et rattachés au projet. L’écran de gestion expose uniquement les enregistrements DNS `A` pour `@` et `www`, dirigés vers `104.18.26.246`, sans action de redirection HTTP ni règle de routage disponible. Modifier les enregistrements DNS ne peut pas, à lui seul, créer un code HTTP `301` et risquerait de rompre la desserte actuelle ; aucune modification DNS n’a donc été appliquée.

Le 25 août 2026, une demande a été transmise à l’assistance Manus pour activer une redirection HTTP permanente `301` de `3mtravelagency.click` et `www.3mtravelagency.click` vers `https://www.3mtravelagency.com`, avec conservation du chemin, des paramètres et des ancres. La vérification HTTP publique reste en attente de la réponse ou de l’application de cette configuration côté plateforme.
