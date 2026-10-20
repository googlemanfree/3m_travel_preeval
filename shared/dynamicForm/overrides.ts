import { containsForbiddenPromise } from "../cvtheque";
import type { DynamicField, DynamicSection, FieldKind, FieldOption, ProjectKind } from "./types";
import { PROJECT_KINDS } from "./types";

/**
 * Questions modifiables par l'administration, sans code : masquer, renommer, rendre obligatoire ou facultative, ajouter.
 * Une règle s'applique à un contexte (type de projet, visa ou programme, domaine, pays) ; un contexte vide = tous.
 * Les règles s'ajoutent au moteur : elles ne contiennent jamais de condition d'entrée et ne peuvent pas promettre un résultat.
 */
export const OVERRIDE_ACTIONS = ["hide", "relabel", "require", "optional", "add"] as const;
export type OverrideAction = (typeof OVERRIDE_ACTIONS)[number];
export const CUSTOM_FIELD_PREFIX = "custom_";
export const OVERRIDE_SECTIONS = ["education", "experience", "languages", "program", "domain", "country"] as const;
export type OverrideSection = (typeof OVERRIDE_SECTIONS)[number];

export type OverridePayload = {
  label?: string;
  help?: string;
  placeholder?: string;
  kind?: FieldKind;
  options?: FieldOption[];
  required?: boolean;
  section?: OverrideSection;
};

export type FormOverride = {
  id?: number;
  fieldKey: string;
  action: OverrideAction;
  projectKind?: ProjectKind | null;
  programId?: string | null;
  domainId?: string | null;
  countryCode?: string | null;
  payload?: OverridePayload | null;
  active?: boolean;
};

export type OverrideContext = { kind: ProjectKind; programId: string; domainId: string | null; countryCode: string | null };

export const overrideMatches = (override: FormOverride, context: OverrideContext): boolean =>
  override.active !== false
  && (!override.projectKind || override.projectKind === context.kind)
  && (!override.programId || override.programId === context.programId)
  && (!override.domainId || override.domainId === context.domainId)
  && (!override.countryCode || override.countryCode.toUpperCase() === (context.countryCode ?? "").toUpperCase());

export function parseOverridePayload(json: string | null | undefined): OverridePayload | null {
  if (!json) return null;
  try {
    const parsed: unknown = JSON.parse(json);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as OverridePayload) : null;
  } catch {
    return null;
  }
}

const KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]{1,59}$/;
const OPTION_VALUE_PATTERN = /^[a-z0-9_]{1,40}$/;
const FIELD_KINDS: FieldKind[] = ["text", "textarea", "select", "date"];

/** Contrôle d'une règle avant enregistrement : message d'erreur lisible, ou null si elle est acceptable. */
export function validateOverride(override: FormOverride): string | null {
  if (!OVERRIDE_ACTIONS.includes(override.action)) return "Action inconnue.";
  if (!KEY_PATTERN.test(override.fieldKey)) return "La clé de la question est invalide.";
  if (override.projectKind && !PROJECT_KINDS.includes(override.projectKind)) return "Type de projet inconnu.";
  if (override.countryCode && !/^[A-Za-z]{2}$/.test(override.countryCode)) return "Le pays doit être un code à deux lettres.";
  const payload = override.payload ?? {};
  const texts = [payload.label, payload.help, payload.placeholder, ...(payload.options ?? []).map((option) => option.label)].filter((text): text is string => typeof text === "string" && text.length > 0);
  if (texts.some((text) => containsForbiddenPromise(text))) return "Ce texte promet un résultat (« garanti », « admissible »…) : reformulez-le.";
  if (payload.label !== undefined && (payload.label.trim().length < 3 || payload.label.length > 200)) return "Le libellé doit faire entre 3 et 200 caractères.";
  if (payload.help !== undefined && payload.help.length > 400) return "L'aide est limitée à 400 caractères.";
  if (override.action === "add") {
    if (!override.fieldKey.startsWith(CUSTOM_FIELD_PREFIX)) return `Une question ajoutée a une clé qui commence par « ${CUSTOM_FIELD_PREFIX} ».`;
    if (!payload.label || payload.label.trim().length < 3) return "Indiquez le libellé de la question.";
    if (payload.kind && !FIELD_KINDS.includes(payload.kind)) return "Type de champ inconnu.";
    if (payload.kind === "select") {
      const options = payload.options ?? [];
      if (options.length < 2 || options.length > 12) return "Une liste propose entre 2 et 12 choix.";
      if (options.some((option) => !OPTION_VALUE_PATTERN.test(option.value) || option.label.trim().length < 1 || option.label.length > 120)) return "Chaque choix a une valeur simple (lettres minuscules, chiffres, _) et un libellé.";
      if (new Set(options.map((option) => option.value)).size !== options.length) return "Les valeurs des choix doivent être différentes.";
    }
    if (payload.section && !OVERRIDE_SECTIONS.includes(payload.section)) return "Section inconnue.";
  } else if (override.fieldKey.startsWith(CUSTOM_FIELD_PREFIX) && override.action === "hide") {
    return null;
  }
  if (override.action === "relabel" && !payload.label && !payload.help && !payload.placeholder) return "Indiquez au moins un nouveau libellé, une aide ou un exemple.";
  return null;
}

/** Applique les règles qui concernent le contexte, dans l'ordre de création. Sans règle, rend les sections inchangées. */
export function applyFormOverrides(sections: DynamicSection[], overrides: FormOverride[] | undefined, context: OverrideContext): DynamicSection[] {
  const active = (overrides ?? []).filter((override) => overrideMatches(override, context));
  if (active.length === 0) return sections;
  let result = sections.map((section) => ({ ...section, fields: section.fields.map((field) => ({ ...field })) }));
  const ordered = [...active].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
  for (const override of ordered) {
    const payload = override.payload ?? {};
    if (override.action === "add") {
      const key = override.fieldKey;
      if (result.some((section) => section.fields.some((field) => field.key === key))) continue;
      const field: DynamicField = {
        key,
        label: (payload.label ?? key).trim(),
        kind: payload.kind ?? "text",
        storage: "detail",
        ...(payload.kind === "select" ? { options: payload.options } : {}),
        ...(payload.placeholder ? { placeholder: payload.placeholder } : {}),
        ...(payload.help ? { help: payload.help } : {}),
        ...(payload.required ? { required: true } : {}),
        ...(payload.kind === "textarea" ? { wide: true, maxLength: 1000 } : { maxLength: 255 }),
      };
      const wanted = payload.section ?? "program";
      const target = result.find((section) => section.id === wanted) ?? result.find((section) => section.id === "program") ?? result[result.length - 1];
      if (target) target.fields = [...target.fields, field];
      continue;
    }
    result = result.map((section) => {
      if (!section.fields.some((field) => field.key === override.fieldKey)) return section;
      if (override.action === "hide") {
        const hiddenKeys = new Set([override.fieldKey]);
        // Une question de suivi dont le parent est masqué n'a plus lieu d'être.
        return { ...section, fields: section.fields.filter((field) => !hiddenKeys.has(field.key)) };
      }
      return {
        ...section,
        fields: section.fields.map((field) => {
          if (field.key !== override.fieldKey) return field;
          if (override.action === "require") return { ...field, required: true };
          if (override.action === "optional") return { ...field, required: false };
          return { ...field, ...(payload.label ? { label: payload.label.trim() } : {}), ...(payload.help ? { help: payload.help } : {}), ...(payload.placeholder ? { placeholder: payload.placeholder } : {}) };
        }),
      };
    });
  }
  return result.filter((section) => section.fields.length > 0);
}
