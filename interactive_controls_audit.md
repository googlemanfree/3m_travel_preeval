# Audit des contrôles interactifs

## Périmètre et méthode

La cartographie couvre les routes déclarées dans `client/src/App.tsx`, regroupées par site public, accès candidat, portail employeur et administration. Les contrôles sont testés en lecture seule ou par navigation non sensible. Les mutations de dossier, paiement, e-mail, statut, partage, suspension et gestion de compte sont exclues sans confirmation humaine explicite.

## Constat initial — routes protégées

La route `/admin/dashboard` sans session affiche un refus d’accès clair, avec un bouton **Se connecter en tant qu’Admin** et un bouton **Retour à l’accueil**. Le bouton de connexion mène bien à `/admin/login`, où les champs de connexion, l’affichage du mot de passe, le retour à l’accueil et l’option de mot de passe temporaire sont accessibles. Aucun profil, dossier ou contrôle administratif n’est exposé hors session.

Le parcours clavier de la connexion administrateur atteint successivement les champs `admin-email` et `admin-password`, avec un focus visible. Les actions de soumission et de récupération restent présentes dans l’ordre de tabulation suivant. Aucune tentative de connexion ou de génération d’e-mail n’a été effectuée.

Les pages `/evaluation`, `/mon-espace` et `/employeurs` affichent également une barrière d’accès lisible hors session. Le portail employeur ne divulgue aucun profil, document ou contact candidat. Le contrôle principal à poursuivre est la disponibilité des actions internes une fois une session autorisée, qui sera vérifiée par analyse de contrats et tests non mutatifs.

## Anomalie identifiée

Le simulateur Canada utilise quatre éléments `<p>` comme déclencheurs d’infobulles « Conseil d’amélioration ». Ces éléments sont rendus interactifs à la souris, mais n’offrent pas la sémantique ni la tabulation d’un bouton. Ils seront remplacés par des boutons de type `button`, conservant leur apparence textuelle et recevant une étiquette accessible.

## Validation après correction

Les quatre conseils du simulateur sont désormais des boutons réels, atteignables au clavier et munis du focus commun du site. Dans la fiche administrative, les actions « Ouvrir le dossier et activer le suivi » et « Enregistrer la décision » exposent désormais la raison précise de leur indisponibilité, avec une annonce de statut.

Les contrôles d’entrée mobile ont été vérifiés sur l’accueil, la connexion administrateur et le portail employeur. Les champs, actions principales, bascule FR/EN, thème, menu mobile et boutons flottants restent visibles et atteignables. Les routes protégées continuent d’afficher leur formulaire d’accès sans exécuter d’action métier hors session.

## Corrections documentaires complémentaires

L’audit statique a aussi identifié des actions réelles rendues par des éléments non sémantiques dans les modules documentaires. Les miniatures de documents administratifs, ainsi que les marqueurs de lisibilité, sont désormais des boutons natifs avec étiquette, état sélectionné et focus visible. Le sélecteur de fichiers dans l’espace candidat est désormais commandé par un bouton réel, associé à son aide de format et de taille. Les actions de validation, rejet, téléchargement et enregistrement existantes restent inchangées et protégées par leurs confirmations ou leurs droits serveur.

## Transitions premium entre pages

La transition globale reste courte et limitée à l’opacité et à un déplacement vertical léger. Le réglage partagé `normal`, `fast` ou `off` est pris en compte avec `prefers-reduced-motion` : les modes réduits désactivent l’entrée et la sortie animées, sans bloquer le contenu. Les rendus mobile de l’accueil et de 3M Booking restent lisibles et sans débordement lié à la transition. La régression dédiée confirme l’absence d’animation lorsque le mouvement est désactivé.
