# Validation du calculateur CRS de 3M TRAVEL AGENCY face à l’outil officiel d’IRCC

Dernière exécution : **2026-11-18**. Grille en vigueur depuis le **3 novembre 2026** (note sur 1 270).

## Sources officielles

- Critères du SCG (grille de points) : https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express/verifier-note/criteries-scg.html
- Outil officiel « Vérifiez votre note » (utilisé pour la colonne « Score IRCC ») : https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express/verifier-note.html
- Changements du 3 novembre 2026 : https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/changes.html

Aucun calculateur tiers n’a été utilisé : la grille a été relue sur canada.ca et chaque profil a été saisi dans le formulaire officiel (version anglaise, même logique que la française).

## Méthode

1. Le script `scripts/crs/compare-ircc.mts` pilote le formulaire officiel avec un navigateur automatisé (`scripts/crs/ircc-driver.cjs`) : il répond aux questions dans l’ordre, comme une personne, puis lit le détail affiché dans « Your results ». Le calcul se fait dans la page ; rien n’est envoyé à IRCC, et aucun dossier de client n’est utilisé (profils de test uniquement : `scripts/crs/profiles.mts`).
2. Les mêmes réponses sont passées au calculateur de 3M (`shared/crsOfficialAnswers.ts` puis `shared/crsScore.ts`).
3. Sont comparées **toutes les lignes** du résultat (âge, études, première et seconde langue, facteur d’intégration au marché du travail, conjoint, les quatre lignes de transférabilité et leurs sous-totaux, certificat, points supplémentaires, total), pas seulement le total.

## Résultat

- Profils saisis dans l’outil officiel : **229**.
- Profils identiques à l’outil officiel sur toutes les lignes : **229**.
- Écarts constatés : **0** — le barème de 3M reproduit exactement celui d’IRCC sur tous les profils testés.

## Corrections apportées lors de cet audit (hors barème de points)

Le barème de points était déjà exact ; les corrections portent sur des réponses que l’outil officiel traite autrement :

- **Seconde langue jamais comptée comme « sans objet » par défaut.** Sur canada.ca, la question « autres résultats linguistiques ? » exige une réponse (« not applicable » inclus). La calculatrice de 3M considérait une réponse vide comme « aucun test ». Désormais, elle demande de choisir un test ou « Sans objet » et le liste parmi les réponses manquantes.
- **Question « 6 ii » (profession à salaire élevé) posée seulement avec au moins 1 an d’expérience canadienne**, comme sur canada.ca (vérifié : masquée à 0 an, affichée dès 1 an). Avant, 3M la posait toujours et pouvait compter une ancienne réponse « Oui » après un retour à 0 an. Désormais, la réponse est ignorée sans expérience canadienne.
- **Lien « Voir le détail des critères sur Canada.ca »** : l’ancienne adresse renvoyait une page « Pas trouvé » (404) ; elle pointe maintenant vers la page des critères du SCG.

## Ce qui n’a pas pu être vérifié dans l’outil officiel

- **Test de langue de plus de deux ans (question 5 i = « Non »)** : l’outil officiel affiche le message « vous ne semblez pas admissible à Entrée express pour le moment » (preuve de la langue exigée) ; aucune note n’a été lue. 3M se comporte de la même façon (aucune note, explication). Il n’y a donc pas de score IRCC à comparer.
- **Réponses jamais testées une par une** : combinaisons de plusieurs facteurs non listées ci-dessous (le total est la somme de rubriques toutes comparées ligne à ligne ; les plafonds de 50 / 100 / 600 et le cas « les deux sources du facteur d’intégration » le sont par des profils dédiés). Un profil réel peut toujours tomber sur un cas particulier d’IRCC (règles d’admissibilité, justificatifs) que ni l’outil ni ce document ne vérifient.
- **Futures modifications de grille** : ce tableau date du jour d’exécution ; relancer `scripts/crs/compare-ircc.mts` après chaque annonce d’IRCC.

## Relancer la validation

```bash
npx tsx scripts/crs/compare-ircc.mts --out resultats.jsonl --workers 3
npx tsx scripts/crs/make-validation-doc.mts resultats.jsonl docs/CRS_VALIDATION.md
```

Variables utiles : `HTTPS_PROXY` (si l’accès à canada.ca passe par un proxy) et `CRS_CHROMIUM_PATH` (navigateur Chromium à utiliser).

## Tableau de validation

Tous les résultats ci-dessous ont été **vérifiés dans le calculateur officiel** d’IRCC (colonne « Score IRCC » = total affiché par l’outil le jour de l’exécution). La colonne « Correction » indique « aucune » quand 3M donnait déjà le même résultat sur chacune des lignes détaillées.

### Âge (valeurs de contrôle)

| Profil testé | Score 3M | Score IRCC | Écart | Correction |
| --- | ---: | ---: | ---: | --- |
| Âge 20, sans conjoint | 379 | 379 | 0 | aucune |
| Âge 18, sans conjoint | 368 | 368 | 0 | aucune |
| Âge 17, sans conjoint | 269 | 269 | 0 | aucune |
| Âge 19, sans conjoint | 374 | 374 | 0 | aucune |
| Âge 29, sans conjoint | 379 | 379 | 0 | aucune |
| Âge 30, sans conjoint | 374 | 374 | 0 | aucune |
| Âge 31, sans conjoint | 368 | 368 | 0 | aucune |
| Âge 35, sans conjoint | 346 | 346 | 0 | aucune |
| Âge 40, sans conjoint | 319 | 319 | 0 | aucune |
| Âge 41, sans conjoint | 308 | 308 | 0 | aucune |
| Âge 44, sans conjoint | 275 | 275 | 0 | aucune |
| Âge 45, sans conjoint | 269 | 269 | 0 | aucune |
| Âge 18, avec conjoint | 345 | 345 | 0 | aucune |
| Âge 30, avec conjoint | 350 | 350 | 0 | aucune |
| Âge 44, avec conjoint | 260 | 260 | 0 | aucune |

### Âge (tous les âges, avec et sans conjoint)

| Profil testé | Score 3M | Score IRCC | Écart | Correction |
| --- | ---: | ---: | ---: | --- |
| Âge 17, sans conjoint | 269 | 269 | 0 | aucune |
| Âge 17, avec conjoint | 255 | 255 | 0 | aucune |
| Âge 18, sans conjoint | 368 | 368 | 0 | aucune |
| Âge 18, avec conjoint | 345 | 345 | 0 | aucune |
| Âge 19, sans conjoint | 374 | 374 | 0 | aucune |
| Âge 19, avec conjoint | 350 | 350 | 0 | aucune |
| Âge 20, sans conjoint | 379 | 379 | 0 | aucune |
| Âge 20, avec conjoint | 355 | 355 | 0 | aucune |
| Âge 21, sans conjoint | 379 | 379 | 0 | aucune |
| Âge 21, avec conjoint | 355 | 355 | 0 | aucune |
| Âge 22, sans conjoint | 379 | 379 | 0 | aucune |
| Âge 22, avec conjoint | 355 | 355 | 0 | aucune |
| Âge 23, sans conjoint | 379 | 379 | 0 | aucune |
| Âge 23, avec conjoint | 355 | 355 | 0 | aucune |
| Âge 24, sans conjoint | 379 | 379 | 0 | aucune |
| Âge 24, avec conjoint | 355 | 355 | 0 | aucune |
| Âge 25, sans conjoint | 379 | 379 | 0 | aucune |
| Âge 25, avec conjoint | 355 | 355 | 0 | aucune |
| Âge 26, sans conjoint | 379 | 379 | 0 | aucune |
| Âge 26, avec conjoint | 355 | 355 | 0 | aucune |
| Âge 27, sans conjoint | 379 | 379 | 0 | aucune |
| Âge 27, avec conjoint | 355 | 355 | 0 | aucune |
| Âge 28, sans conjoint | 379 | 379 | 0 | aucune |
| Âge 28, avec conjoint | 355 | 355 | 0 | aucune |
| Âge 29, sans conjoint | 379 | 379 | 0 | aucune |
| Âge 29, avec conjoint | 355 | 355 | 0 | aucune |
| Âge 30, sans conjoint | 374 | 374 | 0 | aucune |
| Âge 30, avec conjoint | 350 | 350 | 0 | aucune |
| Âge 31, sans conjoint | 368 | 368 | 0 | aucune |
| Âge 31, avec conjoint | 345 | 345 | 0 | aucune |
| Âge 32, sans conjoint | 363 | 363 | 0 | aucune |
| Âge 32, avec conjoint | 340 | 340 | 0 | aucune |
| Âge 33, sans conjoint | 357 | 357 | 0 | aucune |
| Âge 33, avec conjoint | 335 | 335 | 0 | aucune |
| Âge 34, sans conjoint | 352 | 352 | 0 | aucune |
| Âge 34, avec conjoint | 330 | 330 | 0 | aucune |
| Âge 35, sans conjoint | 346 | 346 | 0 | aucune |
| Âge 35, avec conjoint | 325 | 325 | 0 | aucune |
| Âge 36, sans conjoint | 341 | 341 | 0 | aucune |
| Âge 36, avec conjoint | 320 | 320 | 0 | aucune |
| Âge 37, sans conjoint | 335 | 335 | 0 | aucune |
| Âge 37, avec conjoint | 315 | 315 | 0 | aucune |
| Âge 38, sans conjoint | 330 | 330 | 0 | aucune |
| Âge 38, avec conjoint | 310 | 310 | 0 | aucune |
| Âge 39, sans conjoint | 324 | 324 | 0 | aucune |
| Âge 39, avec conjoint | 305 | 305 | 0 | aucune |
| Âge 40, sans conjoint | 319 | 319 | 0 | aucune |
| Âge 40, avec conjoint | 300 | 300 | 0 | aucune |
| Âge 41, sans conjoint | 308 | 308 | 0 | aucune |
| Âge 41, avec conjoint | 290 | 290 | 0 | aucune |
| Âge 42, sans conjoint | 297 | 297 | 0 | aucune |
| Âge 42, avec conjoint | 280 | 280 | 0 | aucune |
| Âge 43, sans conjoint | 286 | 286 | 0 | aucune |
| Âge 43, avec conjoint | 270 | 270 | 0 | aucune |
| Âge 44, sans conjoint | 275 | 275 | 0 | aucune |
| Âge 44, avec conjoint | 260 | 260 | 0 | aucune |
| Âge 45, sans conjoint | 269 | 269 | 0 | aucune |
| Âge 45, avec conjoint | 255 | 255 | 0 | aucune |

### Niveau d’études

| Profil testé | Score 3M | Score IRCC | Écart | Correction |
| --- | ---: | ---: | ---: | --- |
| Études : less_than_secondary, CLB 9 | 234 | 234 | 0 | aucune |
| Études : secondary, CLB 9 | 264 | 264 | 0 | aucune |
| Études : one_year_postsecondary, CLB 9 | 349 | 349 | 0 | aucune |
| Études : two_year_postsecondary, CLB 9 | 357 | 357 | 0 | aucune |
| Études : bachelor_or_three_year, CLB 9 | 379 | 379 | 0 | aucune |
| Études : two_or_more_credentials, CLB 9 | 412 | 412 | 0 | aucune |
| Études : master_or_professional, CLB 9 | 419 | 419 | 0 | aucune |
| Études : doctoral, CLB 9 | 434 | 434 | 0 | aucune |
| Études : bachelor_or_three_year, avec conjoint | 355 | 355 | 0 | aucune |
| Études : doctoral, avec conjoint | 408 | 408 | 0 | aucune |

### Langue : CELPIP, tous les niveaux

| Profil testé | Score 3M | Score IRCC | Écart | Correction |
| --- | ---: | ---: | ---: | --- |
| CELPIP CLB 10 partout | 391 | 391 | 0 | aucune |
| CELPIP CLB 9 partout | 379 | 379 | 0 | aucune |
| CELPIP CLB 8 partout | 335 | 335 | 0 | aucune |
| CELPIP CLB 7 partout | 311 | 311 | 0 | aucune |
| CELPIP CLB 6 partout | 266 | 266 | 0 | aucune |
| CELPIP CLB 5 partout | 254 | 254 | 0 | aucune |
| CELPIP CLB 4 partout | 254 | 254 | 0 | aucune |
| CELPIP < CLB 4 partout | 230 | 230 | 0 | aucune |

### Langue : chaque tranche de chaque compétence de chaque test

| Profil testé | Score 3M | Score IRCC | Écart | Correction |
| --- | ---: | ---: | ---: | --- |
| celpip : tranches (0/2/4/6) oral/écoute/lecture/écrit | 302 | 302 | 0 | aucune |
| celpip : tranches (1/3/5/7) oral/écoute/lecture/écrit | 284 | 284 | 0 | aucune |
| celpip : tranches (2/4/6/0) oral/écoute/lecture/écrit | 302 | 302 | 0 | aucune |
| celpip : tranches (3/5/7/1) oral/écoute/lecture/écrit | 284 | 284 | 0 | aucune |
| celpip : tranches (4/6/0/2) oral/écoute/lecture/écrit | 302 | 302 | 0 | aucune |
| celpip : tranches (5/7/1/3) oral/écoute/lecture/écrit | 284 | 284 | 0 | aucune |
| celpip : tranches (6/0/2/4) oral/écoute/lecture/écrit | 302 | 302 | 0 | aucune |
| celpip : tranches (7/1/3/5) oral/écoute/lecture/écrit | 284 | 284 | 0 | aucune |
| ielts : tranches (0/2/4/6) oral/écoute/lecture/écrit | 302 | 302 | 0 | aucune |
| ielts : tranches (1/3/5/7) oral/écoute/lecture/écrit | 284 | 284 | 0 | aucune |
| ielts : tranches (2/4/6/0) oral/écoute/lecture/écrit | 302 | 302 | 0 | aucune |
| ielts : tranches (3/5/7/1) oral/écoute/lecture/écrit | 284 | 284 | 0 | aucune |
| ielts : tranches (4/6/0/2) oral/écoute/lecture/écrit | 302 | 302 | 0 | aucune |
| ielts : tranches (5/7/1/3) oral/écoute/lecture/écrit | 284 | 284 | 0 | aucune |
| ielts : tranches (6/0/2/4) oral/écoute/lecture/écrit | 302 | 302 | 0 | aucune |
| ielts : tranches (7/1/3/5) oral/écoute/lecture/écrit | 284 | 284 | 0 | aucune |
| pte_core : tranches (0/2/4/6) oral/écoute/lecture/écrit | 302 | 302 | 0 | aucune |
| pte_core : tranches (1/3/5/7) oral/écoute/lecture/écrit | 284 | 284 | 0 | aucune |
| pte_core : tranches (2/4/6/0) oral/écoute/lecture/écrit | 302 | 302 | 0 | aucune |
| pte_core : tranches (3/5/7/1) oral/écoute/lecture/écrit | 284 | 284 | 0 | aucune |
| pte_core : tranches (4/6/0/2) oral/écoute/lecture/écrit | 302 | 302 | 0 | aucune |
| pte_core : tranches (5/7/1/3) oral/écoute/lecture/écrit | 284 | 284 | 0 | aucune |
| pte_core : tranches (6/0/2/4) oral/écoute/lecture/écrit | 302 | 302 | 0 | aucune |
| pte_core : tranches (7/1/3/5) oral/écoute/lecture/écrit | 284 | 284 | 0 | aucune |
| tef_canada : tranches (0/2/4/6) oral/écoute/lecture/écrit | 302 | 302 | 0 | aucune |
| tef_canada : tranches (1/3/5/7) oral/écoute/lecture/écrit | 284 | 284 | 0 | aucune |
| tef_canada : tranches (2/4/6/0) oral/écoute/lecture/écrit | 302 | 302 | 0 | aucune |
| tef_canada : tranches (3/5/7/1) oral/écoute/lecture/écrit | 284 | 284 | 0 | aucune |
| tef_canada : tranches (4/6/0/2) oral/écoute/lecture/écrit | 302 | 302 | 0 | aucune |
| tef_canada : tranches (5/7/1/3) oral/écoute/lecture/écrit | 284 | 284 | 0 | aucune |
| tef_canada : tranches (6/0/2/4) oral/écoute/lecture/écrit | 302 | 302 | 0 | aucune |
| tef_canada : tranches (7/1/3/5) oral/écoute/lecture/écrit | 284 | 284 | 0 | aucune |
| tcf_canada : tranches (0/2/4/6) oral/écoute/lecture/écrit | 302 | 302 | 0 | aucune |
| tcf_canada : tranches (1/3/5/7) oral/écoute/lecture/écrit | 284 | 284 | 0 | aucune |
| tcf_canada : tranches (2/4/6/0) oral/écoute/lecture/écrit | 302 | 302 | 0 | aucune |
| tcf_canada : tranches (3/5/7/1) oral/écoute/lecture/écrit | 284 | 284 | 0 | aucune |
| tcf_canada : tranches (4/6/0/2) oral/écoute/lecture/écrit | 302 | 302 | 0 | aucune |
| tcf_canada : tranches (5/7/1/3) oral/écoute/lecture/écrit | 284 | 284 | 0 | aucune |
| tcf_canada : tranches (6/0/2/4) oral/écoute/lecture/écrit | 302 | 302 | 0 | aucune |
| tcf_canada : tranches (7/1/3/5) oral/écoute/lecture/écrit | 284 | 284 | 0 | aucune |

### Langue : tests IELTS, PTE Core, TEF Canada, TCF Canada

| Profil testé | Score 3M | Score IRCC | Écart | Correction |
| --- | ---: | ---: | ---: | --- |
| ielts CLB 10 partout | 391 | 391 | 0 | aucune |
| ielts CLB 9 partout | 379 | 379 | 0 | aucune |
| ielts CLB 8 partout | 335 | 335 | 0 | aucune |
| ielts CLB 7 partout | 311 | 311 | 0 | aucune |
| ielts CLB 6 partout | 266 | 266 | 0 | aucune |
| ielts CLB 4 partout | 254 | 254 | 0 | aucune |
| pte_core CLB 10 partout | 391 | 391 | 0 | aucune |
| pte_core CLB 9 partout | 379 | 379 | 0 | aucune |
| pte_core CLB 8 partout | 335 | 335 | 0 | aucune |
| pte_core CLB 7 partout | 311 | 311 | 0 | aucune |
| pte_core CLB 6 partout | 266 | 266 | 0 | aucune |
| pte_core CLB 4 partout | 254 | 254 | 0 | aucune |
| tef_canada CLB 10 partout | 416 | 416 | 0 | aucune |
| tef_canada CLB 9 partout | 404 | 404 | 0 | aucune |
| tef_canada CLB 8 partout | 360 | 360 | 0 | aucune |
| tef_canada CLB 7 partout | 336 | 336 | 0 | aucune |
| tef_canada CLB 6 partout | 266 | 266 | 0 | aucune |
| tef_canada CLB 4 partout | 254 | 254 | 0 | aucune |
| tcf_canada CLB 10 partout | 416 | 416 | 0 | aucune |
| tcf_canada CLB 9 partout | 404 | 404 | 0 | aucune |
| tcf_canada CLB 8 partout | 360 | 360 | 0 | aucune |
| tcf_canada CLB 7 partout | 336 | 336 | 0 | aucune |
| tcf_canada CLB 6 partout | 266 | 266 | 0 | aucune |
| tcf_canada CLB 4 partout | 254 | 254 | 0 | aucune |

### Français, seconde langue et bonus

| Profil testé | Score 3M | Score IRCC | Écart | Correction |
| --- | ---: | ---: | ---: | --- |
| TEF NCLC 7 seul (pas d'anglais) → bonus 25 | 336 | 336 | 0 | aucune |
| TEF NCLC 7 + IELTS CLB 5 partout → bonus 50 | 365 | 365 | 0 | aucune |
| TEF NCLC 7 + IELTS CLB 5/5/5/4 (mixte) | 339 | 339 | 0 | aucune |
| TEF NCLC 7/7/7/6 → aucun bonus | 290 | 290 | 0 | aucune |
| TEF NCLC 7 + IELTS CLB 4 partout → bonus 25 | 336 | 336 | 0 | aucune |
| CELPIP 9 + TCF NCLC 7 (seconde langue) → bonus 50 | 441 | 441 | 0 | aucune |
| CELPIP 9 + TCF NCLC 9 (seconde langue : points + bonus) | 453 | 453 | 0 | aucune |
| CELPIP 9 + TCF NCLC 7/7/7/6 (seconde langue, pas de bonus) | 389 | 389 | 0 | aucune |
| CELPIP 9 + TEF NCLC 5 (seconde langue, 1 pt/compétence) | 383 | 383 | 0 | aucune |
| TEF NCLC 9 + CELPIP 9 (français d'abord) | 453 | 453 | 0 | aucune |
| TCF NCLC 7 + PTE CLB 7 + 2 ans au Canada | 451 | 451 | 0 | aucune |

### Expérience canadienne

| Profil testé | Score 3M | Score IRCC | Écart | Correction |
| --- | ---: | ---: | ---: | --- |
| 0 an(s) d'expérience canadienne, CLB 7 | 208 | 208 | 0 | aucune |
| 1 an(s) d'expérience canadienne, CLB 7 | 248 | 248 | 0 | aucune |
| 2 an(s) d'expérience canadienne, CLB 7 | 261 | 261 | 0 | aucune |
| 3 an(s) d'expérience canadienne, CLB 7 | 272 | 272 | 0 | aucune |
| 4 an(s) d'expérience canadienne, CLB 7 | 280 | 280 | 0 | aucune |
| 5 an(s) d'expérience canadienne, CLB 7 | 288 | 288 | 0 | aucune |

### Profession à salaire élevé

| Profil testé | Score 3M | Score IRCC | Écart | Correction |
| --- | ---: | ---: | ---: | --- |
| 3 ans au Canada + salaire élevé ×2 | 342 | 342 | 0 | aucune |
| 3 ans au Canada + salaire élevé ×1.5 | 312 | 312 | 0 | aucune |
| 3 ans au Canada + salaire élevé ×1.3 | 292 | 292 | 0 | aucune |

### Offre d’emploi et facteur d’intégration au marché du travail

| Profil testé | Score 3M | Score IRCC | Écart | Correction |
| --- | ---: | ---: | ---: | --- |
| Offre d'emploi à salaire élevé ×1.5 seule | 278 | 278 | 0 | aucune |
| Offre d'emploi à salaire élevé ×1.3 seule | 258 | 258 | 0 | aucune |
| 1 an + salaire élevé ×1,3 (60) contre offre ×2 (100) → l'offre l'emporte | 308 | 308 | 0 | aucune |
| Offre d'emploi à salaire élevé ×2 seule | 308 | 308 | 0 | aucune |
| 5 ans + salaire élevé ×2 (150) contre offre ×2 (100) → l'expérience l'emporte | 358 | 358 | 0 | aucune |
| avec conjoint : 5 ans + salaire élevé ×2 | 334 | 334 | 0 | aucune |
| avec conjoint : offre ×2 seule | 294 | 294 | 0 | aucune |

### Expérience étrangère et transférabilité

| Profil testé | Score 3M | Score IRCC | Écart | Correction |
| --- | ---: | ---: | ---: | --- |
| 0 an(s) à l'étranger, CLB 7 | 338 | 338 | 0 | aucune |
| 0 an(s) à l'étranger, CLB 9 | 419 | 419 | 0 | aucune |
| 1 an(s) à l'étranger, CLB 7 | 351 | 351 | 0 | aucune |
| 1 an(s) à l'étranger, CLB 9 | 444 | 444 | 0 | aucune |
| 2 an(s) à l'étranger, CLB 7 | 351 | 351 | 0 | aucune |
| 2 an(s) à l'étranger, CLB 9 | 444 | 444 | 0 | aucune |
| 3 an(s) à l'étranger, CLB 7 | 363 | 363 | 0 | aucune |
| 3 an(s) à l'étranger, CLB 9 | 469 | 469 | 0 | aucune |
| 3 ans à l'étranger + 1 an au Canada | 241 | 241 | 0 | aucune |
| 3 ans à l'étranger + 2 ans au Canada | 279 | 279 | 0 | aucune |
| 2 ans à l'étranger + 2 ans au Canada + CLB 9 + maîtrise (plafonds) | 522 | 522 | 0 | aucune |

### Certificat de compétence

| Profil testé | Score 3M | Score IRCC | Écart | Correction |
| --- | ---: | ---: | ---: | --- |
| Certificat de qualification, CLB 5 | 189 | 189 | 0 | aucune |
| Certificat de qualification, CLB 6 | 201 | 201 | 0 | aucune |
| Certificat de qualification, CLB 7 | 258 | 258 | 0 | aucune |
| Certificat de qualification, CLB 9 | 314 | 314 | 0 | aucune |
| Certificat + CLB 5/5/5/4 (mixte) | 164 | 164 | 0 | aucune |

### Points supplémentaires et plafond de 600

| Profil testé | Score 3M | Score IRCC | Écart | Correction |
| --- | ---: | ---: | ---: | --- |
| Diplôme canadien : one_two_year | 394 | 394 | 0 | aucune |
| Diplôme canadien : three_year_or_more | 409 | 409 | 0 | aucune |
| Diplôme canadien : secondary_or_less | 379 | 379 | 0 | aucune |
| Frère ou sœur au Canada | 394 | 394 | 0 | aucune |
| Désignation provinciale seule | 979 | 979 | 0 | aucune |
| Désignation + français + diplôme canadien + fratrie (plafond 600) | 1003 | 1003 | 0 | aucune |

### Conjoint et état matrimonial

| Profil testé | Score 3M | Score IRCC | Écart | Correction |
| --- | ---: | ---: | ---: | --- |
| Conjoint : études secondaires, aucun test, 0 an | 355 | 355 | 0 | aucune |
| Conjoint : licence | 361 | 361 | 0 | aucune |
| Conjoint : maîtrise | 363 | 363 | 0 | aucune |
| Conjoint : doctorat | 363 | 363 | 0 | aucune |
| Conjoint : CELPIP CLB 9 | 375 | 375 | 0 | aucune |
| Conjoint : CELPIP CLB 7 | 367 | 367 | 0 | aucune |
| Conjoint : CELPIP CLB 5 | 359 | 359 | 0 | aucune |
| Conjoint : CELPIP CLB 4 | 355 | 355 | 0 | aucune |
| Conjoint : TEF NCLC 9 | 375 | 375 | 0 | aucune |
| Conjoint : 1 an(s) au Canada | 360 | 360 | 0 | aucune |
| Conjoint : 3 an(s) au Canada | 363 | 363 | 0 | aucune |
| Conjoint : 5 an(s) au Canada | 365 | 365 | 0 | aucune |
| Conjoint citoyen ou résident permanent → barème « sans conjoint » | 379 | 379 | 0 | aucune |
| Conjoint qui ne vous accompagne pas → barème « sans conjoint » | 379 | 379 | 0 | aucune |
| Conjoint de fait avec conjoint complet (études, langue, expérience) | 393 | 393 | 0 | aucune |
| État matrimonial : divorced | 379 | 379 | 0 | aucune |
| État matrimonial : widowed | 379 | 379 | 0 | aucune |
| État matrimonial : annulled | 379 | 379 | 0 | aucune |
| État matrimonial : legally_separated | 379 | 379 | 0 | aucune |

### Scénarios « Comparer deux scénarios »

| Profil testé | Score 3M | Score IRCC | Écart | Correction |
| --- | ---: | ---: | ---: | --- |
| Scénario A : TCF Canada NCLC 9 partout, maîtrise, 29 ans | 444 | 444 | 0 | aucune |
| Scénario B1 : seule l'expression orale passe à NCLC 10 | 447 | 447 | 0 | aucune |
| Scénario B2 : seule l'expression orale tombe à NCLC 7 | 405 | 405 | 0 | aucune |

### Profils extrêmes

| Profil testé | Score 3M | Score IRCC | Écart | Correction |
| --- | ---: | ---: | ---: | --- |
| Profil maximal (doctorat, 25 ans, CELPIP 10 + TEF NCLC 10, 5 ans + salaire ×2, certificat, désignation…) | 1270 | 1270 | 0 | aucune |
| Profil le plus faible (< CLB 4, sans diplôme, 45 ans) | 0 | 0 | 0 | aucune |
| Profil maximal avec conjoint | 1270 | 1270 | 0 | aucune |
