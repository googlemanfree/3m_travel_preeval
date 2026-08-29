# Audit de couverture du catalogue pays

Date du contrôle : 29 août 2026.

Le fichier `client/src/data/procedures107Complete.ts`, malgré son nom, contient **91 fiches de procédure** réparties sur **42 pays distincts**. Les pays présents sont : Allemagne, Australie, Autriche, Belgique, Bulgarie, Canada, Chypre, Croatie, Danemark, Espagne, Estonie, États-Unis, Finlande, France, Gabon, Grèce, Hongrie, Irlande, Islande, Italie, Kenya, Lettonie, Liechtenstein, Lituanie, Luxembourg, Malaisie, Malte, Maurice, Norvège, Nouvelle-Zélande, Pays-Bas, Pologne, Portugal, Qatar, République tchèque, Roumanie, Royaume-Uni, Sénégal, Slovaquie, Slovénie, Suède et Suisse.

Le parcours dynamique réutilise ces fiches lorsqu’un pays et un type de visa correspondent. Les variantes Canada et Luxembourg explicitement définies dans le catalogue partagé restent prioritaires pour leurs sous-parcours spécifiques, notamment Québec/Arrima. Pour les pays connus avec un portail institutionnel identifié, le lien est affiché. Pour une destination sans source institutionnelle vérifiée dans le référentiel, aucune URL n’est fabriquée : l’interface indique qu’une vérification officielle est requise.

La couverture de 107 fiches et la validation officielle des autres destinations restent ouvertes. Elles nécessitent les 16 fiches manquantes ou les documents sources correspondants, ainsi qu’un contrôle destination par destination des portails officiels, des types de visa et des exigences en vigueur. Aucune information inventée ne doit être publiée pour combler cet écart.

## Sources vérifiées directement

Pour le Luxembourg, la page officielle Guichet.lu consultée le 29 août 2026 confirme que les ressortissants de certains pays tiers peuvent devoir obtenir un visa avant le départ, que la procédure dépend de la durée et de la nature du séjour, et que la demande Schengen relève du consulat de la destination principale. Elle renvoie également vers les formulaires, les missions consulaires et les traducteurs assermentés. Source : https://guichet.public.lu/en/citoyens/immigration/moins-3-mois/ressortissant-tiers/entree-visa.html.

Cette source est utilisée comme portail institutionnel du parcours Luxembourg visiteur et comme point de vérification des parcours nécessitant un séjour de plus de trois mois. Les exigences individuelles restent à confirmer selon la nationalité, la durée et le motif déclarés par le candidat.
