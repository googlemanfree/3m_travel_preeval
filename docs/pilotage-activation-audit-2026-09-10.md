# Audit Pilotage et règle d’activation — 2026-09-10

## Points d’entrée d’activation identifiés

Le point serveur principal d’ouverture du dossier est `adminCandidateManagement.activatePreDossierAccount` dans `server/routers/adminCandidateManagement.ts`. Il contrôle déjà l’évaluation validée et le paiement : `applications.paymentStatus === "SUCCESS"` ou un dossier agence non supprimé dont `initialPaymentStatus === "paid"`. En l’absence de paiement, il renvoie explicitement `Le paiement doit être confirmé avant l’ouverture du dossier officiel.`.

Le même point traite le rattachement d’un compte candidat à un pré-dossier agence et met à jour le statut candidat vers `documents`. Les branches de création de dossier d’évaluation dans `unifiedRequests.ts` restent provisoires et conservent `dossierStatus: "nouveau"`, elles ne doivent donc pas être considérées comme une activation.

Les changements d’état d’évaluation et de livraison de bilan dans `evaluationAdmin.ts` et `unifiedRequests.ts` font progresser le traitement mais ne doivent pas contourner le verrou d’activation. Les mutations de paiement de `payment.ts` et `adminCandidateManagement.ts` restent les sources de vérité pour les statuts `SUCCESS`/`paid`.

## Actions Pilotage recensées

Les actions visibles dans `AdminDashboard.tsx` comprennent la mise à jour et l’annulation de statut, l’activation du pré-dossier, la validation de déclaration d’évaluation, la validation hors ligne, la confirmation de paiement, l’import agence, l’ajout de document de destination, l’export d’activité, la génération de réponses, la réinitialisation de mots de passe, la déconnexion, les changements Kanban, la mise à jour de commission et l’effacement de cache de recherche. Les composants `Candidate360Workspace.tsx` et `AdminPlacementPipeline.tsx` ajoutent les actions de pilotage d’échéance, synchronisation, ajout d’action, préparation de profil, soumission, reçus, relances, protocoles et validations.

## Règle retenue

Toute mutation qui transforme réellement un dossier en état actif ou opérationnel doit vérifier côté serveur un paiement validé par un administrateur avant toute écriture. Un échec doit être retourné comme une erreur métier explicite et l’interface doit réarmer le bouton après la fin de la requête. Les actions provisoires de préparation ou d’évaluation ne doivent pas être confondues avec l’activation du dossier.
