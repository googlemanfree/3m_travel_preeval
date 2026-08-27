# Audit SEO, données structurées et lecture par moteurs conversationnels

## Périmètre et résultat de référence

Cet audit porte sur le HTML initial servi par `https://www.3mtravelagency.com/` et les pages prioritaires `/canada`, `/procedures` et `/contact`, ainsi que sur les sources serveur de pré-rendu. Le 27 août 2026, ces pages répondaient en HTTP 200 et présentaient toutes une URL canonique HTTPS sous `www.3mtravelagency.com`, une directive `index,follow`, une balise title, une meta description et un contenu HTML initial comprenant au moins un `h1` et un `h2`.

Le domaine historique `.click` est correctement redirigé en 301 vers le domaine `.com`. Les variantes HTTP et sans `www` du domaine officiel rejoignent elles aussi `https://www.3mtravelagency.com/` en 301. Le fichier `robots.txt` public permet actuellement l’accès à la racine et bloque les zones privées et l’API. Des requêtes HTTP simulant `OAI-SearchBot` et `PerplexityBot` ont reçu une réponse 200 ; cela confirme la réponse de l’origine au moment du test, mais ne remplace pas un contrôle des règles WAF et des plages IP officielles.

Les contrôles locaux exécutés le 27 août 2026 sont concluants : `pnpm exec tsc --noEmit` réussit et les 13 tests ciblés relatifs au pré-rendu, au domaine canonique et au catalogue de procédures réussissent.

## Éléments déjà bien structurés

La page d’accueil contient un graphe JSON-LD avec `Organization` et `WebSite`. Les sous-pages indexables reçoivent un `BreadcrumbList`. La page `/procedures` publie un `FAQPage` et le blog un `BlogPosting`. Les balises Open Graph et Twitter Card utilisent des URLs absolues sous le domaine `.com`, avec une image sociale générée par route serveur. Ces éléments facilitent la compréhension de l’entité, du site et des contenus par les robots ; ils ne constituent toutefois pas une garantie d’apparition dans les résultats ou dans une réponse conversationnelle.[1]

## Points à corriger ou confirmer avant publication

| Priorité | Constat vérifiable | Risque | Action recommandée |
|---|---|---|---|
| Haute | Le sitemap public ne contient que les principales pages et omet les 107 fiches de destination pourtant routables. | Les fiches pays sont moins directement découvrables et suivies. | Générer le sitemap à partir du catalogue canonique, en y ajoutant seulement les fiches publiques, uniques, HTTP 200 et canoniques. |
| Haute | `Organization.sameAs` et le pied de page référencent `instagram.com/3mtravelagency`. Une recherche publique remonte un compte dont l’activité est attribuée à une autre agence. | Risque de confusion d’entité pour Google et les assistants, et de redirection vers un tiers. | Retirer ce lien et la propriété `sameAs` tant que le propriétaire ne confirme pas un compte officiel 3M. Vérifier de même LinkedIn et X avant de les conserver. |
| Haute | La FAQ partagée affirme que le formulaire d’évaluation est accessible sans compte, alors que le parcours actuel est compte-obligatoire puis CV-obligatoire. | Contradiction visible, structurée et opérationnelle. | Réécrire la FAQ visible et le JSON-LD à partir de la même source confirmée, puis contrôler les libellés du footer qui indiquent encore « sans créer de compte ». |
| Moyenne | Le JSON-LD `Organization` est écrit séparément des coordonnées centralisées dans `companyContacts.ts`. Les noms `3M Travel & Services` et `3M Travel Agency SARL` coexistent. | Dérive possible de nom, NAP et informations légales. | Définir une source partagée serveur/client pour le nom public, le nom légal, le domaine, l’e-mail, RC, NIU, adresse, téléphone et réseaux confirmés. |
| Moyenne | Aucune entité locale spécifique de type `TravelAgency`/`LocalBusiness` n’est déclarée pour le bureau de Yaoundé. | Les moteurs reçoivent moins d’indices normalisés sur la présence locale. | Ajouter un nœud `TravelAgency` seulement après confirmation du nom affiché, adresse postale, téléphone principal, horaires et URL de carte ; le relier à `Organization` par des identifiants stables. |
| Moyenne | `FAQPage` est émis sur `/procedures`; le pré-rendu initial ne contient cependant pas les questions et réponses, tandis que l’interface React les affiche après chargement. | Certains robots ou assistants peuvent ne pas rapprocher le schéma du contenu immédiatement accessible. | Inclure exactement les mêmes questions et réponses dans le fallback HTML initial, ou ne pas publier `FAQPage` sur la page concernée. |
| Faible | L’attribut `lang` est fixé à `fr` alors que l’interface a un mode anglais. | Ambiguïté linguistique et absence de ciblage international explicite. | Lorsque les pages anglaises possèdent des URLs distinctes et un contenu équivalent révisé, ajouter `hreflang` réciproque. Ne pas créer de balises de langue pour une simple bascule JavaScript. |

## Architecture JSON-LD recommandée

La page d’accueil devrait conserver un seul bloc `@graph` composé d’une `Organization`, d’un `WebSite` et, après validation des coordonnées, d’une `TravelAgency` pour l’établissement principal. Chaque objet doit avoir un `@id` absolu et stable, par exemple `https://www.3mtravelagency.com/#organization`, `/#website` et `/#yaounde-office`. Les propriétés doivent correspondre au texte public : `name`, `legalName`, `url`, `logo`, `email`, `identifier`, `address`, `telephone`, `openingHoursSpecification` et `sameAs` seulement pour les profils réellement contrôlés par 3M.

Les pages de procédures doivent utiliser un `BreadcrumbList` et, seulement si elles détaillent un guide éditorial réellement affiché et daté, un `Article`/`WebPage` avec titre, description, URL canonique, langue et éditeur. Les FAQ doivent être publiées seulement lorsque les questions et les réponses sont visibles sans ambiguïté. Les fiches destination ne doivent pas déclarer de prix, délais, taux de réussite, avis, notes, certifications, éligibilités ou garanties si ces informations ne sont pas vérifiables et visibles.

## Principes utiles aux assistants conversationnels

Les robots de recherche conversationnelle s’appuient d’abord sur des pages publiques accessibles, des contenus originaux et des signaux d’entité cohérents. OpenAI indique que `OAI-SearchBot` doit pouvoir explorer une page pour que son contenu soit inclus dans les fonctionnalités de recherche ; Perplexity documente la nécessité éventuelle d’autoriser ses robots dans une règle WAF. Les contrôles d’accessibilité, notamment les intitulés de boutons, rôles et libellés ARIA, facilitent aussi l’interprétation des interactions par les agents.[2] [3] [4]

Il ne faut pas tenter de « forcer » ChatGPT ou Perplexity à reconnaître la marque par un balisage excessif. La démarche durable consiste à publier un site techniquement accessible, des coordonnées stables, des contenus datés et sourcés, puis à obtenir des mentions naturelles sur des profils tiers légitimes. L’exploration et la citation restent à la discrétion de chaque service.

## Références

[1] [Google Search Central — Présentation des données structurées](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=fr)

[2] [OpenAI — Overview of OpenAI Crawlers](https://developers.openai.com/api/docs/bots)

[3] [OpenAI — Publishers and Developers FAQ](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq)

[4] [Perplexity — Crawlers](https://docs.perplexity.ai/docs/resources/perplexity-crawlers)
