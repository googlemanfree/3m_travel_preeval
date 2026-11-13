# Cohérence des données — pays, zone, type de visa et autres champs

## Constat dans le code
- `submitEvaluation` classait le type de visa avec une liste codée en dur de quatre pays (France, Belgique, Allemagne, Luxembourg) : un dossier Italie, Pologne, Lituanie, Grèce ou Espagne (Schengen) recevait le visa « autre ».
- La zone de destination (`schengen` / `canada` / `autre`) était saisie par le navigateur, sans contrôle contre le pays.
- La soumission historique (`submit`) acceptait telle quelle une combinaison zone / visa / projet contradictoire.
- Le pays était un texte libre : « luxembourg », « Luxembourg », « LU » étaient trois valeurs différentes ; la table des alternatives de pays cherchait la saisie brute (casse comprise).
- Types de visa : trois vocabulaires coexistent (énumération de l'évaluation, texte libre `etude/travail…` sur les comptes et dossiers, libellés du formulaire).

## Ce qui est en place (`shared/dataCoherence.ts`)
- **Référentiel de pays** (nom canonique, ISO, zone, UE) avec alias (accents, casse, anglais, code ISO). Un pays inconnu n'est jamais deviné.
- **Zone et code de visa déduits** : le pays décide de la zone, la zone et le projet décident du code de visa (énumération existante, jamais une valeur hors énumération). Serbie et Royaume-Uni : zone « autre » ; Irlande et Chypre : UE mais hors Schengen.
- **À l'écriture** : les deux soumissions d'évaluation passent par `normalizeDestination` (plus de liste codée en dur, plus de zone saisie librement).
- **Contrôles** (`checkRecordCoherence`) : pays non reconnu ou mal orthographié, zone ou visa en contradiction avec le pays, visa en contradiction avec le projet, date de naissance illisible ou future, âge invraisemblable ou différent de la date de naissance, expérience supérieure à l'âge possible, année de diplôme future ou antérieure à l'âge possible, e-mail et téléphone invraisemblables.
- **Bilan automatisé** : un dossier dont le projet et le visa se contredisent n'est pas analysé tant que ce n'est pas clarifié.

## Page `/admin/coherence`
1. **Rapport** (lecture seule) sur les évaluations, comptes et dossiers : anomalies par type, exemples.
2. **Aperçu** des corrections automatiques, limité à : orthographe du pays, zone et code de visa **des évaluations**, quand le pays est reconnu (et le visa seulement si le projet est connu).
3. **Application en lot** après confirmation : refusée si les données ont changé depuis l'aperçu, 500 corrections au plus, chaque changement journalisé (`data_coherence_log`, table additive créée à la demande).
4. **Annulation** d'un lot : restaure l'ancienne valeur seulement si la valeur actuelle est encore celle posée par le lot.

Jamais modifiés automatiquement : noms, dates, âge, expérience, diplômes, e-mails, téléphones, comptes et dossiers. Ces anomalies sont signalées pour correction humaine.

## Limites
- Les données réelles sont sur Manus : le rapport doit y être lancé pour connaître l'ampleur réelle des écarts. Ce travail n'a été testé que sur une base de test.
- Le référentiel couvre les destinations courantes ; les autres pays sont signalés « non reconnus » (à ajouter au référentiel au besoin).
- Les types de visa texte libre des comptes et dossiers ne sont pas réécrits (trois vocabulaires à unifier : décision métier à prendre).
