# Vérification phase 3 — 13 août 2026

Les captures mobile à 390 × 844 px montrent les deux actions globales séparées verticalement : le bouton WhatsApp est placé au-dessus de la zone inférieure et Aureol au-dessus de WhatsApp, sans recouvrir le bouton « Évaluation gratuite » ni le bouton « Rechercher les vols ». Les contrôles restent visibles et disposent d’un anneau de focus renforcé.

Les routes `/conditions-utilisation`, `/plan-du-site` et `/accessibilite` ont été ouvertes dans l’aperçu desktop à 1280 × 720 px et rendent chacune une page de contenu, sans écran blanc ni route introuvable. Le footer principal conserve les liens vers ces pages, et le footer institutionnel de l’accueil expose désormais aussi « Plan du site » et « Accessibilité ».

Le build Vite + serveur et la vérification TypeScript passent après les modifications. Le build signale encore les gros bundles existants (`index`, `vendor`, `pdf-vendor`) comme avertissements de performance ; leur découpage est planifié pour la phase 4.
