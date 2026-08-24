# Vérification publique — transparence et footer

Date de vérification : 24 août 2026.

La version publiée `b60d3316` est à nouveau disponible après une indisponibilité temporaire de l’infrastructure. Les contrôles sur le domaine public ont confirmé les éléments suivants :

- `/about` affiche la page détaillée de transparence, sans chiffre de volume, taux de satisfaction, certification ISO, agrément, reconnaissance institutionnelle ou témoignage non étayé.
- `/tarifs` présente les services comme des repères d’information, distingue les frais tiers et ne promet ni remboursement automatique ni résultat consulaire ou fournisseur.
- L’accueil charge normalement avec les CTA publics et le footer partagé unique. La structure locale est protégée par une régression qui interdit le retour du footer intégré dupliqué dans `Home.tsx`.

Les actions de page observées ont été limitées à la lecture et à la navigation ; aucune soumission de formulaire, paiement ou mutation administrative n’a été déclenchée.
