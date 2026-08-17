# 3M Travel & Services — Modèle de bilan d’évaluation et prompt IA

> **Usage interne.** Ce modèle est une aide au tri et à l’orientation. Il ne constitue ni une décision officielle d’immigration, ni une offre d’emploi, ni une garantie d’obtention de visa. Toute recommandation doit être validée par un conseiller habilité avant envoi.

## 1. Correction indispensable de la grille fournie

La grille transmise comporte un problème arithmétique : avec **20 points de formation**, **1 point d’expérience**, **1 point de langue**, **30 points de marché** et **10 points de profil**, le maximum atteint **62/100**. Le seuil Luxembourg de 65/100 ne peut donc jamais être atteint. Le modèle ci-dessous conserve les priorités indiquées mais les répartit sur 100 points.

| Critère | Barème proposé | Règle de lecture |
|---|---:|---|
| Formation et diplôme | 20 | Diplôme post-secondaire vérifiable, niveau et cohérence avec le métier. |
| Expérience professionnelle | 20 | Durée cumulée, continuité, pertinence des missions et preuves disponibles. |
| Langues | 15 | Langues déclarées ; une preuve officielle est à demander avant toute conclusion. |
| Tension du marché | 30 | Adéquation indicative entre métier, compétences et marché ciblé. À vérifier au cas par cas. |
| Profil global et projet | 15 | Âge déclaré, permis, certifications, cohérence du projet et mobilité. |
| **Total** | **100** | Seuil interne Luxembourg proposé : **65/100**. |

## 2. Exemple professionnel détaillé — profil fictif

Le cas suivant est fictif. Il sert uniquement à montrer la présentation attendue.

| Élément | Exemple de données |
|---|---|
| Candidat | **Jean KOUAM** — dossier de démonstration `TEST-EX-2026-001` |
| Âge déclaré | 31 ans |
| Formation | Master en logistique et transport, 2020 |
| Expérience | 6 ans comme coordinateur logistique et approvisionneur |
| Langues déclarées | Français courant ; anglais intermédiaire à documenter |
| Éléments complémentaires | Permis B, certification Excel avancé, expérience ERP |
| Projet | Recherche d’opportunités de mobilité professionnelle en Europe |

```text
╔══════════════════════════════════════════════════════════════════════════════════════╗
║               3M TRAVEL & SERVICES — ÉVALUATION PRÉLIMINAIRE 2026                  ║
║             DIRECTION MOBILITÉ INTERNATIONALE & RECRUTEMENT                          ║
╚══════════════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────────────┐
│ OBJET     : BILAN PRÉLIMINAIRE D’ADMISSIBILITÉ ET ORIENTATION                         │
│ RÉFÉRENCE : TEST-EX-2026-001                                                          │
│ CANDIDAT  : JEAN KOUAM (PROFIL FICTIF DE DÉMONSTRATION)                               │
│ SECTEUR   : LOGISTIQUE, APPROVISIONNEMENT ET COORDINATION DES FLUX                    │
│ STATUT    : 86 / 100 — PROFIL À APPROFONDIR AVANT ORIENTATION                         │
└──────────────────────────────────────────────────────────────────────────────────────┘

Bonjour Monsieur KOUAM,

Votre profil de démonstration a été examiné au moyen de la grille interne 3M Travel.
Le résultat constitue une orientation préliminaire : seules les pièces justificatives,
les conditions du programme visé et, le cas échéant, l’employeur ou l’autorité compétente
permettent de confirmer une démarche.

┌──────────────────────┬──────────────────────────────────────┬─────────────┐
│ CRITÈRE              │ ANALYSE                               │ NOTE        │
├──────────────────────┼──────────────────────────────────────┼─────────────┤
│ Formation            │ Master cohérent avec le secteur       │ 20 / 20     │
│ Expérience           │ 6 ans déclarés ; preuves à contrôler  │ 18 / 20     │
│ Langues              │ Français courant ; anglais à prouver  │ 12 / 15     │
│ Tension du marché    │ Logistique : demande à vérifier        │ 25 / 30     │
│ Profil et projet     │ 31 ans, permis et ERP déclarés        │ 11 / 15     │
├──────────────────────┼──────────────────────────────────────┼─────────────┤
│ TOTAL                │ ÉVALUATION PRÉLIMINAIRE               │ 86 / 100    │
└──────────────────────┴──────────────────────────────────────┴─────────────┘

ORIENTATION PRÉLIMINAIRE
1. Option principale : examiner les opportunités Luxembourg correspondant au métier,
   sous réserve d’une offre d’employeur, des critères à jour et de la vérification des pièces.
2. Option complémentaire : examiner le Canada uniquement après vérification du programme,
   de l’âge, du niveau de diplôme, des langues et de tous critères d’admissibilité applicables.
3. Plan alternatif : examiner Slovénie, Tchéquie ou Pologne selon l’offre réelle, le poste,
   les conditions contractuelles et les règles en vigueur au moment de la candidature.

PIÈCES À VÉRIFIER AVANT TOUTE PROCÉDURE
[ ] Passeport valide et copie lisible
[ ] Diplôme et relevés de notes
[ ] Attestations d’emploi sur papier à en-tête, contrats et bulletins de paie
[ ] CV actualisé et références professionnelles si disponibles
[ ] Résultat linguistique officiel si exigé par le programme ou l’employeur

PROCHAINE ÉTAPE
Activez ou consultez votre espace client sécurisé pour recevoir les demandes de pièces,
les messages du conseiller et la version PDF du bilan. Les frais éventuels, les prestations
incluses et les modalités de paiement doivent être affichés et acceptés avant engagement.

CONTACTS 3M TRAVEL & SERVICES
Téléphone : +1 672 897 2999 / +237 698 104 832 / +237 620 996 045
E-mail    : hello@3mtravelagency.com
Portail   : https://www.3mtravelagency.com/mon-espace

AVIS IMPORTANT : ce bilan est une évaluation préliminaire interne. Il ne garantit ni emploi,
ni visa, ni admission dans un programme. Les informations déclarées doivent être vérifiées.
```

## 3. Prompt professionnel prêt à utiliser

Utilisez le prompt suivant après extraction structurée du CV. Remplacez `{{...}}` uniquement par des données vérifiées ou explicitement déclarées par le candidat.

```text
RÔLE
Tu es l’assistant de pré-évaluation de 3M Travel & Services. Tu produis un bilan interne,
professionnel, prudent et vérifiable pour aider un conseiller humain à orienter un candidat.

DONNÉES CANDIDAT
- Nom : {{nom_complet}}
- Référence dossier : {{numero_dossier}}
- Âge déclaré : {{age_ou_non_renseigne}}
- Formation : {{formation}}
- Expérience : {{experience_detaillee}}
- Français : {{niveau_francais}}
- Anglais : {{niveau_anglais}}
- Secteur / métier : {{secteur_metier}}
- Certifications, permis et compétences : {{atouts}}
- Projet / destinations demandées : {{projet}}
- Informations inconnues ou à vérifier : {{informations_a_verifier}}

GRILLE INTERNE SUR 100
1. Formation et diplôme : 0–20.
2. Expérience professionnelle : 0–20.
3. Langues déclarées et preuves disponibles : 0–15.
4. Adéquation indicative secteur / marché ciblé : 0–30.
5. Profil global et cohérence du projet : 0–15.

RÈGLES IMPÉRATIVES
- Ne jamais inventer une date, un diplôme, une langue, une offre d’emploi, un programme,
  une règle d’immigration ou un résultat de marché.
- Toute information absente doit apparaître comme « Non renseigné » ou « À vérifier ».
- Ne jamais promettre ni visa, ni contrat, ni admission, ni délai garanti.
- Ne pas présenter le score comme une décision officielle d’un gouvernement, d’un employeur
  ou d’un organisme de recrutement.
- Pour le Canada, le Luxembourg ou tout autre pays, indiquer « à vérifier selon les critères
  et règles en vigueur » plutôt que d’affirmer une admissibilité officielle.
- Le score doit être la somme exacte des cinq lignes du barème. Si une note est incertaine,
  la justifier et adopter une notation prudente.
- Inclure une check-list de pièces et des recommandations concrètes de vérification.
- Mentionner que la validation finale est effectuée par un conseiller 3M Travel.

FORMAT DE SORTIE
Réponds uniquement dans un bloc ```text``` monospacé. Utilise des encadrés ASCII simples.
Le bilan doit contenir :
1. En-tête 3M Travel & Services et référence dossier.
2. Tableau de score avec motif, note par critère et total /100.
3. Statut interne : « à approfondir », « orientation à examiner » ou « informations insuffisantes ».
4. Options d’orientation formulées comme hypothèses à vérifier, jamais comme garanties.
5. Check-list personnalisée de pièces.
6. Prochaine action dans l’espace client.
7. Avis de non-garantie et validation humaine.

Génère maintenant le bilan à partir des données fournies.
```

## 4. Mode d’utilisation recommandé

| Étape | Règle opérationnelle |
|---|---|
| Extraction CV | Conserver le texte source et marquer les données incertaines. |
| Pré-remplissage | Laisser le candidat vérifier ou corriger chaque champ avant soumission. |
| Calcul | Vérifier que les cinq notes donnent exactement 100 points maximum. |
| Relecture humaine | Valider score, formulations et destinations avant l’envoi. |
| Envoi | Déposer le PDF dans l’espace candidat et envoyer un lien de connexion sécurisé. |

> **Recommandation de production :** le système doit générer d’abord des données structurées (JSON), puis rendre le bilan DACTYLO. Cette séparation réduit les erreurs de calcul, facilite l’audit et évite qu’une mise en page masque une donnée manquante.
