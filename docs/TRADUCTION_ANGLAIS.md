# Traduction du site en anglais

## Le problème

Quand un visiteur choisit l'anglais, beaucoup de phrases restaient en français : la plupart des pages sont rédigées en français sans appel à `t(fr, en)`. Mesure du 2026-11-24 (223 pages françaises ouvertes avec l'anglais choisi) : **56 % des mots visibles étaient encore en français** (263 000 sur 466 000), dont 195 000 dans les 116 pages de procédures.

## Le mécanisme

`client/src/i18n/domTranslator.ts` remplace, quand l'anglais est choisi, chaque texte français affiché par sa traduction du dictionnaire `client/src/i18n/frToEn.json` :

- il s'applique au texte visible et aux attributs `placeholder`, `aria-label`, `title`, `alt` ;
- il suit le contenu qui arrive plus tard (routes chargées à la demande, données reçues) ;
- il ne devine jamais : une chaîne absente du dictionnaire reste en français ;
- il garde le texte d'origine : repasser en français le restitue ;
- il ne touche ni aux champs de saisie, ni au code, ni aux zones `data-no-translate`, ni à l'administration (`/admin`, qui reste en français) ;
- le dictionnaire n'est chargé qu'en anglais ; les dates (« 27 octobre 2026 ») sont mises en forme anglaise (« October 27, 2026 ») ; une chaîne avec `{date}` sert de modèle.

Le mécanisme `t(fr, en)` existant reste la bonne méthode pour tout nouveau texte : le dictionnaire sert aux textes déjà écrits.

## Ajouter des traductions

1. Les chaînes à traduire sont celles qui restent en français : `node scripts/i18n/measure-french.cjs <site> <pages>` les liste.
2. Un lot = deux fichiers dans `scripts/i18n/batches/` : `NNN.fr.json` (les chaînes françaises, exactement comme le site les affiche, espaces simplifiés) et `NNN.en.json` (les traductions, dans le même ordre).
3. `npx tsx scripts/i18n/build-dictionary.mts` assemble `client/src/i18n/frToEn.json` (refuse un lot mal aligné, une traduction vide ou un doublon contradictoire).
4. Les tests (`server/i18nDictionary.test.ts`) vérifient l'alignement, les clés normalisées, les emplacements `{date}` et l'absence de « traduction » encore française.

## Phrases-modèles

Une chaîne qui ne figure pas telle quelle au dictionnaire est ramenée à un modèle avant la recherche : une date devient `{date}`, une valeur entre « » devient `«{q}»` (avec « jours », « mois », « ans »… traduits), un nom de pays du site devient `{c}` (liste `COUNTRIES_FR_EN` dans `domTranslator.ts`). Exemple : « Autres procédures pour Allemagne » → « Other procedures for Germany » grâce à l'entrée « Autres procédures pour {c} ».

## Avancement

Lots 1 à 10 : 1 423 chaînes et 5 phrases-modèles. Les lots 1 à 7 couvrent les textes les plus répétés (étapes des procédures, listes de pièces, e-Visa, mises en garde, protocole d’ouverture, FAQ de sécurité, présentations de pays, questions de la calculatrice CRS). Les lots 8 à 10 couvrent les pages publiques les plus vues en entier : accueil, services, tarifs, à propos, contact, FAQ, vérifier une agence, paiement, Canada et calculatrice CRS, vols, 3M Solutions. Il reste environ 2 700 chaînes uniques, surtout propres à une seule page : procédures par pays, e-Visa par pays, blog, guides, Schengen, études, travail.
