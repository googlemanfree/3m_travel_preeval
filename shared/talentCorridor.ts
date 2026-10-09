/**
 * Corridor de talents Afrique → monde — source unique pour les 4 interfaces.
 */

export const CORRIDOR_ROUTES = {
  partnersHub: "/partenaires",
  agencies: "/agences-placement",
  agenciesRegister: "/agences-placement#inscription-agence",
  agenciesLogin: "/employeurs?tab=login&portal=placement_partner",
  employers: "/employeurs",
  employersRegister: "/employeurs?tab=register",
  employersLogin: "/employeurs?tab=login",
  clientSpace: "/mon-espace",
} as const;

export const CORRIDOR_REGIONS = [
  { id: "europe", fr: "Europe", en: "Europe" },
  { id: "americas", fr: "Amériques", en: "Americas" },
  { id: "asia", fr: "Asie", en: "Asia" },
] as const;

export type SelectableStage = "incomplete" | "awaiting_consent" | "selectable" | "shared";

export type SelectableChecklist = {
  evaluationValidated: boolean;
  consentGranted: boolean;
  destinationSet: boolean;
  identityComplete: boolean;
};

export function computeSelectableStage(checklist: SelectableChecklist, hasSharedProfile: boolean): SelectableStage {
  if (hasSharedProfile && checklist.consentGranted) return "shared";
  if (checklist.evaluationValidated && checklist.consentGranted && checklist.destinationSet && checklist.identityComplete) {
    return "selectable";
  }
  if (checklist.evaluationValidated && !checklist.consentGranted) return "awaiting_consent";
  return "incomplete";
}

export const SELECTABLE_STAGE_COPY = {
  incomplete: {
    fr: { badge: "Profil à compléter", hint: "Évaluation, destination et identité sont nécessaires avant toute mise en relation." },
    en: { badge: "Profile incomplete", hint: "Assessment, destination and identity are required before any matching." },
  },
  awaiting_consent: {
    fr: { badge: "Consentement requis", hint: "Autorisez le partage anonymisé pour devenir visible aux partenaires vérifiés." },
    en: { badge: "Consent required", hint: "Allow anonymised sharing to become visible to verified partners." },
  },
  selectable: {
    fr: { badge: "Sélectionnable", hint: "Votre profil peut être préparé anonymisé pour agences et employeurs vérifiés." },
    en: { badge: "Selectable", hint: "Your profile can be prepared anonymously for verified agencies and employers." },
  },
  shared: {
    fr: { badge: "Visible partenaires", hint: "Un profil anonymisé a déjà été préparé. Vous pouvez retirer votre consentement à tout moment." },
    en: { badge: "Visible to partners", hint: "An anonymised profile has already been prepared. You can withdraw consent at any time." },
  },
} as const;

/** Étapes admin après sélection partenaire (contrat + lettre d’invitation → N°02 → procédure). */
export const POST_SELECTION_STAGES = [
  "selected",
  "contract_invitation",
  "protocol_two",
  "procedure_ready",
] as const;

export type PostSelectionStage = (typeof POST_SELECTION_STAGES)[number];

export const POST_SELECTION_LABELS: Record<PostSelectionStage, { fr: string; en: string; hint: string }> = {
  selected: {
    fr: "Sélectionné",
    en: "Selected",
    hint: "Retour partenaire reçu — vérifier avant d’engager la procédure.",
  },
  contract_invitation: {
    fr: "Contrat / invitation",
    en: "Contract / invitation",
    hint: "Contrat et lettre d’invitation reçus et validés par 3M.",
  },
  protocol_two: {
    fr: "Protocole N°02",
    en: "Protocol No. 02",
    hint: "Ouvrir le Protocole N°02 (employeur + poste) sur la fiche 360°.",
  },
  procedure_ready: {
    fr: "Procédure admin",
    en: "Admin procedure",
    hint: "Procédure visa / mobilité engagée après validation humaine.",
  },
};

export function nextPostSelectionStage(current: PostSelectionStage): PostSelectionStage | null {
  const index = POST_SELECTION_STAGES.indexOf(current);
  if (index < 0 || index >= POST_SELECTION_STAGES.length - 1) return null;
  return POST_SELECTION_STAGES[index + 1]!;
}

export function resolvePostSelectionStage(input: {
  status: string;
  adminPipelineStage?: string | null;
}): PostSelectionStage | null {
  if (input.adminPipelineStage && (POST_SELECTION_STAGES as readonly string[]).includes(input.adminPipelineStage)) {
    return input.adminPipelineStage as PostSelectionStage;
  }
  if (input.status === "procedure_ready") return "procedure_ready";
  if (input.status === "selected") return "selected";
  return null;
}
