# Plan d'action détaillé — Améliorations de 3M Travel Agency

Ce document détaille l'exécution méthodique des 8 recommandations d'amélioration formulées à la suite de l'audit visuel et technique de la plateforme. Chaque phase dispose de critères de validation précis et s'appuie sur la base stable actuelle sans altérer l'identité visuelle ni la structure des routes.

---

## 1. Phase 1 : Correction des logos et assets d'authentification (`/login`, `/register`)
- **Problème identifié** : Les pages de connexion et d'inscription affichent un texte de substitution « 3M Travel » avec une icône générique au lieu du logo officiel validé.
- **Action** : Remplacer l'élément d'image par l'URL officielle du logo 3M (`/manus-storage/pasted_file_lJvrPx_logo3Mfull_25c12e97.jpeg`) avec des classes de dimensions et d'alignement homogènes.
- **Validation** : Capture d'écran desktop/mobile sur `/login` et `/register` confirmant l'affichage parfait du logo officiel.

## 2. Phase 2 : Uniformisation complète des champs et des libellés d'inscription
- **Problème identifié** : Les composants de formulaire (`Input`, `Select`, `Textarea`) et certains boutons conservent des variations de hauteur ou le libellé « Créer un compte ».
- **Action** : 
  - Uniformiser les champs à `h-12`, `rounded-xl` et padding cohérent.
  - Remplacer définitivement toutes les occurrences de « Créer un compte » par « Inscription » dans la navigation, les en-têtes et les boutons des pages concernées.
- **Validation** : Vérification par Vitest et test visuel sur les formulaires d'inscription.

## 3. Phase 3 : Correction du positionnement mobile des boutons flottants
- **Problème identifié** : Sur petits écrans, les boutons flottants de discussion et WhatsApp peuvent se superposer au contenu des formulaires ou des boutons de validation.
- **Action** : Ajuster les marges et l'espacement inférieur (`bottom-6` avec z-index maîtrisé) sur les résolutions mobiles pour garantir une interaction fluide sans gêne tactile.
- **Validation** : Rendu responsive sur émulation mobile 375×812.

## 4. Phase 4 : Rendre les liens du footer réellement fonctionnels
- **Problème identifié** : Les liens légaux et utilitaires du footer (`Mentions légales`, `Accessibilité`, `Plan du site`) pointent vers `#`.
- **Action** : Créer ou relier ces liens vers des sections explicites ou des modales d'information officielles (ex: modal de la Charte de Transparence et des mentions légales de l'agence).
- **Validation** : Test au clic sur chaque lien du footer sans redirection vers une page vide ou brisée.

## 5. Phase 5 : Optimisation du chargement mobile et découpage des bundles
- **Problème identifié** : Le build comporte de gros chunks (pdf-vendor, recharts-vendor, index).
- **Action** : Configurer `manualChunks` dans `vite.config.ts` pour séparer proprement les gros modules (PDF, graphiques, bibliothèques tierces) et appliquer le lazy loading sur les vues secondaires.
- **Validation** : Mesure du temps de chargement et réussite du build de production.

## 6. Phase 6 : Fiabilisation des dates et valeurs de la recherche de vols
- **Problème identifié** : Les valeurs par défaut des dates de vol nécessitent un contrôle pour éviter les erreurs de sélection.
- **Action** : S'assurer que le sélecteur de date initialise dynamiquement le départ à J+2 et le retour à J+9 par rapport à la date du jour, tout en bloquant toute date passée.
- **Validation** : Test unitaire et vérification de la page `/flights`.

## 7. Phase 7 : Renforcement de l'accessibilité (a11y)
- **Problème identifié** : Certains éléments interactifs manquent d'attributs ARIA explicites.
- **Action** : Ajouter des `aria-label`, des rôles explicites sur les groupes de boutons et des alternatives textuelles sur l'ensemble des images et icônes.
- **Validation** : Audit de conformité accessibilité de base sur les pages principales.

## 8. Phase 8 : Validation des parcours de bout en bout et publication finale
- **Problème identifié** : Nécessité de garantir l'absence de régression avant la publication.
- **Action** : Exécuter la suite complète de 121 tests unitaires, relancer le build de production optimisé, puis préparer le checkpoint final.
- **Validation** : Tous les tests verts et build réussi.
