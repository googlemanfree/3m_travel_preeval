# Retest live Candidate360 — 2026-09-08

Après publication du fallback cookie et de `placeholderData`, le dashboard publié revient avec 32 dossiers. Le filtre `3M-AGN-270002` affiche bien une ligne unique : SIEWE TCHAKOUA Louis Valere, Luxembourg, source Agence, activation Activé, statut Collecte Documents, et évaluation validée.

En ouvrant la fiche, le panneau de décision et les boutons de paiement restent visibles, mais la zone principale affiche encore « La fiche 360° n’a pas pu être chargée. Réessayez depuis la liste des candidats. » Le paiement n’a pas été relancé et aucun protocole n’a été envoyé dans ce retest.

Constat : le fallback de session est actif, mais la résolution métier de `getCandidate360` pour ce dossier agence produit encore une erreur indépendante de la visibilité de la ligne. Prochaine correction : inspecter la résolution de `ensureOperationalCase`/référence agence et la réponse exacte de getCandidate360 sur `agency_270002`.
