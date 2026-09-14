
## Améliorations ambassadeur — test live 14 septembre 2026

URL : `https://3000-ige8kutl0fz4q24gdzeis-7cd77fc7.us1.manus.computer/ambassador-program?cachebust=20260914-0912`.

Un enregistrement réel de test a été soumis avec le nom `Ambassadeur Test C9852dc8`, l’e-mail `qa.ambassador.c9852dc8@3mtravelagency.com`, le téléphone `+237699999999` et le pays `Cameroun`. Le backend a répondu avec le code `E93XHU`; la notification visible était `Inscription réussie !` et la page a basculé vers Dashboard. Les statistiques visibles provenaient de `ambassador.getStatsByCode` : 0 parrainage, 0 dossier payé, 0 XAF, profil `active` et taux 15% renvoyé par le backend.

Le lien complet affiché était `https://3000-ige8kutl0fz4q24gdzeis-7cd77fc7.us1.manus.computer/?ref=E93XHU`. Le clic réel sur `Copier le lien complet` a affiché le toast `Lien de parrainage copié dans le presse-papiers.` et le bouton est devenu `Lien copié`.

Le bouton d’inscription porte `aria-busy` pendant la mutation et affiche le spinner `Inscription en cours…` dans le code ; le clic réel a abouti à la confirmation serveur et au message de succès visible. Aucun paiement ni dossier candidat n’a été modifié.
