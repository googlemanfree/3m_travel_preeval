# Contrôles publics après correction

## Aperçu local — 24 août 2026

L’accueil, le centre d’information (`/blog`) et la page de transparence (`/avis`) se chargent visuellement sans écran de secours. Le Blog conserve ses guides internes et ses sources externes, tout en orientant son CTA vers le formulaire public gratuit. La page `/avis` ne présente plus de notes, statistiques ou témoignages attribués à des clients sans source vérifiable.

Les liens d’évaluation publics du hero, du menu, du pied de page, du Blog et de la section de confiance sont alignés vers `/?project=travail#evaluation-multi`. Les liens membres conservés vers `/evaluation` sont limités aux parcours candidats authentifiés.

## Vérification publiée — 24 août 2026

Après propagation du checkpoint `dcc5e2a5`, la page `/avis` est confirmée en lecture seule sur le domaine de déploiement puis sur `www.3mtravelagency.com`. Elle affiche la page « Transparence 3M Travel » et ne présente plus de notes, statistiques ou témoignages clients non vérifiés. Le premier chargement avait servi un bundle précédent ; l’actualisation de la révision publiée a ensuite chargé le point d’entrée de production attendu.
