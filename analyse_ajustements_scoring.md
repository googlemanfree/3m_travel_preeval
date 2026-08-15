# Analyse technique et priorisation des ajustements du moteur de scoring

En examinant le fichier `server/evaluationService.ts` et l'architecture des formulaires de pré-évaluation, nous identifions **quatre points précis** du moteur de scoring qui méritent d'être ajustés en priorité pour renforcer la rigueur, la transparence et la fiabilité juridique de l'agence **Prime Travel Service**.

---

## 1. Remplacement des valeurs par défaut en cas d’absence de `scoringDetails`

### Le problème actuel
Dans `extractScoringCriteria(app: Application)`, lorsqu'un enregistrement ne possède pas de `scoringDetails` sérialisé en JSON, le système applique des valeurs par défaut fixes :
```ts
let criteria: ScoringCriteria = {
  education: 15,    // sur 25
  experience: 15,   // sur 25
  language: 12,     // sur 20
  sector: 12,       // sur 20
  ageAdjustment: 6, // sur 10
};
```
Cela produit un score de base de 60/100, qui est ensuite multiplié par le coefficient du pays (ex. Canada : `60 * 1.02 = 61`). Un candidat dont le profil n’a pas pu être parsé correctement se voit attribuer un score « admissible » par défaut, ce qui peut créer un faux espoir ou fausser l'analyse de l'administrateur.

### Ajustement prioritaire
- **Exiger un calcul explicite** à partir des données brutes du formulaire (diplôme, années d'expérience, niveau de langue déclaré) dès la soumission, plutôt que de s'appuyer sur des valeurs par défaut en cas de lecture JSON échouée.
- En cas de données incomplètes, affecter un statut explicite `EN_ATTENTE_COMPLEMENT` plutôt qu'un score arbitraire.

---

## 2. Distinction stricte entre les scores réglementaires (ex. Canada Express Entry / Arrima) et les estimations d’agence

### Le problème actuel
Le moteur applique des multiplicateurs forfaitaires globaux (ex. +2% pour le Canada, -25% pour le Luxembourg, +5% pour la Pologne). Bien que ces coefficients reflètent la tension du marché du travail, ils ne simulent pas la grille de points réelle des programmes (comme le système CRS du Canada sur 1 200 points ou les quotas ministériels luxembourgeois).

### Ajustement prioritaire
- **Clarifier l'intitulé des rapports** : Remplacer l'appellation brute « Score d'admissibilité » par **« Indice de Faisabilité Professionnelle 3M (IFP 3M) »** ou **« Score d'Évaluation Préliminaire »**.
- Cela protège l'agence contre toute réclamation juridique d'un candidat qui confondrait une pré-évaluation d'agence en 48h avec une décision officielle d'immigration émise par un gouvernement étranger.

---

## 3. Dynamisation des critères d’âge et de pondération linguistique

### Le problème actuel
L’ajustement lié à l’âge (`ageAdjustment`, sur 10 points) et le niveau de langue (`language`, sur 20 points) reposent souvent sur des tranches rigides ou des libellés textuels simples (*Débutant*, *Intermédiaire*, *Avancé*) sans vérifier l'adéquation avec les grilles officielles (ex. paliers CLB pour le Canada).

### Ajustement prioritaire
- **Lier l’âge au barème officiel de la destination** : Pour le Canada, les points d'âge culminent entre 20 et 29 ans et décroissent progressivement après 30 ans. Le moteur actuel devrait appliquer une courbe dégressive exacte plutôt qu'une attribution linéaire.
- **Valoriser les tests officiels** : Si le candidat indique avoir passé un test certifié (TCF Canada, IELTS, TEF), appliquer un bonus de pondération substantiel sur la section linguistique.

---

## 4. Traçabilité des modifications administratives du score

### Le problème actuel
Lorsqu'un administrateur examine un dossier et ajuste manuellement l'évaluation dans le back-office, la modification met à jour le score global sans consigner systématiquement la raison de la modification dans le journal d'audit (`adminActivityLogs`).

### Ajustement prioritaire
- **Journalisation obligatoire des dérogations** : Si l'administrateur modifie manuellement un score ou un badge (ex. faire passer un profil de *Modéré* à *Recommandé*), l'interface doit exiger un court motif justificatif enregistré dans l'historique d'audit, garantissant une transparence totale entre les conseillers en agence.

---

## Synthèse des priorités d'ajustement

| Priorité | Élément du moteur de scoring | Action corrective recommandée |
| :---: | :--- | :--- |
| **1 (Haute)** | Valeurs par défaut (`scoringDetails`) | Remplacer les notes arbitraires par un calcul dynamique ou un statut d'attente |
| **2 (Haute)** | Intitulé des scores | Clarifier qu'il s'agit d'un indice d'agence et non d'une garantie d'immigration |
| **3 (Moyenne)**| Courbe d'âge et langues | Implémenter une décote d'âge non linéaire et valoriser les tests officiels |
| **4 (Basse)**  | Override administrateur | Exiger un motif lors de la modification manuelle d'un score en back-office |
