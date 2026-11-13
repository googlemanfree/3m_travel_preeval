# Fournisseur IA, recherche et coûts — hypothèses à confirmer

**Aucun prix ci-dessous n'est un devis ni un tarif vérifié.** Le modèle de production n'est pas celui qui a servi à développer le site.

## 1. Services déjà intégrés (vérifiés dans le code)
- IA : passerelle Forge de Manus via `invokeLLM` (même clé `BUILT_IN_FORGE_API_KEY` que le reste du site). Le modèle sous-jacent et son tarif ne sont pas visibles dans le dépôt : **à lire sur votre facturation Manus**.
- E-mail : SMTP existant. Stockage : Forge. Base de données : Manus.

## 2. Recommandation
- **Fournisseur** : rester sur la passerelle déjà intégrée (aucune nouvelle clé, aucun nouveau contrat, une seule facture). Classe de modèle : multimodal de gamme intermédiaire avec sortie JSON, suffisant car l'IA ne fait **qu'extraire des faits** ; la notation est déterministe et la rédaction est faite par gabarits (aucun coût de génération).
- **Documents scannés** : lecture visuelle par le même modèle (PDF/image envoyés tels quels, sans service OCR séparé). Désactivée par défaut (voir `AUDIT.md` §4).
- **Recherche de sources** : v1 = référentiel de sources saisi et daté par l'agence (coût nul). Ensuite, si souhaité, une API de recherche à ajouter derrière l'interface `SourceSearch` ; **aucun nom, coordonnée ni CV** ne lui serait transmis (seulement pays et intitulé du métier visé).
- **Limites de traitement** : le CV (extrait masqué, 6 000 caractères) et les pièces transitent par la passerelle puis par le fournisseur de modèle. À obtenir par écrit avant production : durée de conservation des requêtes, usage pour l'entraînement (idéalement exclu), localisation, sous-traitants, procédure de suppression.

## 3. Hypothèses de consommation par bilan
Entrée ≈ 9 000 jetons (consigne 1 000 + extrait de CV ≈ 2 000 + jusqu'à 3 pièces ≈ 6 000), sortie ≈ 1 000 jetons, +10 % de reprises. Lecture visuelle d'un CV scanné : + ≈ 6 000 jetons d'entrée.

## 4. Coût IA mensuel selon trois niveaux de prix hypothétiques (USD)
Prix en USD par million de jetons (entrée / sortie) : bas 0,15 / 0,60 · intermédiaire 3 / 15 · élevé 15 / 75.

| Bilans par mois | Bas | Intermédiaire | Élevé |
|---|---|---|---|
| 100 | ≈ 0,2 | ≈ 4,6 | ≈ 23 |
| 500 | ≈ 1,1 | ≈ 23 | ≈ 115 |
| 1 000 | ≈ 2,2 | ≈ 46 | ≈ 230 |

(Avec lecture visuelle sur tous les dossiers : multiplier par ≈ 1,6.) Ce sont des scénarios de comparaison, pas une prévision.

## 5. Autres postes
| Poste | Estimation |
|---|---|
| OCR séparé | 0 (non utilisé) |
| Recherche | 0 en v1 (référentiel saisi) ; sinon selon l'API choisie, à chiffrer sur devis |
| Stockage | PDF ≈ 60 à 120 Ko : ≈ 0,1 Go par an pour 1 000 bilans mensuels — négligeable ; ajouter l'espace des CV déjà stockés |
| Notifications | 1 e-mail par bilan (+1 en cas de complément) : inclus dans l'offre SMTP actuelle, à vérifier contre ses quotas ; WhatsApp : désactivé |
| Maintenance | Temps de l'équipe : barème, sources, supervision des incidents ; non chiffré ici |

## 6. Garde-fous de coût (implémentés et testés)
Plafond quotidien de traitements (`BILAN_AUTO_DAILY_RUN_LIMIT`) et de budget (`BILAN_AUTO_DAILY_BUDGET_EUR`, comparé au coût estimé `BILAN_AUTO_COST_PER_RUN_EUR`), report au lendemain sans perte, disjoncteur après 3 échecs IA consécutifs, 4 tentatives maximum espacées de 1 min, 5 min, 30 min. Le coût réel par appel n'est pas lu (la passerelle ne le renvoie pas) : le suivi est une estimation à recaler sur la facture.
