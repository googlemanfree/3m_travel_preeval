# Audit d’accessibilité et de cohérence premium — 25 août 2026

## Parcours contrôlés sans action sensible

Les entrées publiques, de connexion, client, administrateur et employeur ont été contrôlées visuellement. Les portes d’accès restent visibles et les zones protégées ne déclenchent aucune mutation pendant cet audit. L’administration charge dans la session locale existante ; les accès client et employeur sans session présentent un écran de connexion ou d’accès réservé.

## Constats à corriger dans cette passe

1. La palette combine actuellement plusieurs accents concurrents. Le design doit réserver le bleu à l’action principale, l’orange aux parcours e-Visa, le vert à WhatsApp et aux succès, et supprimer les accents décoratifs non nécessaires.
2. La navigation et le footer présentent des libellés FR/EN mélangés dans l’interface française. Les entrées critiques doivent recevoir des libellés cohérents et explicites.
3. Le bloc QR du footer déborde visuellement à droite sur certaines vues. Il doit être redimensionné et replacé dans le flux responsive.
4. Les cartes et boutons doivent recevoir des focus clavier plus visibles, des cibles tactiles cohérentes et des contrastes renforcés sans modifier les mécanismes d’autorisation.
5. Le tableau de bord administrateur est fonctionnel mais dense. La présente passe doit renforcer la hiérarchie, les surfaces et la lisibilité, sans retirer les contrôles opérationnels existants.

## Vérification après corrections

La seconde revue desktop confirme que le QR Facebook reste désormais dans la colonne du footer sans être rogné. Les entrées client et employeur restent protégées hors session, et l’espace administrateur conserve ses boutons de rafraîchissement, export, priorités, placement et déconnexion. La palette globale s’appuie désormais sur un bleu institutionnel plus cohérent ; l’orange demeure cantonné au parcours e-Visa et le vert aux contacts ou statuts positifs.

La revue mobile confirme que l’entrée employeur ne produit plus de grand panneau vide avant le footer. Le formulaire, les explications de confidentialité et l’indicateur public restent lisibles sur une largeur de 375 px, avec des actions de connexion suffisamment dimensionnées.

Après redémarrage de l’aperçu, une navigation complète vers la connexion client confirme le rendu interactif : labels de champs, affichage du mot de passe, connexion, récupération, renvoi d’e-mail, inscription et liens de contact sont exposés avec des cibles accessibles. Le bref contenu pré-rendu observé lors d’une capture immédiate est remplacé par l’interface React une fois le chargement terminé.
