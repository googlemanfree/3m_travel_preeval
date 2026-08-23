# Vérification publiée — évaluations pré-inscription

Date : 23 août 2026.

Le poste administrateur publié, consulté avec une session administrateur valide sur la version `3b1f3614`, affiche les onglets **Pré-dossiers** et **Activations**, ainsi que les fiches des comptes créés avant ouverture de dossier. Les dossiers existants affichés avec une évaluation en cours ne sont pas modifiés par cette vérification.

Le workflow publié prévoit désormais que toute évaluation déclarée comme déjà réalisée à l’inscription reste en état `pending_validation`. L’administrateur doit explicitement **valider**, **refuser** ou **demander une correction** avant l’activation du dossier. La décision, l’administrateur, l’horodatage et la note sont enregistrés et synchronisés vers le suivi candidat ; aucune validation ou activation automatique n’est exécutée.

La vue client détaillée reste accessible de façon sécurisée par numéro de dossier et e-mail. Aucun compte de test supplémentaire ni aucune modification de candidat réel n’a été effectuée au cours de ce contrôle visuel.

Un unique compte explicitement nommé `TEST INTERNE — Évaluation externe` a ensuite été créé avec une adresse interne non distribuable et un portrait validé, après confirmation explicite. La lecture de contrôle confirme l’état `dossierStatus = nouveau`, `evaluationDeclarationStatus = pending_validation`, une date de déclaration présente et aucune décision, note, identité de relecteur ou date de revue. Aucun dossier réel n’a été modifié et aucune activation, réservation ou paiement n’a été créé.

Le tableau de bord administrateur publié affiche ensuite ce compte sous `COMPTE-1140001`, avec le statut visible **Vérification requise**, l’activation **En attente** et l’étape **Évaluation 48h**. Cette preuve confirme que la déclaration externe ne fait pas avancer automatiquement le dossier et qu’elle est visible à l’équipe avant toute décision humaine.

La fiche 360° du compte interne affiche le bloc **Évaluation à vérifier**, la date de déclaration, un champ de note de décision et les trois commandes distinctes **Valider l’évaluation**, **Demander un complément** et **Refuser la déclaration**. Le bloc d’ouverture de dossier est toujours présent mais précise qu’il faut d’abord valider l’évaluation ou demander un complément. Aucune commande de décision n’a été activée durant ce contrôle.

Après confirmation explicite, l’action **Valider l’évaluation** a été utilisée sur ce seul compte interne. La fiche affiche désormais **Évaluation vérifiée** et l’ouverture de dossier devient disponible sans être exécutée. La lecture SQL confirme `evaluationDeclarationStatus = validated`, un horodatage de revue, l’e-mail du relecteur administrateur et le maintien de `dossierStatus = nouveau`. Aucun dossier n’a été ouvert, aucun candidat réel n’a été modifié et aucune communication, réservation ou paiement n’a été déclenché.
