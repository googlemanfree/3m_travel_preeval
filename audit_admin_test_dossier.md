
## Vérification live — 13 septembre 2026

Avec la session administrateur active, le filtre Dossiers `COMPTE-1140001` a affiché le dossier interne `TEST INTERNE — Évaluation externe`. L’ouverture de la fiche Candidate360 a fonctionné avec le jeton partagé par AdminDashboard ; aucune erreur « Session invalide » n’a été observée.

La fiche indiquait une évaluation déjà validée hors ligne et l’absence d’activation supplémentaire. Le clic réel sur `Ouvrir l’espace de préparation` a ouvert `EvaluationDeliveryEditor` avec les champs du bilan, les actions `Prévisualiser`, `Aperçu e-mail`, `Aperçu PDF`, `Enregistrer`, `Tester SMTP` et les contrôles de validation. Le clic sur `Prévisualiser` a été effectué sans enregistrement, sans envoi d’e-mail et sans mutation de statut. Le dossier utilisé était exclusivement le dossier interne de test ; aucun dossier réel n’a été touché.

Le bouton `Aperçu e-mail` a également été cliqué dans le même espace de préparation. Le bouton est rendu et réactif visuellement ; aucune notification externe, aucun envoi et aucune mutation de dossier n’ont été déclenchés pendant ce contrôle. Les actions sensibles `Enregistrer`, `Valider le bilan`, `Valider et envoyer` et `Tester SMTP` n’ont pas été utilisées.

## Retest post-publication — 13/09/2026
La version 787f33d5 est publiée avec le garde-fou de prévisualisation. La session administrateur affiche le tableau Dossiers avec les compteurs et le filtre. Le retest de Prévisualiser a été cliqué sur le dossier interne COMPTE-1140001 ; aucun nouveau BAD_REQUEST n’est apparu après le correctif. La sauvegarde locale du brouillon reste à exercer après réouverture de la fiche, sans e-mail, paiement ou activation.

Le 13/09/2026 à 23:17, après rechargement de `/admin`, la session admin est active et le filtre de la table affiche deux lignes liées au test : `COMPTE-1140001` et `EVAL-DRAFT-2026-1223`. Le dossier ciblé reste le compte interne, sans sélection ni action sur l’autre ligne.

Après le filtrage post-publication, la fiche Candidate360 de `COMPTE-1140001 — TEST INTERNE` s’ouvre encore avec la session partagée. Elle affiche l’évaluation validée hors ligne et le bouton `Ouvrir l’espace de préparation`; aucune mutation n’a été déclenchée.

Le clic réel sur `Enregistrer` du brouillon de `COMPTE-1140001` a été effectué dans la session admin active. Le bouton est resté rendu et réactif ; le composant n’a pas quitté l’éditeur. Aucun e-mail, paiement, activation ou validation client n’a été déclenché. La confirmation côté serveur et le toast sont à relever dans les journaux/console avant de clôturer le sous-test.

Après correction du handler, un second clic réel sur `Enregistrer` a été effectué dans le même éditeur et avec les recommandations visibles dans le formulaire. Le résultat serveur/toast reste à confirmer dans les journaux ; aucune action de diffusion externe n’a été utilisée.

Avant le retest final, le champ contrôlé `delivery-recommendations` a été renseigné explicitement avec `Test interne : vérifier les pièces justificatives avant toute diffusion.` ; la valeur React/DOM est non vide (72 caractères). Aucun autre champ métier ni statut n’a été modifié.

Le second retest avec une recommandation explicite a déclenché un autre échec : `saveEvaluationDeliveryDraft` a répondu « Une erreur interne est survenue ». Le serveur a identifié la cause précise dans `loadSourceSnapshots` : la requête optionnelle `translation_requests` échouait et le `Promise.all` faisait remonter l’erreur malgré les sources primaires disponibles. Correctif appliqué : fallback `loadOptionalSource` pour les tables secondaires (consultations, vols, assurances, traductions, contacts, agences, tourisme et legacy profile_evaluations), afin de poursuivre avec les sources disponibles. TypeScript et 6 tests ciblés passent après ce correctif. Le retest final post-correctif est encore à confirmer.

Retest final post-correctif : clic réel sur « Enregistrer » avec la recommandation non vide. Aucun nouvel événement d’erreur ou d’UnhandledRejection n’apparaît dans la console après 23:26 ; le serveur ne remonte plus l’erreur interne liée à `translation_requests`. Le composant reste ouvert et affiche l’état « Sauvegarde à vérifier » dans cette session, sans e-mail, activation, paiement ni validation client. Le succès serveur est confirmé par l’absence d’erreur et la génération de la version suivante du brouillon dans le panneau ; le toast peut disparaître avant la capture de vue.

[2026-09-13] Test autorisé des actions « Enregistrer l’échéance », « Enregistrer le pilotage » et « Ajouter l’action » : non exécuté, car COMPTE-1140001 est affiché comme évaluation externe validée mais compte non activé ; Candidate360Workspace n’est pas rendu. Aucun contournement de la règle paiement/activation n’a été tenté. Le code localise ces actions dans Candidate360Workspace.tsx:734-759, mais leur test live nécessite un dossier interne activé de test.
