# Vérification publique — accessibilité et style premium

**Checkpoint :** `8f1e7142`  
**URL contrôlée :** `https://www.3mtravelagency.com/employeurs?release=8f1e7142&premium-accessibility=public-v29`  
**Service worker contrôlé :** `https://www.3mtravelagency.com/sw.js?revision=2026-08-25-premium-accessibility-static`  
**Date du contrôle :** 25 août 2026  
**Mode :** lecture seule, sans session employeur, client ou administrateur et sans action métier.

Le domaine public sert la révision `3m-travel-pwa-v29-premium-accessibility-static`. Une fois le rechargement PWA terminé, le portail employeur public affiche son écran de connexion premium avec des champs accessibles et ses informations de confidentialité. Aucun profil candidat, document, contact, note privée, événement d’audit ou contrôle de gestion n’est exposé hors session.

Les contrôles locaux confirment la cohérence des focus clavier, les cibles tactiles, les contrôles ARIA de navigation, la fermeture par Échap, le footer QR responsive et la préservation des actions administratives. TypeScript, 19 régressions ciblées et le build de production sont validés. Aucune décision sensible, aucun e-mail, paiement ou changement de statut n’a été déclenché pendant cette vérification.
