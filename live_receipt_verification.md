# Vérification live du reçu de paiement — 8 septembre 2026

URL testée : https://www.3mtravelagency.com/admin

La session admin `DONFACK SOUMO WILLY AUREOL` est active. Le dossier `3M-AGN-270002` ouvre bien la fiche 360° et l’onglet Paiements affiche le paiement agence de 65 000 XAF avec le statut `success` et la trace de validation manuelle.

Après la publication de la version `9bdba0bc`, le DOM public chargé dans la fiche 360° ne contient pas encore le libellé `Envoyer le reçu PDF` (`hasReceiptAction: false`). Le preview local demande une nouvelle authentification admin. Le domaine public a ensuite affiché un écran « Vérification de votre accès administrateur » pendant la restauration de session. La génération et l’envoi SMTP réels du nouveau reçu n’ont donc pas été déclenchés. Une nouvelle vérification après restauration complète de la session/cache est requise avant de marquer l’envoi live comme terminé.
