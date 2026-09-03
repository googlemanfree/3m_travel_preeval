# Vérification publique — correctifs urgents — 2026-09-03

- URL testée : https://www.3mtravelagency.com/
  - Le pied de page public affiché dans la réponse HTML contient encore l’image QR `https://api.qrserver.com/v1/create-qr-code/...`, malgré sa suppression dans le code local avant le checkpoint `7596c87c`.
  - Les liens de pied de page et la newsletter sont encore présents.
- URL testée : https://www.3mtravelagency.com/mon-espace?section=dossier
  - La page affichée est « Accès Réservé aux Membres » avec les boutons « Se connecter » et « Inscription ».
  - Aucun bouton « Suivre mon dossier » n’est testable sans session candidat effective dans ce navigateur.
- Conclusion : ne pas déclarer la suppression du QR ni le clic de suivi comme vérifiés en production tant qu’un déploiement/cache réel n’est pas confirmé et qu’une session candidat n’est pas disponible.
