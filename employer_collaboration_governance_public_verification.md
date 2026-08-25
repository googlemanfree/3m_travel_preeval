# Vérification publique — gouvernance collaborative employeur

**Checkpoint :** `6b880db4`  
**URL contrôlée :** `https://www.3mtravelagency.com/employeurs?release=6b880db4&collaboration-governance=public-v27`  
**Service worker contrôlé :** `https://www.3mtravelagency.com/sw.js?revision=2026-08-25-employer-collaboration-governance-static`  
**Date du contrôle :** 25 août 2026  
**Mode :** lecture seule, sans session employeur et sans création de données de démonstration.

Le domaine public sert la révision `3m-travel-pwa-v27-employer-collaboration-governance-static`. Le portail employeur reste sur l’écran de connexion réservé aux organisations vérifiées et précise que seuls des profils anonymisés autorisés peuvent être consultés. Aucun profil, document, contact ou note privée de candidat n’est exposé dans cette vérification publique.

Le journal CSV minimal, la suspension et la réactivation d’un collaborateur, ainsi que le marquage groupé des notifications sont protégés par une session employeur active et un rôle gestionnaire. Ils ont été validés par les régressions serveur, sans déclencher de partage, suspension, notification ou e-mail réel pendant ce contrôle public. La conservation du dernier gestionnaire actif et l’exclusion des notes privées de l’export sont couvertes par ces contrôles.
