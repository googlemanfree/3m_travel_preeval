# Formulaire d’évaluation dynamique mondial

## Objet

Cette proposition définit une architecture de configuration pour couvrir tous les pays du catalogue, sans coder les règles de chaque destination directement dans le composant React. Le moteur de formulaire reste générique ; les pays, programmes, champs, documents, critères et sources sont des données versionnées.

Aucune exigence de visa, de test linguistique ou de document ne doit être publiée comme certaine sans source officielle contrôlée. Une règle incomplète est affichée comme « À confirmer » et ne devient jamais une obligation silencieuse.

## 1. Arborescence fonctionnelle initiale

```text
Catalogue mondial
└── Pays normalisé
    ├── Informations pays
    │   ├── Nom affiché
    │   ├── Code ISO-3166-1 alpha-2 / alpha-3
    │   ├── Région
    │   ├── Variantes de recherche
    │   └── Statut du catalogue
    ├── Registre des sources officielles
    │   ├── Immigration / visa
    │   ├── Ambassade / consulat
    │   ├── Ministère compétent
    │   ├── Portail études / formation
    │   └── Portail emploi lorsque pertinent
    └── Programmes et procédures
        ├── Études
        │   ├── Enseignement supérieur
        │   ├── Formation professionnelle
        │   └── Échange / recherche si validé
        ├── Travail
        │   ├── Travail avec employeur
        │   ├── Travail qualifié / mobilité
        │   └── Recherche d’emploi si officiellement disponible
        ├── Visiteur
        │   ├── Tourisme
        │   ├── Visite familiale
        │   └── Affaires / court séjour
        ├── Regroupement familial
        ├── Transit / e-visa / autres catégories
        └── Parcours à étudier
            └── Formulaire minimal + collecte de sources, sans promesse
```

### Ordre du parcours candidat

1. Choisir le **pays de destination**.
2. Choisir le **type de projet**.
3. Choisir la **procédure ou le programme** lorsque le pays en distingue plusieurs.
4. Charger la version publiée du schéma pays + projet + procédure.
5. Afficher les champs communs puis les sections conditionnelles.
6. Afficher les documents requis, recommandés et à confirmer.
7. Calculer le résultat avec la même version de schéma.
8. Enregistrer le contexte dans l’espace candidat et la fiche administrative.

Le choix du pays intervient avant le type de projet dans l’interface, tandis que le catalogue interne conserve toujours la clé complète `countryCode + projectType + procedureId`.

## 2. Familles de champs

### Champs communs

Ils sont conservés lors d’un changement de pays ou de projet : identité, date de naissance, nationalité, pays de résidence, coordonnées, téléphone/WhatsApp, situation familiale, historique général de mobilité, consentements et disponibilité des pièces.

### Champs pays

Ils ne sont affichés que lorsqu’ils sont pertinents pour le pays : zone de résidence, relation avec une autorité locale, ville ou établissement ciblé, catégorie administrative propre au pays, ou information géographique nécessaire à la procédure.

### Champs programme

Ils dépendent du projet : parcours scolaire pour les études, expérience et métier pour le travail, statut et motif pour le visiteur, lien familial et parrainage pour le regroupement familial.

### Champs conditionnels

Chaque champ peut dépendre d’une réponse précédente. Exemple : une question sur l’employeur n’apparaît que si la procédure exige ou accepte un employeur ; une question sur un certificat linguistique n’apparaît que si le schéma publié la déclare pertinente.

## 3. Modèle TypeScript de configuration

```ts
export type ProjectType =
  | "study"
  | "work"
  | "training"
  | "visitor"
  | "business_visit"
  | "family_reunification"
  | "transit"
  | "other";

export type RuleStatus = "draft" | "validated" | "published" | "retired";
export type SourceStatus = "verified" | "needs_review" | "missing";
export type FieldValueType =
  | "text"
  | "textarea"
  | "date"
  | "number"
  | "boolean"
  | "single_select"
  | "multi_select"
  | "country"
  | "file"
  | "url";

export interface OfficialSource {
  id: string;
  label: string;
  url: string;
  authority: "immigration" | "embassy" | "consulate" | "ministry" | "education" | "employment" | "other";
  status: SourceStatus;
  checkedAt?: string;
  checkedBy?: string;
  note?: string;
}

export interface VisibilityRule {
  fieldId: string;
  operator: "equals" | "not_equals" | "in" | "exists" | "greater_than" | "less_than";
  value?: string | number | boolean | Array<string | number>;
}

export interface EvaluationField {
  id: string;
  label: string;
  valueType: FieldValueType;
  sectionId: string;
  required: boolean;
  helpText?: string;
  options?: Array<{ value: string; label: string }>;
  visibility?: VisibilityRule[];
  requiredWhen?: VisibilityRule[];
  sourceIds: string[];
  sensitive?: boolean;
  preservedOnProgramChange: boolean;
}

export interface DocumentRule {
  id: string;
  label: string;
  category: "identity" | "academic" | "professional" | "financial" | "language" | "family" | "travel" | "other";
  requirement: "required" | "recommended" | "conditional" | "to_confirm";
  condition?: VisibilityRule[];
  acceptedMimeTypes?: string[];
  sourceIds: string[];
  note?: string;
}

export interface LanguageRule {
  id: string;
  languageCode: string;
  proofType?: string;
  requirement: "required" | "recommended" | "conditional" | "to_confirm";
  minimumLevel?: string;
  condition?: VisibilityRule[];
  sourceIds: string[];
}

export interface EligibilityRule {
  id: string;
  label: string;
  condition: VisibilityRule[];
  outcome: "pass" | "review" | "not_satisfied" | "to_confirm";
  explanation: string;
  sourceIds: string[];
}

export interface ScoringRule {
  id: string;
  criterion: string;
  weight: number;
  condition: VisibilityRule[];
  scoreRange: { min: number; max: number };
  candidateVisible: boolean;
  sourceIds: string[];
}

export interface EvaluationSchema {
  schemaId: string;
  countryCode: string;
  projectType: ProjectType;
  procedureId: string;
  version: string;
  status: RuleStatus;
  title: string;
  description: string;
  sections: Array<{
    id: string;
    title: string;
    order: number;
    scope: "common" | "country" | "program" | "documents" | "eligibility";
  }>;
  fields: EvaluationField[];
  requiredDocuments: DocumentRule[];
  languageRequirements: LanguageRule[];
  eligibilityRules: EligibilityRule[];
  scoringRules: ScoringRule[];
  officialSources: OfficialSource[];
  lastReviewedAt?: string;
  nextReviewAt?: string;
  fallbackMode: "minimal_intake" | "manual_review";
}
```

## 4. Schéma par défaut mondial

Le schéma par défaut est volontairement prudent. Il permet de commencer une évaluation pour n’importe quel pays, mais ne transforme pas une information non vérifiée en exigence de visa.

```ts
const DEFAULT_GLOBAL_SCHEMA: Omit<EvaluationSchema, "schemaId" | "countryCode" | "procedureId"> = {
  projectType: "other",
  version: "1.0.0",
  status: "published",
  title: "Évaluation préliminaire — parcours à préciser",
  description: "Collecte initiale avant validation de la procédure et des sources officielles.",
  sections: [
    { id: "identity", title: "Identité et coordonnées", order: 10, scope: "common" },
    { id: "destination", title: "Destination et projet", order: 20, scope: "common" },
    { id: "background", title: "Parcours général", order: 30, scope: "common" },
    { id: "documents", title: "Documents déjà disponibles", order: 40, scope: "documents" },
    { id: "review", title: "Vérification du parcours", order: 50, scope: "eligibility" }
  ],
  fields: [
    { id: "full_name", label: "Nom et prénom", valueType: "text", sectionId: "identity", required: true, sourceIds: [], preservedOnProgramChange: true },
    { id: "birth_date", label: "Date de naissance", valueType: "date", sectionId: "identity", required: true, sourceIds: [], preservedOnProgramChange: true, sensitive: true },
    { id: "nationality", label: "Nationalité", valueType: "country", sectionId: "identity", required: true, sourceIds: [], preservedOnProgramChange: true },
    { id: "residence_country", label: "Pays de résidence", valueType: "country", sectionId: "identity", required: true, sourceIds: [], preservedOnProgramChange: true },
    { id: "email", label: "Adresse e-mail", valueType: "text", sectionId: "identity", required: true, sourceIds: [], preservedOnProgramChange: true },
    { id: "phone", label: "Téléphone / WhatsApp", valueType: "text", sectionId: "identity", required: true, sourceIds: [], preservedOnProgramChange: true },
    { id: "destination_country", label: "Pays de destination", valueType: "country", sectionId: "destination", required: true, sourceIds: [], preservedOnProgramChange: true },
    { id: "project_type", label: "Type de projet", valueType: "single_select", sectionId: "destination", required: true, sourceIds: [], preservedOnProgramChange: true },
    { id: "target_date", label: "Échéance souhaitée", valueType: "date", sectionId: "destination", required: false, sourceIds: [], preservedOnProgramChange: true },
    { id: "education_summary", label: "Résumé du parcours scolaire", valueType: "textarea", sectionId: "background", required: false, sourceIds: [], preservedOnProgramChange: false },
    { id: "work_summary", label: "Résumé du parcours professionnel", valueType: "textarea", sectionId: "background", required: false, sourceIds: [], preservedOnProgramChange: false },
    { id: "available_documents", label: "Documents déjà disponibles", valueType: "multi_select", sectionId: "documents", required: false, sourceIds: [], preservedOnProgramChange: true },
    { id: "additional_context", label: "Contexte ou question", valueType: "textarea", sectionId: "review", required: false, sourceIds: [], preservedOnProgramChange: true }
  ],
  requiredDocuments: [],
  languageRequirements: [],
  eligibilityRules: [],
  scoringRules: [],
  officialSources: [],
  fallbackMode: "manual_review"
};
```

### Règle de sécurité du fallback

Le schéma par défaut ne doit pas afficher « visa admissible », « document obligatoire » ou « score favorable ». Il produit uniquement un état de collecte et de revue manuelle. Le message candidat doit préciser que les exigences du pays et du programme restent à vérifier auprès des sources officielles.

## 5. Exemple de branchement d’un programme validé

Une configuration publiée devient une extension du schéma par défaut :

```text
DE + study + de-study-higher-education
├── Champs communs
├── Parcours académique
├── Établissement / formation ciblée
├── Langue uniquement si la source officielle du programme l’exige
├── Financement uniquement si la procédure vérifiée le prévoit
├── Documents avec statut required / recommended / to_confirm
├── Critères d’éligibilité sourcés
└── Scoring indicatif, jamais présenté comme une décision consulaire
```

Les exemples de pays tels que tests de langue, reconnaissance de diplôme, Campus France, IELTS, TEF/TCF ou codes professionnels doivent être ajoutés uniquement après validation du schéma et de leurs sources. Ils ne font pas partie du défaut mondial.

## 6. Versionnement et changement de pays

Chaque soumission enregistre :

```text
countryCode
projectType
procedureId
schemaId
schemaVersion
selectedAt
submittedAt
```

Lors d’un changement de pays ou de projet :

- les champs communs sont conservés ;
- les champs devenus hors sujet sont masqués et exclus du score ;
- les anciennes réponses sont conservées dans un historique technique versionné, sans être réutilisées automatiquement ;
- les documents requis sont recalculés ;
- le candidat reçoit un message résumant les sections ajoutées ou retirées ;
- le dossier admin affiche l’ancien et le nouveau contexte si une soumission avait déjà été envoyée.

Une évaluation déjà soumise reste liée à sa version d’origine. Une nouvelle version du catalogue ne réécrit pas rétroactivement le bilan existant.

## 7. Sources officielles et registre admin

Chaque règle non commune doit référencer au moins une source. Le registre admin doit conserver le libellé, l’URL HTTPS, l’autorité, la date de contrôle, la personne ayant vérifié et une note. Une URL non vérifiée reste `needs_review` ou `missing` et ne peut pas rendre un champ obligatoire.

Les sources doivent être présentées comme des liens institutionnels exacts. Les guides internes peuvent expliquer le parcours, mais ne remplacent pas le portail officiel de l’autorité compétente.

## 8. Brouillon, doublons et synchronisation admin

Le brouillon est enregistré avec la clé du schéma et reprend le dernier écran validé. Une copie locale peut protéger la saisie hors connexion, mais le serveur reste la source de vérité après authentification.

Avant la création d’un compte ou d’un pré-dossier :

- normaliser l’e-mail et rechercher un compte existant ;
- rechercher les correspondances de nom selon une règle prudente ;
- bloquer la création silencieuse d’un doublon ;
- afficher un avertissement et un lien vers le compte existant lorsque la correspondance est confirmée ;
- journaliser la décision sans exposer de données privées à un autre candidat.

La fiche admin, le bilan, le score, la checklist et l’espace candidat lisent la même paire `schemaId + schemaVersion`. Les contrôles d’accès aux données et aux documents restent côté serveur.

## 9. Critères d’acceptation de la première implémentation

- Les pays du catalogue mondial peuvent pointer vers un schéma, même si certains restent en `manual_review`.
- Un pays et un projet peuvent être ajoutés par configuration.
- Aucun champ spécifique n’est affiché sans condition ou source appropriée.
- Un changement de pays conserve les champs communs et retire du score les champs hors sujet.
- Le candidat et l’administration voient le même contexte versionné.
- Les documents et règles non vérifiés sont explicitement marqués « À confirmer ».
- Les doublons sont détectés avant création d’un compte ou d’un pré-dossier.
- Le typecheck, les tests de schéma, les tests de changement de parcours et les contrôles d’autorisation doivent être verts avant publication.

## Décision demandée

Valider d’abord :

1. les catégories de projet (`study`, `work`, `training`, `visitor`, `business_visit`, `family_reunification`, `transit`, `other`) ;
2. le schéma mondial minimal et son fallback `manual_review` ;
3. la conservation technique des anciennes réponses lors d’un changement de parcours ;
4. le workflow admin de validation des sources et de publication d’une version.
