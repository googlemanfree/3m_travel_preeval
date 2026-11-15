# Lenteur de l'administration et du poste de pilotage 360 — mesures et correctifs

## Comment c'est mesuré
Base MariaDB locale avec 3 001 dossiers en ligne, 3 001 comptes, 6 100 documents et un dossier chargé (200 lignes d'historique, 100 tâches, 100 documents, 50 versions de bilan de 100 Ko). Un petit relais impose **50 ms d'aller-retour** vers la base (ordre de grandeur d'une base hébergée à distance). Même requête, ancien code (branche principale) et nouveau code, 5 essais chacun. Ce n'est pas la base réelle de Manus : les gains absolus y seront plus grands si la base est plus lointaine ou plus volumineuse.

| Appel | Avant | Après |
|---|---|---|
| Fiche 360 : durée | 0,55 à 0,74 s | 0,29 à 0,30 s |
| Fiche 360 : taille transférée | 5,16 Mo | 0,17 Mo (−97 %) |
| Liste des candidats : durée | 0,35 à 0,50 s | 0,18 à 0,21 s |
| Tableau de bord : taille du fichier JavaScript | 1 140 Ko | 920 Ko (la fiche 360, 223 Ko, se charge à l'ouverture d'une fiche) |

## Causes trouvées et corrigées
1. **La fiche 360 transportait le contenu complet de toutes les versions de bilan** (jusqu'à 50 × plusieurs centaines de Ko) alors que l'écran n'en lit que le numéro, l'état et la date. Rafraîchie toutes les 30 secondes, elle re-téléchargeait et re-dessinait plusieurs Mo en continu.
2. **Requêtes enchaînées au lieu d'être lancées ensemble** : une dizaine d'allers-retours consécutifs vers la base. Les requêtes indépendantes (documents agence, avancement, audit de paiement, validation de reçu, versions de bilan, résumé placement, dossiers frères, sélection employeur) partent maintenant en même temps que le lot principal ; le dossier opérationnel et la fiche source sont lus ensemble.
3. **Plantages : une table ou une colonne facultative absente (base non migrée) faisait échouer toute la fiche.** Ces requêtes passent désormais par `safeCollection` : la fiche s'ouvre, la partie concernée est vide. Chaque onglet de la fiche est en plus isolé par un garde-fou d'erreur : une erreur d'affichage n'efface plus toute la fiche, l'onglet propose de réessayer.
4. **La liste des candidats lisait toutes les colonnes de toutes les lignes** (70 colonnes et plus pour les dossiers) à chaque affichage et chaque rafraîchissement, puis filtrait en mémoire, et rapatriait jusqu'à 10 000 lignes de documents pour les compter. Elle lit maintenant les colonnes utiles, compte les documents dans la base, et les appels simultanés (tableau de bord, liste, compteurs) partagent un seul chargement pendant 1,5 seconde.
5. La fiche 360 est rafraîchie **une fois par minute** (30 secondes pour la liste) ; chaque action de l'administrateur la rafraîchit aussitôt.

## Ce qui n'est pas fait (et pourquoi)
- Filtre et pagination **dans la base** pour la liste : chantier plus large (la liste combine trois sources). Les gains ci-dessus suffisent tant que le volume reste de quelques milliers de dossiers ; au-delà, ce chantier devient nécessaire.
- Index sur les e-mails : la recherche des autres procédures d'un même e-mail compare `LOWER(TRIM(e-mail))`, ce qui parcourt la table. Elle est conservée telle quelle, parce que la base d'hébergement peut être sensible à la casse ; un index « sur expression » ou une colonne normalisée demandent une migration.
- Autres écrans d'administration (tableau de bord complet, paiements, vols) : non mesurés ici. Prochaine étape recommandée : relever, sur le site réel, les appels les plus lents et les plus lourds (onglet Réseau du navigateur) et appliquer la même méthode.
- Fonctions « plus flexible et plus intelligent » de la fiche : proposées ci-dessous, non construites dans ce lot.

## Proposition pour la suite (fiche 360)
Alertes du dossier calculées (CV illisible, pièce à mettre à jour, paiement en attente, incohérence pays/visa, bilan prêt) en tête de fiche ; mémorisation de l'onglet et des sections repliées par administrateur ; actions rapides au clavier ; chargement des onglets lourds (documents, échanges, historique) uniquement à l'ouverture, avec données chargées à la demande.

## Liste des candidats : pagination et filtres par la base

**Avant.** À chaque affichage ou rafraîchissement, la liste rapatriait les 5 000 derniers dossiers en ligne, les 5 000 derniers dossiers agence et 5 000 comptes, puis filtrait, triait et découpait en mémoire. Conséquences mesurées sur une base de 11 389 dossiers : la liste n'en voyait que 5 009, et la recherche d'un dossier au-delà de la 5 000e ligne ne trouvait rien (0 résultat au lieu de 2 796).

**Maintenant** (`server/services/candidateListQuery.ts`) :
- chaque source (dossiers en ligne, dossiers agence, comptes sans dossier) est filtrée et comptée en SQL ; les compteurs par étape, « payés », « sans dossier », « CV à traiter » et « CV reçus » sortent d'une seule requête groupée par source ;
- seules les lignes de la page demandée sont lues (par source, les `page × taille` premières, fusionnées puis découpées) ; documents et portraits ne sont cherchés que pour ces lignes ;
- compteurs et page partent dans le même aller-retour vers la base ;
- l'export CSV utilise la même requête (une page de 10 000 lignes) et n'est plus limité aux 5 000 derniers dossiers par source ;
- côté écran : la recherche attend 300 ms de pause de frappe, et la liste précédente reste affichée pendant le chargement de la suivante.

**Exactitude.** `server/candidateListQuery.db.test.ts` compare, sur une base réelle et des données variées (statuts, paiements, bandes de score, CV, bilans publiés, portraits, comptes liés ou supprimés, référence agence et compte), le résultat SQL à l'ancien calcul en mémoire : mêmes lignes, mêmes valeurs, mêmes compteurs, 26 combinaisons de filtres et de tris.

**Différences connues, volontaires.**
- Tri par nom : la base trie avec son interclassement, le serveur re-trie la page fusionnée en français ; deux noms ne différant que par un accent peuvent se départager autrement qu'avant.
- Tri par score : les dossiers agence et les comptes (score 0) se départagent par date.
- Si la table du parcours de validation n'existe pas (base non migrée), la liste fonctionne sans la mention « bilan publié », comme avant.

**Pistes non faites (à décider).** Index sur `applications.email`, `evaluations.email`, `client_documents.candidateEmail` : les rapprochements se font aujourd'hui sans index (sous-requêtes matérialisées par la base, rapides jusqu'à plusieurs dizaines de milliers de lignes). Les ajouter demande de toucher à la base de Manus : à valider avec vous avant.
