# Audit aperçu — 13 août 2026

## Version inspectée

Projet `3m_travel_preeval`, version locale `1881940a`, serveur de développement actif sur le port 3000.

## Pages capturées

Les pages `/`, `/procedures`, `/flights`, `/login` et `/register` ont été capturées en desktop (1280×720) et en mobile (375×812).

## Constats visuels desktop

La navigation principale, le héros, la page des procédures, la recherche de vols, la connexion et l’inscription se rendent sans page blanche. Les routes testées affichent leur contenu et les boutons principaux sont visibles. La page `/register` affiche encore le libellé « Créer mon compte » dans son titre et son bouton, ce qui correspond à une correction non présente dans la base restaurée.

Les aperçus `/login` et `/register` montrent un visuel de logo avec un texte de remplacement « 3M Travel » au lieu du logo chargé, ce qui indique un asset manquant ou non résolu dans ces pages. Ce point est à corriger séparément si l’utilisateur souhaite poursuivre la modernisation.

## Constats visuels mobile

Le header mobile est visible avec logo, sélecteur de langue, thème et menu. Les pages `/procedures` et `/flights` sont utilisables dans la largeur capturée sans débordement majeur apparent. Les boutons flottants de chat/WhatsApp restent visibles et se superposent parfois à la zone inférieure du héros ou du formulaire ; cela doit être considéré comme un point d’ergonomie à vérifier avant correction.

La page d’inscription reste lisible mais conserve « Créer mon compte » et des champs d’environ 40 px de haut, donc l’uniformisation h-12/rounded-xl n’est pas incluse dans l’état restauré.

## Réseau et console

Les appels observés dans les journaux, notamment `candidate.getProfile`, `destinationMedia.listPublic` et `auth.me`, retournent un statut HTTP 200. Aucun échec réseau critique n’a été constaté dans l’extrait consulté. L’aperçu peut donc servir de base stable pour une prochaine modification ciblée.

## Conclusion

La base restaurée n’est pas identique aux corrections locales tentées précédemment : les champs et libellés d’inscription restent dans leur état antérieur. Les deux points prioritaires identifiés pour une prochaine itération sont le remplacement contrôlé des libellés d’inscription et la résolution des images de logo manquantes sur `/login` et `/register`, sans modifier le reste du design.

## Vérification après Phase 2 et Phase 4

Après l’harmonisation des champs et des libellés, la page `/register` affiche désormais « Inscription » dans son titre et son bouton. Les champs Input visibles ont une hauteur homogène et un arrondi cohérent.

Après l’ajout des offsets safe-area, les boutons Aureol et WhatsApp restent séparés sur mobile et le bouton WhatsApp respecte la zone basse de l’écran. La page d’accueil reste lisible en 375×812, sans page blanche ni débordement horizontal apparent. Le bouton d’action principal reste accessible ; le bouton WhatsApp est visuellement proche de sa zone inférieure mais ne recouvre pas le formulaire d’inscription dans la capture.

## Campagne de régression finale des routes publiques

Les routes `/`, `/register`, `/flights`, `/accessibilite` et `/plan-du-site` ont été capturées en desktop 1280×720. Les routes `/`, `/flights` et `/plan-du-site` ont également été capturées en mobile 375×812. Toutes les pages se rendent sans écran blanc ni débordement horizontal apparent.

La page `/register` affiche le titre et le bouton « Inscription ». La page `/flights` affiche des dates futures cohérentes et un retour postérieur au départ. Les nouvelles pages du footer sont accessibles et conservent le header global. Les boutons flottants restent visibles sur mobile ; WhatsApp respecte la zone basse et le copilote Aureol reste distinct.

Le build et la suite Vitest restent verts après ces vérifications. Les bundles lourds PDF/vendor restent signalés par Vite comme optimisation future, sans erreur bloquante.
