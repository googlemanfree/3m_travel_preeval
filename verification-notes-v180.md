# Vérification visuelle v180

- `/register` s’affiche sans page blanche ; le formulaire conserve le portrait humain obligatoire et les champs existants.
- `/verify-email-sent?email=test@example.com` affiche correctement l’instruction d’activation par e-mail et le bouton de renvoi.
- La navigation globale reste visible et aucune erreur de rendu n’a été constatée sur les deux écrans desktop capturés.
- Le build complet minifié du sandbox a été interrompu par une limite de ressources pendant le rendu Rollup ; la validation Vite allégée avec `--minify=false` a réussi.
La vérification mobile en 375×812 px montre que les deux pages restent lisibles : le formulaire conserve les champs et le bloc portrait sans débordement, tandis que l’écran d’activation empile correctement le titre, les instructions et les étapes. Les boutons flottants restent visibles ; aucun écran blanc n’a été observé.
