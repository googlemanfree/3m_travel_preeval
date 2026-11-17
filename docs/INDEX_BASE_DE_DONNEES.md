# Index recommandés pour la base de données

**À appliquer par l'hébergeur (Manus), pas par l'application** : la base réelle n'est jamais modifiée par le code de ce dépôt.

## Pourquoi

Les tables les plus lues par l'administration n'ont **aucun index** en dehors de leur clé primaire et de quelques colonnes uniques (`candidates.email`, `evaluations.referenceCode`, `applications.dossierNumber`, `agency_settings.settingKey`) :
`client_documents`, `candidate_files`, `agency_dossiers` n'en ont pas du tout, et `applications` n'en a pas sur `candidateId`, `email` ni `deletedAt`. Tant que les tables comptent quelques milliers de lignes, la base les parcourt en entier sans que cela se voie. Au-delà de quelques dizaines de milliers de lignes, chaque affichage de liste, chaque fiche 360° et chaque compteur la parcourt à chaque fois.

## Ce qu'ils accélèrent

| Index | Table | Requêtes concernées |
|---|---|---|
| `idx_client_documents_evaluation` | `client_documents` | documents d'une évaluation, aperçu des documents |
| `idx_client_documents_email_type` | `client_documents` | nombre de documents par adresse, CV déposé à l'évaluation |
| `idx_candidate_files_candidate_type` | `candidate_files` | pièces et CV d'un compte (comptes à ouvrir, fiche 360°) |
| `idx_applications_candidate` | `applications` | dossier en ligne d'un compte (activation, paiements, fiche 360°) |
| `idx_applications_email` | `applications` | recherche par adresse exacte |
| `idx_applications_deleted_created` | `applications` | liste triée par date hors corbeille |
| `idx_agency_dossiers_email`, `idx_agency_dossiers_deleted_created` | `agency_dossiers` | idem pour les dossiers agence |
| `idx_evaluations_email`, `idx_evaluations_candidate` | `evaluations` | évaluations d'une adresse ou d'un compte |
| `idx_candidates_status_deleted_created` | `candidates` | liste des comptes à ouvrir |

## Limites à connaître

- Plusieurs rapprochements par adresse du code utilisent `LOWER(email)`, pour ne pas dépendre de la casse. Un index simple sur `email` **ne sert pas** à une comparaison écrite `LOWER(email) = …` : ces rapprochements sont déjà faits par des sous-requêtes que la base calcule une fois, et ne dépendent pas de ces index. Les index d'adresse aident les recherches par adresse exacte.
- Les index ralentissent légèrement les écritures (quelques pour cent) et occupent de la place : ici, onze petits index.
- Aucune mesure de gain chiffrée n'est donnée : la base de test n'a que quelques milliers de lignes. Ce qui est vérifié, c'est que la base **utilise** ces index (plan d'exécution en `ref` au lieu d'un parcours complet) et que les tests sur base réelle passent avec et sans eux.

## Comment les appliquer

1. Sauvegarde de la base (habituelle).
2. Hors des heures de pointe, exécuter `scripts/sql/indexes-recommandes.sql` instruction par instruction. Si un index existe déjà, la base répond « Duplicate key name » : passer à la suivante.
3. Vérifier : `EXPLAIN SELECT COUNT(*) FROM client_documents WHERE evaluationId = 5;` doit afficher `key = idx_client_documents_evaluation`.
4. Retour arrière possible à tout moment : `scripts/sql/indexes-recommandes-retour.sql` (aucune donnée n'est touchée).
