# Revue visuelle du lot destinations — 2026-09-13

## `/destinations`

La route se charge et affiche le hub avec 23 destinations annoncées, les trois cartes mises en avant Allemagne/Autriche/Suisse, les groupes régionaux et les CTA. Les liens Canada et Luxembourg restent dirigés vers leurs pages existantes (`/canada` et `/procedures/luxembourg`). Anomalie visuelle relevée dans la capture desktop : le titre du hero semble trop sombre sur le fond bleu foncé, donc son contraste doit être vérifié/corrigé avant publication.

## `/procedures/autriche-formation`

La route se charge avec un hero, les sections Autriche/Suisse, des étapes numérotées, un tableau comparatif et les liens institutionnels. Le contenu est présent et la structure est lisible, mais le titre principal du hero apparaît également très sombre sur le fond bleu, comme sur le hub. Cette anomalie de contraste doit être traitée avant publication.

Aucune donnée métier ni aucun dossier réel n’a été modifié pendant cette revue.

## Revalidation après correction

Le titre du hero de `/destinations` est désormais blanc et lisible sur le fond bleu. Le titre du hero de `/procedures/autriche-formation` est également blanc et lisible. Les 23 destinations, les cartes et les sections principales restent affichées ; la page Autriche–Suisse conserve ses deux volets, son tableau comparatif et ses liens officiels.

## Pages génériques

Les pages `/procedures/pays-bas`, `/procedures/france` et `/procedures/japon` se chargent correctement et leurs drapeaux, catégories, descriptions et CTA sont visibles. Leur titre principal reste cependant sombre sur le hero bleu ; le composant partagé `DestinationFormationPage` doit recevoir le même correctif `text-white` que les deux héros déjà corrigés.
