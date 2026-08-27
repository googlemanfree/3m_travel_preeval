# Incident — confirmation d’adresse et suivi de dossier

## Reproduction

Le 27 août 2026, l’URL publique `/verify-email-link` sur le domaine principal retournait un statut HTTP 503 avec l’en-tête `x-manus-original-status: 404`. L’interface de diffusion transformait donc une route de confirmation non pré-rendue en écran générique de maintenance.

L’aperçu local chargeait bien la page `VerifyEmailLink` et affichait son état de lien invalide sans erreur de module. La route `/mon-dossier` était disponible sur le domaine public et affichait correctement le formulaire numéro de dossier + adresse e-mail.

## Cause et correctifs ciblés

Le générateur de pré-rendu ne déclarait pas les routes d’activation (`/verify-email-link`, `/confirm-email` et routes associées), ce qui produisait un statut 404 côté publication. Les modules d’activation critiques étaient également différés, ce qui pouvait ajouter un risque de chargement après clic depuis un e-mail.

Le suivi ne consultait que les dossiers applicatifs ou créés en agence. Les références persistantes des pré-évaluations ne pouvaient donc pas être reconnues, même lorsque l’adresse e-mail concordait.

Les correctifs ajoutent des métadonnées noindex pour les routes d’activation, chargent directement les écrans d’activation et autorisent la recherche d’une référence d’évaluation après une concordance stricte de l’e-mail. La restitution reste minimale : aucun brouillon, document, score, note interne ou contenu Gemini n’est retourné.
