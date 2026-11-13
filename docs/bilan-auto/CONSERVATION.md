# Politique de conservation et de suppression — proposition à valider

Configurable : `shared/bilanAuto/retention.ts`. **Aucune purge n'existe ni n'est activée** : le module ne fait que simuler (`planRetention`), il n'exécute rien. La politique reste « non approuvée » tant que `approvedAt`/`approvedBy` sont vides.

| Catégorie | Durée proposée | Point de départ | Justification | À vérifier |
|---|---|---|---|---|
| Dossiers actifs | tant que le dossier est en cours | — | Finalité en cours | Définition d'« actif » |
| Dossiers inactifs ou abandonnés | 12 mois | dernière activité | Temps de reprise raisonnable ; préavis de 30 jours avant suppression | Durée ; relance avant suppression |
| CV et justificatifs | 12 mois | clôture ou dernière activité | Données les plus sensibles : durée la plus courte compatible avec le suivi | Obligations liées à la prestation (contrat, paiement) |
| Bilans et historique de notes | 24 mois | publication | Rappel d'évaluation antérieure, réexamen | Durée plus longue éventuelle pour une réclamation |
| Journaux techniques | 90 jours | événement | Diagnostic ; aucun CV (références et empreintes seulement) | Journal d'audit des corrections : durée à décider |
| Sauvegardes | 35 jours (rotation) | sauvegarde | Une suppression disparaît des sauvegardes à la fin de la rotation | Rotation réelle de l'hébergeur |

Ces durées sont des **propositions de gestion**, pas des durées légales. Les obligations de conservation (comptabilité, fiscalité, contentieux, droit applicable au Cameroun, en France ou ailleurs) sont à vérifier avec le conseil de l'agence avant approbation.

## Demande de suppression ou de rectification
- Depuis l'espace client : la carte « Mes données » existante (demande tracée). Auprès de l'agence : e-mail à hello@3mtravelagency.com.
- **Rectification** : le candidat corrige son formulaire ou redépose un document → nouvelle version des entrées → nouveau traitement (l'ancien est « remplacé » et conservé dans l'historique).
- **Réexamen** : sur demande, relance d'un traitement par l'administrateur (« Relancer ») ; aucun score ne ferme un compte ni n'interdit une demande.
- **Suppression** : `adminBilanAuto.eraseCandidateData` (confirmation « SUPPRIMER ») efface traitements, journal et outbox du candidat et renvoie la liste des PDF à retirer. Elle n'est **pas** branchée automatiquement sur la demande de suppression existante : à relier après approbation de la politique.

## Suppressions chez les prestataires (à exécuter ou obtenir)
Stockage Forge : les PDF (`bilan-auto/<évaluation>/…`) et le CV — le dépôt n'expose aucune suppression, à demander au prestataire ou à ajouter. Fournisseur de modèle (via la passerelle) : demander la suppression ou la non-conservation des requêtes. Serveur SMTP et boîte d'envoi : copies des e-mails (sans détail du bilan). Sauvegardes de base : expiration par rotation.
