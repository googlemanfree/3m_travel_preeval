# Audit live c9852dc8 — 14 septembre 2026

## Version et migration
Le dépôt local a été fast-forwardé de 46239a01 vers c9852dc8 depuis `user_github/main`. La base ne contenait pas `ambassadors` ni `applications.referredByCode`. La migration non destructive `drizzle/migrations/0060_ambassadors_referrals.sql` a été appliquée : création de `ambassadors` avec contraintes uniques sur email et referralCode, et ajout de la colonne nullable `applications.referredByCode`. Vérification SQL effectuée ensuite.

## Vérification navigateur
URL testée : `https://3000-ige8kutl0fz4q24gdzeis-7cd77fc7.us1.manus.computer/ambassador-program?cachebust=20260914-0849`.
Le contenu du programme ambassadeur est rendu : titre, avantages, boutons « Rejoindre » et « Dashboard ». Le titre de document retourné est « Page introuvable », mais la route SPA et son contenu sont visibles ; ce point doit être vérifié dans le registre de prerender/publication avant clôture.

URL testée : `https://3000-ige8kutl0fz4q24gdzeis-7cd77fc7.us1.manus.computer/admin/admins?cachebust=20260914-0850`.
La route affiche correctement l’écran « Accès Refusé » et demande une authentification administrateur. La session navigateur actuelle est une session candidat, pas une session admin ; aucun contournement n’a été tenté.

## Contrôles techniques
TypeScript, tests ciblés admin (4 fichiers, résultat non tronqué à confirmer dans le rapport) et build production ont été exécutés ; le build a terminé avec succès. Aucun dossier ni paiement n’a été modifié.
