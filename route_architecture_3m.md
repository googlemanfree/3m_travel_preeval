# Architecture de routes 3M Travel

## Principe

3M Travel conserve une architecture originale centrée sur quatre intentions : préparer un voyage, explorer une procédure, demander un service et suivre un dossier. Les routes historiques restent compatibles grâce à des alias explicites, mais chaque alias doit rediriger vers une destination canonique unique.

## Routes canoniques publiques

| Intention | Route canonique | Contenu |
|---|---|---|
| Accueil | `/` | Présentation, évaluation publique, accès rapides aux services |
| Réservation vols | `/billets` | Parcours 3M Booking et demande de devis |
| Tourisme | `/tourisme` | Séjours, hôtels, locations et demande de devis |
| Procédures | `/procedures` | Comparaison des destinations et accès aux guides |
| Canada | `/canada` | Résidence, travail, études, visite et sources IRCC |
| Schengen | `/schengen` | Mobilité et court séjour Schengen |
| Études | `/etudes` | Orientation études internationales |
| E‑Visa | `/evisas` | Catalogue et lancement d’une demande e‑Visa |
| Assurance | `/assurance` | Formulaire et traitement administratif de la demande |
| Ressources | `/ressources` | Bibliothèque de ressources et guides |
| Contact | `/contact` | Coordonnées et formulaire de contact |

## Routes protégées

`/mon-espace`, `/mon-dossier`, `/document-upload`, `/submit-documents` et `/mes-vols-favoris` restent réservées aux comptes connectés. Les parcours protégés ne doivent jamais être indexés ni exposer de données dans les shells publics.

## Routes administratives

Les routes `/admin/dossiers`, `/admin/digital-services`, `/admin/emails`, `/admin/email-settings` et `/admin/securite` restent protégées par le guard administrateur. Elles ne sont pas ajoutées à la navigation publique.

## Aliases conservés

Les anciens chemins `/vols`, `/3m-booking`, `/hotels`, `/visa-etudes`, `/procedure`, `/procedures-complete`, `/procedures-enhanced`, `/procedures-advanced`, `/evaluation-rapide`, `/evaluation-rapide-enhanced` et `/evaluation-primaire` redirigent vers une route canonique sans créer de doublon.

## Règles UX

Chaque CTA doit annoncer son intention : « Réserver ou demander un devis », « Explorer une procédure », « Déposer des documents » ou « Suivre mon dossier ». Les routes de service ne redirigent pas automatiquement vers une évaluation lorsqu’un formulaire de demande suffit. Les décisions d’immigration, de visa, d’emploi ou d’admission restent du ressort des autorités et partenaires compétents.
