
## Vérification live — 13 septembre 2026

Avec la session administrateur active, le filtre Dossiers `COMPTE-1140001` a affiché le dossier interne `TEST INTERNE — Évaluation externe`. L’ouverture de la fiche Candidate360 a fonctionné avec le jeton partagé par AdminDashboard ; aucune erreur « Session invalide » n’a été observée.

La fiche indiquait une évaluation déjà validée hors ligne et l’absence d’activation supplémentaire. Le clic réel sur `Ouvrir l’espace de préparation` a ouvert `EvaluationDeliveryEditor` avec les champs du bilan, les actions `Prévisualiser`, `Aperçu e-mail`, `Aperçu PDF`, `Enregistrer`, `Tester SMTP` et les contrôles de validation. Le clic sur `Prévisualiser` a été effectué sans enregistrement, sans envoi d’e-mail et sans mutation de statut. Le dossier utilisé était exclusivement le dossier interne de test ; aucun dossier réel n’a été touché.

Le bouton `Aperçu e-mail` a également été cliqué dans le même espace de préparation. Le bouton est rendu et réactif visuellement ; aucune notification externe, aucun envoi et aucune mutation de dossier n’ont été déclenchés pendant ce contrôle. Les actions sensibles `Enregistrer`, `Valider le bilan`, `Valider et envoyer` et `Tester SMTP` n’ont pas été utilisées.
