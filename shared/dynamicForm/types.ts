/**
 * Moteur de formulaire dynamique de l'évaluation : types communs.
 *
 * Le formulaire n'est plus une liste fixe de champs. Il est recomposé à chaque choix du candidat à partir de couches :
 *   profil (études, expérience, langues) → programme / visa choisi → domaine métier → pays de destination.
 * Chaque champ sait d'où il vient (`layer`), ce qui permet d'expliquer au candidat pourquoi une question est apparue.
 *
 * Règle de contenu : les questions recueillent des déclarations du candidat. Elles n'affirment aucune condition d'entrée,
 * aucun seuil, aucun délai ni aucun montant : ceux-ci viennent de la source officielle de chaque pays.
 */

export const PROJECT_KINDS = ["travail", "etudes", "tourisme", "evisa", "immigration"] as const;
export type ProjectKind = (typeof PROJECT_KINDS)[number];

export type FieldKind = "text" | "textarea" | "select" | "date";
export type FormLayer = "profil" | "programme" | "domaine" | "pays";

export type FieldOption = { value: string; label: string };

/** Une question de suivi n'apparaît que si la réponse à `key` est dans `in` (ou hors de `notIn`). */
export type FieldCondition = { key: string; in?: string[]; notIn?: string[] };

export type DynamicField = {
  key: string;
  label: string;
  kind: FieldKind;
  options?: FieldOption[];
  placeholder?: string;
  help?: string;
  required?: boolean;
  showIf?: FieldCondition[];
  /** `column` : champ déjà enregistré dans une colonne de l'évaluation ; `detail` : enregistré dans les détails du projet. */
  storage: "column" | "detail";
  wide?: boolean;
  maxLength?: number;
};

export type DynamicSection = {
  id: string;
  layer: FormLayer;
  title: string;
  intro?: string;
  /** Étiquette affichée au candidat : « Ajouté pour : Formation professionnelle ». */
  chip?: string;
  fields: DynamicField[];
};

export type FormValues = Record<string, string>;

/** Champs enregistrés dans les colonnes de l'évaluation (les autres vont dans `projectDetails`). */
export const COLUMN_FIELD_KEYS = [
  "educationLevel", "diplomaTitle", "graduationYear", "fieldOfStudy",
  "employmentStatus", "currentJobTitle", "yearsOfExperience", "industrySector", "mainTasks",
  "frenchLevel", "englishLevel", "languageTestsTaken",
] as const;
export type ColumnFieldKey = (typeof COLUMN_FIELD_KEYS)[number];
export const isColumnFieldKey = (key: string): key is ColumnFieldKey => (COLUMN_FIELD_KEYS as readonly string[]).includes(key);

/** Une condition est vraie si la réponse du parent (déjà visible) est dans `in`, ou hors de `notIn`. */
export function conditionHolds(condition: FieldCondition, values: FormValues): boolean {
  const answer = (values[condition.key] ?? "").trim();
  if (condition.in && !condition.in.includes(answer)) return false;
  if (condition.notIn && condition.notIn.includes(answer)) return false;
  return true;
}

/**
 * Champs réellement visibles, dans l'ordre. Un champ de suivi dont le parent est lui-même masqué reste masqué
 * (la réponse du parent masqué est ignorée), pour éviter les réponses orphelines.
 */
export function visibleFields(fields: DynamicField[], values: FormValues): DynamicField[] {
  const effective: FormValues = {};
  const shown: DynamicField[] = [];
  for (const field of fields) {
    if (field.showIf && !field.showIf.every((condition) => conditionHolds(condition, effective))) continue;
    shown.push(field);
    const value = (values[field.key] ?? "").trim();
    if (value) effective[field.key] = value;
  }
  return shown;
}
