# Audit des CTA du héros v66

## Cartographie initiale

Le héros principal `HeroSectionVIP.tsx` expose actuellement les CTA « Démarrer mon Évaluation » vers `/evaluation-primaire`, « Discuter avec un Expert » vers WhatsApp, « Accès Client » vers `/login` et « Créez votre Compte Gratuit » vers `/register`. Le menu global `Navbar.tsx`, visible au-dessus du héros, expose aussi « Procédures » vers `/procedures`, « Ressources » vers `/ressources`, « Guide PDF » vers `/guide-procedures`, « Évaluation Rapide » vers `/evaluation-rapide-enhanced`, « Suivi de dossier » vers `/mon-espace` et « E‑Visa » vers `/evisas`.

## Constats visuels et navigation

Les routes `/procedures`, `/evisas`, `/guide-procedures`, `/procedures/luxembourg` et `/evisa` rendent actuellement un contenu substantiel dans l’aperçu desktop. Le clic réel sur « Procédures » depuis l’accueil aboutit à `/procedures` et affiche bien les filtres, les 107 destinations et les CTA de chaque destination. Le problème signalé semble donc venir d’un autre CTA du héros/menu, d’une redirection legacy ou d’une page spécifique accessible après le premier clic ; la suite de l’audit doit tester chaque destination et chaque CTA interactif, notamment `/evaluation-rapide-enhanced`, `/mon-espace` et les liens de services.

## Évaluation Rapide

La route `/evaluation-rapide-enhanced` redirige vers `/evaluation`. Sans session candidate, cette page affiche un écran d’accès réservé avec les boutons « Se connecter » et « Créer mon compte », et non une page vide. Ce comportement est cohérent avec la protection du parcours, mais le CTA ne mène pas directement au formulaire public ; il faudra décider si le bouton doit conserver cette protection ou utiliser la page `/evaluation-primaire` déjà reliée au parcours d’évaluation.

Une tentative de clic sur un CTA de fiche pays a échoué uniquement parce que l’index d’élément appartenait à un ancien instantané de la page Procédures ; la page courante était déjà `/evaluation`. Aucun changement de code n’a été déduit de cette erreur d’outil.

## Fiches pays

La route `/procedures/allemagne-travail` rend une fiche complète : en-tête pays, culture, indicateurs de délai/coût/salaire, étapes de procédure, documents requis, bouton « Lancer ma Procédure », guide PDF et contact WhatsApp. Les fiches pays ne sont donc pas la source générale d’un écran vide.

## Vérification après correction

Après correction, le héros rend chaque CTA principal comme un seul élément interactif grâce à `Button asChild`, sans bouton imbriqué dans un lien. La page `/ressources` ouvre désormais sa bibliothèque PDF dédiée avec 107 ressources, recherche, filtres et téléchargements. La page `/evisas` conserve son annuaire e‑Visa riche et ses filtres. Les aperçus desktop et mobile montrent des boutons visibles, une navigation sans débordement horizontal et un menu mobile accessible.

## Test DOM et parcours principal

Avant correction, le navigateur exposait deux éléments interactifs pour chaque CTA du héros : un lien externe et un bouton interne. Après `Button asChild`, chaque CTA est exposé comme un seul lien accessible (`/evaluation-primaire`, WhatsApp, `/login`, `/register`). Le clic sur « Démarrer mon Évaluation » aboutit à `/evaluation`, qui affiche l’accès réservé aux membres lorsqu’aucune session n’est présente ; cette protection est conservée conformément aux exigences de compte candidat et n’est pas une page vide.

## Services du héros

Les routes `/hotels` et `/traduction/order` sont également opérationnelles : réservation d’hôtel avec champs de séjour et envoi WhatsApp, puis demande de traduction certifiée avec choix du document, langues, nombre de pages, upload et soumission. Aucun écran vide n’a été observé sur ces deux destinations.
