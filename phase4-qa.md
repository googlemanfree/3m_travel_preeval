# Vérification phase 4 — 13 août 2026

Le découpage des routes secondaires par `React.lazy` a réduit le bundle d’application initial d’environ 3,9 Mo à environ 543 Ko dans le build Vite. Les dépendances PDF restent dans un chunk dédié chargé uniquement lors d’une demande d’export ; les dépendances React, formulaires, données, icônes et Recharts sont séparées pour améliorer la mise en cache mobile.

Une régression de chargement a été détectée pendant la capture mobile : les déclarations `React.lazy` avaient été placées avant l’import de React, ce qui provoquait `Cannot access 'React' before initialization` et laissait le fallback affiché. L’import React a été déplacé en tête de `App.tsx`, puis TypeScript et les tests ciblés ont passé.

Les captures à 390 × 844 px après correction rendent correctement l’accueil, `/flights`, `/procedures` et `/conditions-utilisation`, sans écran blanc. Les boutons flottants restent accessibles et séparés des contrôles principaux. Le formulaire de recherche de vols conserve ses champs visibles et son bouton d’action.
