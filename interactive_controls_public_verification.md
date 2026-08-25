# Vérification publique — contrôles interactifs accessibles

**Checkpoint :** `b42a0855`  
**URL contrôlée :** `https://www.3mtravelagency.com/employeurs?release=b42a0855&interactive-controls=public-v32`  
**Service worker contrôlé :** `https://www.3mtravelagency.com/sw.js?revision=2026-08-25-interactive-controls-accessibility-static`  
**Date du contrôle :** 25 août 2026  
**Mode :** lecture seule, sans session client, employeur ou administrateur et sans action métier.

Le domaine public sert la révision `3m-travel-pwa-v32-interactive-controls-accessibility-static`. Après le rechargement de la page, le portail employeur affiche exclusivement son formulaire de connexion et ses notices de confidentialité. Aucun profil, document, contact candidat, journal collaboratif ou action administrative n’est visible hors session.

Les contrôles corrigés sont couverts localement par TypeScript, 10 régressions ciblées et le build de production. Les contrôles protégés n’ont pas été soumis pendant la vérification publique : la publication n’a déclenché aucun e-mail, paiement, décision de dossier, validation documentaire ou changement de statut.
