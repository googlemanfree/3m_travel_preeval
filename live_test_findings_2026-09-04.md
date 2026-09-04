# Vérifications live — 4 septembre 2026

URL publiée : https://www.3mtravelagency.com/admin?check=account-alias-562d508b

Le back-office admin publié est accessible avec une session active. Après synchronisation, le filtre `COMPTE-1140001` affiche une ligne unique pour `TEST INTERNE — Évaluation externe`, e-mail `test.evaluation.preinscription@invalid.test`, destination Canada, statut Évaluation 48h. La réponse publiée de `admin.listCandidates` confirme `total: 1`, `id: online_480001`, `folderCode: EVAL-DRAFT-2026-1223`, et `searchableFolderCodes: [EVAL-DRAFT-2026-1223, COMPTE-1140001]`.

Un clic sur l’action de la ligne ouvre la fiche 360°. L’onglet `Évaluation` répond et affiche `Préparer la première évaluation`. Le clic ouvre la modale `Préparer le bilan avant envoi`, avec les contrôles `Prévisualiser`, `Aperçu e-mail`, `Aperçu PDF`, `Enregistrer`, `WhatsApp`, `Tester SMTP`, et les boutons fixes `Valider le bilan` / `Valider et envoyer`. Aucun contrôle de validation, envoi, paiement ou activation n’a été déclenché.

Test contrôlé autorisé : une note technique a été injectée dans un champ de brouillon et le bouton `Enregistrer` a été cliqué. La console a confirmé le clic, mais la lecture SQL de l’application `id=480001` a montré que `scoringDetails.adminDraft` n’avait pas changé et que `updatedAt` restait `2026-09-04 22:24:59`. La sauvegarde contrôlée n’est donc pas considérée comme réussie ; il faut diagnostiquer le handler/mutation avant de la marquer terminée.

Le dossier de test existe comme application `EVAL-DRAFT-2026-1223`, id `480001`, e-mail `test.evaluation.preinscription@invalid.test`, fullName `TEST INTERNE — Évaluation externe`, source `WEB`, et contient `bootstrapSource: candidate_pre_dossier`. Aucun paiement, activation, validation humaine ou envoi externe n’a été exécuté.

Checkpoints récents : `562d508b` (alias ACCOUNT_ONLY visible publié), `28f04520` (recherche alias), `7a3cd825` et `062496c2` (bootstrap account-only).
