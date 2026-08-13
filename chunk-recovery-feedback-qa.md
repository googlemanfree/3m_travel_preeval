# Vérification du feedback de récupération

Les routes `/procedures` et `/flights` ont été ouvertes sur desktop en 1280 × 720 et sur mobile en 390 × 844. Elles affichent leur contenu normalement après le chargement différé ; aucun écran blanc, débordement ou blocage visible n’a été constaté.

Le fallback `PageLoadingFallback` dispose maintenant d’un compte à rebours accessible lié aux 15 secondes du helper `lazyWithTimeout`, d’une barre `progressbar` et d’un message spécifique lorsque la récupération automatique démarre.

L’`ErrorBoundary` propose désormais « Réessayer maintenant ». Le gestionnaire global marque le rechargement réseau, affiche un toast avant l’actualisation et `ChunkReloadNotice` affiche une confirmation au retour sur la page. Les contrats ciblés et la suite complète couvrent ces trois comportements.
