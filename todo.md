

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
- [x] Envoyer une alerte e-mail unique après trois échecs sur le compte exempté, sans mot de passe ni code MFA.
- [x] Ajouter le bouton serveur/UI de remise à zéro ciblée pour les autres comptes, réservé au super administrateur.
- [x] Valider typecheck, build et régressions ciblées avant publication : 14 tests ciblés verts.

## Journal de sécurité admin — compatibilité SQL
- [x] Remplacer l’ENUM historique de `admin_session_events.eventType` par un VARCHAR compatible avec les événements réellement journalisés.
- [x] Appliquer la migration en base puis retester la connexion MFA sur l’aperçu : l’erreur interne a disparu et l’échec contrôlé renvoie `Email ou mot de passe incorrect.` ; l’alerte e-mail configurée a été déclenchée après les tentatives répétées.

## Pilotage sécurité admin
- [x] Tester le contrat de remise à zéro des tentatives pour un autre compte, avec garde serveur super administrateur et journalisation `login_attempts_reset`.
- [x] Afficher le journal des alertes/échecs et ses indicateurs sur `/admin/admins`.
- [x] Afficher le nombre de tentatives restantes sur la connexion admin, avec exemption explicitement signalée pour le compte de direction.
- [x] Typecheck et tests ciblés : 23 tests verts.
