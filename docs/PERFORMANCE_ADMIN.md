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

## Audit des écrans d'administration (novembre 2026)

**Méthode.** `scripts/perf-admin-audit.mts` appelle chaque requête des écrans d'administration sur une base JETABLE (3 001 dossiers en ligne, 3 009 comptes, 5 945 documents) et relève, pour chacune, la durée médiane, le volume envoyé par la base, le nombre d'instructions SQL et la taille de la réponse :

```bash
BILAN_AUTO_TEST_DATABASE_URL=mysql://bt:bt@localhost:3306/bilan_test npx tsx scripts/perf-admin-audit.mts
```

**Résultats (base locale : sans latence réseau ; chaque instruction SQL de plus coûte en réalité un aller-retour vers la base de Manus).**

| Requête | Avant | Après | Cause |
|---|---|---|---|
| `admin.listCandidates` (liste principale du tableau de bord) | 3 815 ms | ~200 ms | le parcours de chaque dossier était recalculé 3 fois par dossier (plus de 9 000 calculs) ; il est maintenant gardé par combinaison pays/visa/programme |
| `adminCandidateManagement.listPreDossierAccounts` | 507 instructions | 8 | une lecture du paiement d'ouverture par compte (500 comptes) → une seule lecture pour tous |
| `adminCandidateManagement.listCandidatesWithoutEvaluation` | 7 Mo, 2 000 comptes | 175 Ko, 50 comptes | liste complète avec un brouillon d'e-mail par ligne ; maintenant par pages de 50, bouton « Afficher 50 de plus » |
| `adminDocuments.overview` | 101 instructions (jusqu'à ~1 500 pour 300 évaluations) | 3 | cinq lectures par évaluation → trois lectures pour toute la liste |
| `adminInsights.adminProofQueue` | une vérification à la fois, jusqu'à 400 candidats | par groupes de 10 | lectures en parallèle, ordre conservé |
| `adminOps.adminSystemHealth` | 26 contrôles de tables à la suite | 6 à la fois | idem |
| toute lecture admin | +1 aller-retour avant chaque requête | supprimé | le journal d'audit ne concerne que les modifications ; une lecture n'a pas besoin de retrouver le compte avant de commencer |

**Constats sans correction.**
- `adminDashboardStats.*` (4 requêtes) interroge des colonnes qui n'existent pas dans la table `applications` (`status`, `destinationCountry`) et échoue toujours. Aucune page ne l'appelle aujourd'hui (le composant `AdminDashboardAdvanced` n'est importé nulle part) : à supprimer ou à réécrire si cet écran doit revenir.
- `admin.listCandidates` renvoie encore toute la liste (6,4 Mo pour 3 010 lignes, avant compression) : le tableau de bord calcule ses compteurs et son tableau de suivi sur cette liste entière. Le rendre paginé suppose de déplacer ces compteurs côté serveur, comme pour la liste des candidats ; non fait ici.
- Les lectures qui ramènent 120 à 280 Ko de la base pour produire quelques lignes (`adminDataCoherence.report`, `adminInsights.adminDataQuality`, `listRedundantPreAccounts`, `listCockpitControlBoard`) restent sous 50 ms ici ; à surveiller si les tables grossissent.

## Classement rapide de la liste des candidats

Quatre onglets au-dessus des filtres, chacun avec son effectif (calculé avec la recherche et les filtres actifs, mais sans le classement lui-même : les chiffres ne bougent pas quand on change d'onglet) :

| Onglet | Règle |
|---|---|
| Tous | aucun classement |
| CV reçu à traiter | CV reçu (envoyé à l'évaluation, déposé dans l'espace client ou sur le compte) et pas encore évalué |
| Non évalués | ni bilan envoyé, ni évaluation validée par un conseiller |
| Déjà évalués | bilan envoyé ou publié au candidat, OU évaluation validée par un conseiller hors ligne (appel, agence, e-mail) |

Chaque ligne porte aussi un repère « Évalué » / « Non évalué ». Le classement se combine avec la recherche, l'étape, le paiement, la destination et les boutons CV. Un candidat dont l'évaluation a été validée hors ligne n'apparaît plus dans « CV reçu à traiter ».

## Liste principale du tableau de bord : pagination côté serveur

`admin.listCandidates` renvoyait toute la liste (6,4 Mo pour 3 010 lignes) et ne lisait que les 100 dossiers les plus récents de chaque source tant qu'on ne tapait pas une recherche : un dossier plus ancien restait invisible.

- Tous les dossiers sont lus (jusqu'à 5 000 par source, sur les seules colonnes utilisées) puis découpés en pages côté serveur : réponse de 6 477 Ko à 309 Ko pour une page de 100 lignes (mesure locale).
- Nouveaux paramètres `page` et `pageSize` (25, 50, 100 ou 200 à l'écran, 50 par défaut). Sans `pageSize`, `limit` donne la taille de la page : l'annuaire de l'onglet Documents, qui demande 200 lignes, n'est pas touché.
- Les compteurs du haut de page (éval. 48 h, bilan dispo, documents, soumis, décision favorable, en ligne, agence), l'encart « Déclarations préalables à contrôler » et les échéances de la file de priorités sont calculés par le serveur sur toute la liste filtrée (`summary`), plus déduits des lignes reçues.
- La recherche attend 300 ms de pause de frappe.
- À savoir : le tableau Kanban, la file « Aujourd'hui » et le tri par action suivante travaillent sur la page affichée ; avec le tri par défaut (priorité), la première page porte les dossiers les plus urgents.

## Comptes à ouvrir : CV et documents de l'évaluation visibles

- Les pièces, CV et documents n'étaient lus que par trois requêtes globales plafonnées (5 000 fichiers, 10 000 évaluations, sans ordre) : au-delà, des CV et des pièces devenaient invisibles. Elles sont maintenant limitées aux comptes affichés.
- Les documents déposés à l'évaluation (table `client_documents`) n'étaient jamais comptés ni listés : ils sont comptés dans « pièces » et listés, avec un lien, dans la fiche du pré-dossier. Un CV déposé ainsi compte comme CV reçu (aussi dans le classement de la liste des candidats).
- La recherche est faite par la base avant la limite de 500 comptes.

## Dossiers avec CV : prioritaires pour le traitement du bilan

Un dossier dont le CV est reçu et qui n'est pas encore évalué (ni bilan envoyé ou publié, ni évaluation validée par un conseiller) passe avant tout le reste, du plus ancien au plus récent :

- **Liste principale du tableau de bord** (tri « priorité ») : en tête, avec le repère « CV reçu · bilan à traiter » et un bandeau qui annonce leur nombre, avec un lien vers la liste des candidats.
- **Priorités de l'équipe** : nouvelle file « CV reçu — bilan à traiter », toujours au-dessus des autres files, quelle que soit leur urgence. Elle n'a aucun effet sur l'activation automatique (limitée à la file « prêts à activer »).
- **Liste des candidats** : nouveau tri « Priorité : CV à traiter d'abord », choisi par défaut (le tri « Plus récents » reste disponible).

CV reçu = CV de l'évaluation, CV du compte, CV déposé à l'évaluation (documents) ou CV du dossier en ligne. Les bilans automatisés (`/admin/bilans`) traitent leur file dans l'ordre d'arrivée ; ils ne sont pas réordonnés.
