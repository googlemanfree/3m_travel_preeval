# Validation — suivi de dossier et persistance de session

## Changements validés

Le parcours client connecté ouvre désormais son dossier associé depuis `/mon-dossier` sans transmettre l’adresse e-mail dans l’URL. Le champ numéro de dossier est prérempli depuis le dossier associé et la requête de suivi utilise l’adresse du compte uniquement côté navigateur.

Le point d’accès de suivi numéro + e-mail fournit une réponse identique pour une référence introuvable ou un e-mail non correspondant. Il ne retourne plus les liens de documents, les notes internes ou des scores. Cette restriction ne remplace pas les contrôles des espaces connectés.

Les sessions candidat et administrateur utilisent déjà des jetons ou cookies serveur à durée de 24 heures. Le délai de déconnexion global de 15 minutes a été remplacé par une échéance fixe de 24 heures persistée dans le navigateur ; l’activité ne prolonge pas ce délai et une déconnexion manuelle reste immédiate.

## Contrôles exécutés

| Contrôle | Résultat |
|---|---|
| `pnpm exec tsc --noEmit` | Réussi |
| Régressions Vitest ciblées | 9 tests réussis dans 2 fichiers |
| Rendu non connecté de `/mon-dossier` | Écran d’accès sécurisé, sans données de dossier visibles |
| Journaux de développement après consultation | Aucune erreur pertinente détectée |

## Limite de l’environnement

La construction `pnpm run build` a été interrompue trois fois par la limite mémoire du bac à sable pendant la phase de transformation Vite. Les contrôles TypeScript et Vitest réussissent ; la limitation est documentée comme environnementale et devra être rejouée depuis une instance disposant de davantage de mémoire si une validation de build complète est requise.
