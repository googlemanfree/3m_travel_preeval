# Audit interne — contrôle administrateur de l’espace client

Date de l’audit : 2026-09-05.

## Conclusion

Le back-office dispose d’un contrôle opérationnel large sur les dossiers candidats, mais il ne s’agit pas d’un accès indistinct à toutes les données. Les actions Candidate360 exigent un `sessionToken` administrateur vérifié par `requireValidAdminSession`, même lorsque la procédure tRPC est déclarée `publicProcedure` pour conserver le transport de session local.

| Domaine | Actions repérées | Contrôle observé | Test destructif exécuté |
|---|---|---|---|
| Parcours et pilotage | Mise à jour du workflow, échéance, ajout/complétion de tâches | Session admin + dossier résolu + journalisation | Non |
| Documents | Checklist pays, rappels de pièces, échéances de clarification, messages avec pièces | Session admin + rattachement au dossier source | Non |
| Évaluation | Rappel d’évaluation, extraction CV, préparation du bilan et validation humaine | Session admin ou garde spécifique du routeur | Non |
| Communication | Message candidat, e-mail de rappel, réponses de clarification | Session admin + dossier et adresse résolus | Non |
| Paiement | Confirmation/rejet, référence facultative, montant, validation humaine, conseiller et horodatage | Mutation admin et audit paiement | Aucun paiement réel confirmé |
| Statut du dossier | Avancement et retour contrôlé d’étape | Mutation admin avec séquence d’étapes | Non |
| Suppression | Une suppression de pré-dossier agence existe dans le module dédié avec confirmation explicite et corbeille | Route protégée, confirmation `SUPPRIMER`, motif | Non |

## Rafraîchissement post-paiement

Le composant de paiement appelle désormais le callback parent après une mutation réussie et fermeture du modal. Le tableau de bord invalide `listCandidates` et `listApplications`; la liste doit donc refléter le nouveau statut sans rechargement manuel. Cette modification est couverte par les régressions ciblées et a été publiée.

## Limites de vérification live

La session admin externe n’était pas disponible de manière stable pendant cette passe. Les contrôles sensibles n’ont donc pas été déclenchés sur un dossier réel. La vérification manuelle recommandée est : ouvrir `/admin`, aller à **Paiements**, confirmer un dossier de test, fermer le modal et vérifier que la liste change sans actualisation de page ; ouvrir ensuite la fiche candidat et vérifier les actions de pilotage, documents, évaluation et messages. Aucune suppression ne doit être testée sur un dossier réel.
