# Audit live — bouton de signature

Date du test : 14 septembre 2026.

Le navigateur est connecté avec le compte candidat DONFACK SOUMO WILLY AUREOL, e-mail visible `3mtravelandservices@gmail.com`, dossier `EVAL-DRAFT-2026-4267`. L’espace affiche « Paiement confirmé · action requise » et le bouton « Lire et signer » dans l’onglet « Documents à signer ». L’ouverture redirige vers `/mon-espace?section=dossier`, où le formulaire contient la case de lecture du protocole, le champ `client-agreement-signature`, le canevas `Zone de signature manuscrite` et le bouton de signature.

Après deux défilements, la zone du protocole n’est pas encore entièrement visible. Aucun paiement, envoi ni clic sur la signature n’a été effectué. La capture utilisateur montre le bouton grisé, ce qui doit être reproduit après saisie et tracé dans le canevas.

## Retest après correctif

Après rechargement de la page et ouverture du protocole du dossier `EVAL-DRAFT-2026-4267`, le nom `DONFACK SOUMO WILLY AUREOL` a été saisi, la case « J’ai lu le protocole… » a été cochée, puis un clic réel a été effectué sur le canevas. Le bouton est passé de `disabled`/bleu pâle à un bouton bleu foncé actif, visible dans l’interface avec le libellé « Signer le protocole d’accord ». Le clic de soumission/signature n’a pas été effectué, car il s’agit d’une action juridique et irréversible à confirmer séparément.

Résultat : l’activation visuelle du bouton fonctionne après un contact réel sur le canevas dans l’aperçu actuel. Les tests automatisés restent à jour : 20 tests protocole/signature passés et TypeScript sans erreur après le correctif.

## Soumission confirmée

Après confirmation explicite de l’utilisateur, le clic réel sur « Signer le protocole d’accord » a été effectué dans la session candidat du dossier `EVAL-DRAFT-2026-4267`. Résultat affiché : « Protocole d’accord signé et enregistré », puis « Votre dossier vient d’avancer à l’étape Ouverture du dossier » et « Paiement confirmé ! Votre dossier est officiellement ouvert. » La page affiche également « La signature est enregistrée dans votre dossier. Vous pouvez poursuivre les étapes autorisées. »

Le test a donc validé le parcours complet sans erreur : activation du bouton après contact sur le canevas, soumission, enregistrement et progression du dossier. Il s’agissait du dossier de test/session candidat déjà utilisé, pas d’un dossier réel tiers.
