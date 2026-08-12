# Audit écrans blancs après navigation — v75

Le 12 août 2026, l’ouverture directe de https://www.3mtravelagency.com/procedures a d’abord affiché une capture blanche sans éléments interactifs. La console navigateur ne signalait aucune erreur. Après une nouvelle lecture/attente du document, la page s’est rendue avec son en-tête, les filtres et les destinations. La page contient bien 107 destinations annoncées et 91 résultats filtrés visibles.

Constat initial : le problème ressemble à un état de chargement sans fallback visuel ou à une attente de montage/chargement, plutôt qu’à une route inexistante. Il faut reproduire le retour depuis l’accueil et comparer les routes publiques pour isoler le composant commun.

## Reproduction supplémentaire
Depuis `/procedures`, un clic réel sur le lien header « Accueil » a immédiatement affiché une page blanche sur `https://www.3mtravelagency.com/`. La console navigateur est restée vide, sans erreur JavaScript. Cela confirme un état blanc au moment de la transition ou du premier rendu, non une simple route 404. La prochaine vérification doit comparer le HTML initial, les logs réseau et le montage de l’application sur les routes qui utilisent le même shell global.

Après le clic vers l’accueil, la page est d’abord blanche puis se rend correctement après une lecture/attente : le header, le héros, les services, le formulaire et le footer deviennent accessibles. Le même comportement avait été observé sur `/procedures`. Aucun message console n’apparaît. La correction doit donc fournir un shell de chargement visible et un fallback d’erreur global pendant le délai de montage, et vérifier si une navigation client remplace temporairement le DOM avant le chargement de la route.
