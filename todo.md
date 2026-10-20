

## Reçus, protocoles et espace candidat
- [x] Badges de type de visa accessibles sur la page des reçus (Travail / Études / Visiteurs / famille).
- [x] Aperçu admin en lecture seule avant envoi du protocole, sans envoi automatique (bureau reçus et cockpit 360°).
- [x] Export/téléchargement des protocoles signés et reçus validés personnalisés dans l’espace candidat.
- [x] Propagation explicite de `destination` et `visaType` vers le bureau des reçus.
- [x] Régressions ciblées protocoles + PDF : 11/11 vertes ; `git diff --check` vert.
- [x] `pnpm run check` global vert après correction des comparaisons visa et des contrats Zod du workflow 360°.

## Formulaire dynamique pays / visa
- [x] Implémenter la confirmation de changement pays/projet, le résumé d’impact et les erreurs de validation accessibles.
- [x] Préserver les champs communs et archiver les réponses spécifiques devenues inactives dans le brouillon.
- [x] Ajouter les régressions ciblées puis valider typecheck, tests et build.

## Restauration du parcours précédent
- [x] Archiver les réponses par projet, pays et visa.
- [x] Restaurer automatiquement les réponses au retour sur le même couple pays–visa.
- [x] Valider typecheck, build et 13 tests ciblés.

## Connexion administrateur
- [x] Appliquer les tables MFA manquantes nécessaires au parcours de connexion.
- [x] Vérifier que le login invalide reste contrôlé et que le serveur ne renvoie plus d’erreur interne liée au MFA : 2 tables présentes en production, réponse fictive `401 Email ou mot de passe incorrect`, et parcours mot de passe valide → `TOTP_REQUIRED` couvert par le test de route (sans manipuler le mot de passe réel du super administrateur).

## Exemption anti-tentatives du super administrateur
- [x] Exempter uniquement `aureoldonfack@gmail.com` du verrouillage anti-tentatives admin.
- [x] Conserver le verrouillage et le journal des échecs pour les autres comptes admin.
- [x] Valider typecheck et régressions ciblées avant publication : 12 tests verts.
