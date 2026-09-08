# Test complet checklist et barre de progression — 2026-09-08

## Session réelle observée
URL : https://www.3mtravelagency.com/mon-espace?section=dossier

Le chargement réel avec une session candidate active affiche l’espace candidat sans erreur réseau persistante. Le parcours affiche « Parcours synchronisé », « Progression du parcours », une valeur de 41 % et un compteur de 7/17 étapes. La barre progressbar est visible au-dessus de « Ma checklist de procédure ». Les cases visibles sont associées à chaque étape et les étapes futures restent présentées avec le verrouillage prévu.

## Accès sans session
La capture locale sans session de `/mon-espace?section=dossier` affiche l’écran d’accès réservé avec les boutons de connexion et d’inscription, au lieu d’un écran bloqué indéfiniment.

## Tests automatisés
TypeScript passe sans erreur. Les fichiers `server/procedureChecklist.test.ts`, `server/candidateJourneyCatalog.test.ts` et `server/candidateDocumentChecklist.dynamic.test.ts` passent : 14 tests réussis.

## Limite du test de mutation
Aucune coche/décoche n’a été déclenchée sur le compte candidat réel observé afin de ne pas modifier les données d’un dossier réel sans confirmation explicite. La mutation et la persistance sont couvertes par les tests automatisés ; la vérification manuelle de coche puis actualisation doit être faite sur un dossier fictif ou de test autorisé.
