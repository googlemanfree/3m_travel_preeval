# Checklist du site public — état au 15 novembre 2026

Vérifié sur le vrai site (www.3mtravelagency.com) avec un navigateur automatisé (8 pages principales, bureau 1280 px et téléphone 390 px, contrôle d'accessibilité axe-core WCAG A/AA), et dans le code.

| # | Point | État | Détail |
|---|---|---|---|
| 1 | Politique de confidentialité | Existait | `/politique-confidentialite` ; liens rendus reconnaissables sans la couleur (soulignés) |
| 2 | Conditions générales | Existait | `/conditions-utilisation` + `/mentions-legales` ; mêmes liens soulignés |
| 3 | Clés secrètes hors du front-end | Vérifié | aucune clé secrète dans le code client. Variables publiques par conception : identifiant Google (connexion), identifiant de site CinetPay et clé « apikey » du kit de paiement navigateur de CinetPay. À confirmer de votre côté : la clé *secrète* CinetPay ne doit exister que côté serveur |
| 4 | HTTPS forcé | Existait | HSTS un an avec préchargement (`Strict-Transport-Security`) servi par l'hébergeur ; en-têtes `Referrer-Policy`, `Permissions-Policy`, `nosniff`. Non testé d'ici : la redirection de `http://` vers `https://` |
| 5 | Bandeau cookies | Existait, compacté | mesure d'audience chargée seulement après « Accepter » ; « Refuser » de même poids. Texte et marges réduits sur téléphone (le bandeau cachait un quart de l'écran) |
| 6 | Titres et descriptions meta | Existait | titre et description propres à chaque page contrôlée, un seul `h1` par page, `canonical` et `hreflang` fr/en |
| 7 | Image d'aperçu réseaux sociaux | Existait | `og:image` 1200 × 630 générée par page (`/api/og`) |
| 8 | Favicon | Existait | `favicon.png`, `favicon-32x32.png`, `apple-touch-icon.png`, manifeste. L'adresse `/favicon.ico` est redirigée par l'hébergeur vers une image de son CDN : elle fonctionne |
| 9 | Sitemap et robots.txt | Existait | 230 adresses dans le sitemap, toutes répondent 200 ; `robots.txt` exclut les espaces privés |
| 10 | Texte alternatif des images | Vérifié | aucune image sans attribut `alt` sur les 8 pages contrôlées |
| 11 | Images compressées | Amélioré | 22 photos JPG recompressées (qualité 78, 1600 px au plus) : 4,0 Mo → 2,6 Mo, test de plafond à 330 Ko dans `photos-canada`, `proof-photos` et `team`. Non touché : les photos de `photos-pays` déjà en qualité ≤ 80, et les images d'en-tête de PDF (`brand/`) |
| 12 | Vitesse de chargement | Vérifié | premier affichage en 0,5 à 1,1 s ; chargement complet 1,1 à 3,6 s (l'accueil charge 75 images) |
| 13 | Contraste | Vérifié | aucune violation WCAG AA réelle. Un balayage de la page Contact signalait des contrastes faibles : ils venaient des animations d'apparition (mesure faite en plein fondu), plus rien une fois l'animation terminée. Seuls vrais écarts : les liens non soulignés des pages légales, corrigés |
| 14 | Adapté au mobile | Vérifié | aucun débordement horizontal à 390 px sur les 8 pages ; bandeau cookies compacté |
| 15 | Page 404 personnalisée | Existait | page « Page introuvable » avec retour à l'accueil, code HTTP 404 réel |
| 16 | Liens cassés | Vérifié | 230 adresses du sitemap + 135 liens internes relevés sur 10 pages : tous répondent 200 |
| 17 | Validation des formulaires | Existait | contrôle côté écran (champs signalés avant envoi) et côté serveur (zod) |
| 18 | Protection anti-spam | Ajouté | limitation de débit par adresse IP et par e-mail existait. Ajout d'un champ piège invisible sur les formulaires de contact, d'avis clients et d'assurance voyage (ce dernier n'avait aucune limitation de débit : ajoutée) : rempli, il ne déclenche ni enregistrement ni e-mail et le robot reçoit la réponse d'un succès. Pas de captcha (il imposerait un service tiers et un consentement de plus) |
| 19 | Mesure d'audience | Existait | Google Analytics 4 et Umami, chargés uniquement après consentement |
| 20 | Un seul appel à l'action clair | Existait | l'accueil met en avant « Évaluer mon projet — gratuit » (bouton principal orange) ; « Parler à un conseiller » est secondaire |

## Pistes non faites
- Politique de sécurité du contenu (CSP) complète : l'actuelle se limite à `object-src` et `base-uri`, volontairement, pour ne casser ni Google, ni CinetPay, ni l'aperçu de l'hébergeur. À introduire d'abord en mode « rapport seul ».
- Piège à robots sur les formulaires publics restants (évaluation, partenariat) : protégés par la limitation de débit uniquement.
- 9 grosses images de `client/public/brand/` (5,5 Mo au total) ne sont référencées par aucune page : elles alourdissent la publication mais pas le chargement ; à supprimer après accord.
