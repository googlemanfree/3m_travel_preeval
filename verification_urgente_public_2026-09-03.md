# Vérification publique — correctifs urgents — 2026-09-03

- URL testée : https://www.3mtravelagency.com/
  - Le pied de page public affiché dans la réponse HTML contient encore l’image QR `https://api.qrserver.com/v1/create-qr-code/...`, malgré sa suppression dans le code local avant le checkpoint `7596c87c`.
  - Les liens de pied de page et la newsletter sont encore présents.
- URL testée : https://www.3mtravelagency.com/mon-espace?section=dossier
  - La page affichée est « Accès Réservé aux Membres » avec les boutons « Se connecter » et « Inscription ».
  - Aucun bouton « Suivre mon dossier » n’est testable sans session candidat effective dans ce navigateur.
- Conclusion : ne pas déclarer la suppression du QR ni le clic de suivi comme vérifiés en production tant qu’un déploiement/cache réel n’est pas confirmé et qu’une session candidat n’est pas disponible.

## Vérification complémentaire après propagation

- `https://www.3mtravelagency.com/register?check=urgent-photo-identite-v4` affiche bien « Portrait humain obligatoire » et les boutons « Utiliser la caméra » / « Choisir dans la galerie » ; aucun fichier n’a été envoyé.
- `https://www.3mtravelagency.com/mon-dossier?check=follow-target-v4` se charge et affiche le suivi de dossier avec les champs numéro de dossier, adresse e-mail et le bouton « Accéder à mon dossier ».
- Le Footer public sur ces routes affiche le lien Facebook officiel et la newsletter, sans QR code ni descriptions de tooltip répétées.

## Session admin effective — 2026-09-03 21:40
- /admin est accessible avec une session administrateur active.
- Le tableau affiche 23 dossiers, dont 12 dossiers agence, 18 bilans à relire et 2 paiements à contrôler.
- L’onglet Pré-dossiers est accessible ; aucune action de préparation, validation, envoi ou activation n’a encore été déclenchée dans cette reprise.
- La vérification multi-dossiers peut maintenant être menée en lecture contrôlée, en évitant toute mutation sensible.

## Vérification admin réelle — file des dossiers
- La session admin est active sur `/admin`.
- La file « Dossiers » affiche actuellement un dossier en ligne filtré : `EVAL-DRAFT-2026-4267`, DONFACK SOUMO WILLY AUREOL, destination « autre », source « En ligne », activation « Activé », statut « Évaluation 48h ».
- La file « Bilans à valider » a précédemment exposé deux entrées à traiter, mais leur ouverture a modifié le filtre d’affichage vers ce dossier unique ; aucune préparation, validation ou envoi n’a été déclenché dans cette vérification.
- La vérification de plusieurs dossiers agence réels reste à effectuer dans l’onglet « Pré-dossiers », distinct de la file « Dossiers ».

## Filtre source Agence — dossiers visibles
- Le filtre source « Agence » affiche 12 dossiers.
- Premier dossier visible : `3M-AGN-240001`, Eboule eboule Gatien Armstrong, destination Luxembourg, évaluation validée, activation Activé, statut Évaluation 48h, date 27/08/2026.
- Deuxième dossier visible : `3M-AGN-270001`, Yannick Martial Ketcheckmen, destination Luxembourg, évaluation validée, activation Activé, statut Évaluation 48h, date 28/08/2026.
- Seule la consultation de la liste a été effectuée ; aucun bouton « Préparer », « Valider », « Envoyer » ou changement de statut n’a été déclenché.

- Deuxième dossier contrôlé : `3M-AGN-270001`, Yannick Martial Ketcheckmen. La fiche 360° s’ouvre correctement depuis la file Agence et affiche le contexte Luxembourg/Travail ainsi que la validation manuelle guidée ; aucun message « Dossier d’évaluation introuvable » n’est apparu. Aucune validation, préparation, envoi ou mutation n’a été déclenchée dans cette vérification.

- Deuxième test de préparation : dossier `3M-AGN-270001`, Yannick Martial Ketcheckmen. Après ouverture de l’onglet Évaluation et clic sur « Préparer la première évaluation », l’éditeur s’ouvre et affiche « Chargement du brouillon d’évaluation… » ; aucun message « Dossier d’évaluation introuvable » n’est apparu à ce stade. Aucune validation, envoi, paiement ou changement de statut n’a été déclenché.

- Régression confirmée sur le deuxième dossier réel `3M-AGN-270001` : l’éditeur s’ouvre, reste sur « Chargement du brouillon d’évaluation… », puis affiche finalement « Le brouillon n’a pas pu être chargé — Dossier d’évaluation introuvable ». Le correctif précédent ne couvre donc pas ce cas. Aucun bilan n’a été validé, envoyé ou modifié.
