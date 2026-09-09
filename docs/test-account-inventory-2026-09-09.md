# Inventaire DB des comptes et dossiers de test — 2026-09-09

## Périmètre et sécurité

Recherche en lecture seule sur `user_accounts`, `users`, `candidates`, `evaluations`, `applications` et `agency_dossiers`. Motifs utilisés, insensibles à la casse : `test`, `qa`, `e2e`, `invalid.test`, `example.com`. Aucune suppression, restauration, déplacement ou modification n’a été exécutée. Les dossiers réels signalés par l’utilisateur sont exclus de toute action et restent inchangés.

## Agrégats observés

| Table | Lignes correspondantes | E-mails distincts |
|---|---:|---:|
| `user_accounts` | 0 | 0 |
| `users` | 0 | 0 |
| `candidates` | 1 | 1 |
| `evaluations` | 2 095 | 5 |
| `applications` | 2 | 2 |
| `agency_dossiers` | 1 | 1 |

La table `evaluations` contient un volume important de lignes synthétiques répétées autour de cinq e-mails ; il ne faut pas interpréter ce volume comme cinq dossiers actifs distincts sans regroupement/validation supplémentaire.

## Lignes de dossier identifiables

| Type | Identifiant | Référence | Nom | E-mail | Observations |
|---|---:|---|---|---|---|
| Candidate | 1140001 | `COMPTE-11400` | TEST INTERNE — Évaluation externe | `test.evaluation.preinscription@invalid.test` | Compte test explicite |
| Application | 480001 | `EVAL-DRAFT-2026-1223` | TEST INTERNE — Évaluation externe | `test.evaluation.preinscription@invalid.test` | Dossier de test explicitement utilisé pour le clic réel |
| Application | 450001 | `EVAL-AG-420001` | TEST E2E QA 2026 | `qa.e2e.20260903@example.com` | Dossier test QA/E2E |
| Agency dossier | 420001 | `3M-AGN-420001` | TEST E2E QA 2026 | `qa.e2e.20260903@example.com` | Pré-dossier agence test QA/E2E |

Les évaluations synthétiques sont regroupées par nom/e-mail dans la requête DB. Les identifiants sont très nombreux et répétitifs ; une opération de corbeille ne doit pas être lancée avant validation humaine d’un export complet et déduplication par e-mail/référence.

## Dossier agence 3M-AGN-270002

La requête ciblée a trouvé : `id=270002`, référence `3M-AGN-270002`, candidat **SIEWE TCHAKOUA Louis Valere**, e-mail `louistchakoua4@gmail.com`, destination `luxembourg`, procédure `Travail`, statut agence `en_cours`, `initialPaymentStatus=paid`, validation d’évaluation agence encore nulle dans les colonnes dédiées au moment de la lecture. Un compte candidat existe et correspond exactement par e-mail : `candidates.id=810001`, même nom et même e-mail.

Conclusion technique : l’erreur historique « Compte candidat introuvable » ne correspond pas à l’état actuel de la base pour ce dossier ; elle a probablement résulté d’un rattachement absent, d’un e-mail non normalisé ou d’un état antérieur. Le code a été renforcé avec comparaison `LOWER(TRIM(email))` et un fallback agence traçable qui ne dépend plus de la présence du compte candidat pour enregistrer la validation sur le dossier agence. Aucun clic ni mutation n’a été effectué sur ce dossier réel.

## Régressions publiques et protocole à contrôler

Le routeur client contient encore une redirection de `/evaluation-rapide-enhanced` vers `/#evaluation-multi`. La source partagée du protocole est la version enrichie `AGREEMENT_PROTOCOL_VERSION = 2026-09-08-v2`, avec un modèle initial détaillé et un modèle distinct de second protocole. Le contrôle du badge `Aucun dossier actif` pour `aureoldonfack@gmail.com` nécessite une session client authentifiée ; aucun statut n’a été modifié pendant cet audit.
