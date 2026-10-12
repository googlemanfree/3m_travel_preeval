/**
 * Pilotage admin dynamique : prochaine action, type de procédure et sources
 * officielles dérivés du pays + visa/procédure du dossier — pas un formulaire
 * France figé pour tous les candidats.
 */

import { getEnrichedCandidateJourney } from "./candidateJourneyCatalog";
import { resolveProcedureChecklistKey } from "./countryProcedureChecklist";
import { OFFICIAL_SOURCE_CATALOG, type OfficialSource } from "./officialSourceCatalog";

export type AdminProcedureKind =
  | "evisa"
  | "work"
  | "study"
  | "visitor"
  | "family"
  | "residence"
  | "other";

export type AdminDynamicNextAction = {
  key: string;
  label: string;
  description: string;
  urgency: "high" | "normal" | "low";
};

export type AdminDynamicPilotageContext = {
  country: string;
  visaType: string;
  procedureKind: AdminProcedureKind;
  procedureKindLabel: string;
  journeyTitle: string;
  currentStepLabel: string | null;
  nextStepLabel: string | null;
  officialSources: OfficialSource[];
  checklistKey: string | null;
  reassurance: string;
  nextAction: AdminDynamicNextAction;
};

const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const KIND_LABELS: Record<AdminProcedureKind, string> = {
  evisa: "e‑Visa / autorisation électronique",
  work: "Travail / permis",
  study: "Études",
  visitor: "Visiteur / tourisme",
  family: "Regroupement familial",
  residence: "Résidence / installation",
  other: "Procédure à qualifier",
};

export function detectAdminProcedureKind(
  visaType?: string | null,
  procedureLabel?: string | null,
): AdminProcedureKind {
  const blob = fold([visaType, procedureLabel].filter(Boolean).join(" "));
  if (!blob) return "other";
  if (/(e[\s-]?visa|electronique|electronic|eta\b|nzefta|esta)/.test(blob)) return "evisa";
  if (/(travail|work|emploi|worker|permis de travail|autorisation de travail)/.test(blob)) return "work";
  if (/(etude|study|academ|formation|ausbildung|student)/.test(blob)) return "study";
  if (/(visiteur|visitor|touris|schengen|court sejour)/.test(blob)) return "visitor";
  if (/(famille|family|regroupement)/.test(blob)) return "family";
  if (/(permanent|residence|installation|pr\b)/.test(blob)) return "residence";
  const checklistKey = resolveProcedureChecklistKey(procedureLabel || visaType);
  if (checklistKey === "evisa") return "evisa";
  if (checklistKey === "work_permit") return "work";
  if (checklistKey === "study_permit") return "study";
  if (checklistKey === "visitor_visa") return "visitor";
  if (checklistKey === "family_reunification") return "family";
  if (checklistKey === "permanent_residence") return "residence";
  return "other";
}

function catalogKeyForCountry(destination?: string | null): string | null {
  const key = fold(String(destination || ""))
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (!key) return null;
  const aliases: Array<[RegExp, string]> = [
    [/luxembourg/, "luxembourg"],
    [/canada|quebec/, "canada"],
    [/france/, "france"],
    [/italie|italy/, "italie"],
    [/australie|australia/, "australie"],
    [/allemagne|germany|deutschland/, "allemagne"],
    [/belgique|belgium/, "belgique"],
    [/espagne|spain/, "espagne"],
    [/portugal/, "portugal"],
    [/pologne|poland/, "pologne"],
    [/suisse|switzerland/, "suisse"],
    [/inde|india/, "inde"],
    [/japon|japan/, "japon"],
    [/turquie|turkey|turkiye/, "turkiye"],
    [/qatar/, "qatar"],
  ];
  for (const [pattern, catalogKey] of aliases) {
    if (pattern.test(key) && OFFICIAL_SOURCE_CATALOG[catalogKey]) return catalogKey;
  }
  const direct = Object.keys(OFFICIAL_SOURCE_CATALOG).find((entry) => key.includes(entry) || entry.includes(key.split(" ")[0]!));
  return direct ?? null;
}

export function resolveOfficialSourcesForAdmin(
  destination?: string | null,
  visaType?: string | null,
  procedureLabel?: string | null,
): OfficialSource[] {
  const journey = getEnrichedCandidateJourney(destination, visaType, procedureLabel ?? visaType);
  const fromJourney = (journey.officialSources ?? []).map((url) => ({
    label: `Source parcours — ${journey.country || destination || "destination"}`,
    url,
  }));
  const catalogKey = catalogKeyForCountry(destination || journey.country);
  const fromCatalog = catalogKey ? OFFICIAL_SOURCE_CATALOG[catalogKey]?.sources ?? [] : [];
  const merged = new Map<string, OfficialSource>();
  for (const source of [...fromCatalog, ...fromJourney]) {
    if (!source.url || merged.has(source.url)) continue;
    merged.set(source.url, source);
  }
  return Array.from(merged.values()).slice(0, 6);
}

function kindSpecificFollowUp(
  kind: AdminProcedureKind,
  country: string,
  nextStepLabel: string | null,
): AdminDynamicNextAction {
  const stepHint = nextStepLabel ? ` Prochaine étape parcours : « ${nextStepLabel} ».` : "";
  switch (kind) {
    case "evisa":
      return {
        key: "evisa_portal",
        label: `Préparer le dépôt e‑Visa (${country})`,
        description: `Aligner le dossier sur le portail électronique de ${country}, vérifier photo/passeport puis accompagner la soumission.${stepHint}`,
        urgency: "normal",
      };
    case "work":
      return {
        key: "work_track",
        label: `Avancer le volet emploi (${country})`,
        description: `Suivre employeur, contrat et autorisations propres à ${country} — ne pas appliquer un formulaire d’un autre pays.${stepHint}`,
        urgency: "normal",
      };
    case "study":
      return {
        key: "study_track",
        label: `Suivre admission & études (${country})`,
        description: `Vérifier admission, financement et pièces exigées pour ${country}.${stepHint}`,
        urgency: "normal",
      };
    case "visitor":
      return {
        key: "visitor_track",
        label: `Constituer le dossier visiteur (${country})`,
        description: `Itinéraire, attaches et ressources selon les exigences de ${country}.${stepHint}`,
        urgency: "normal",
      };
    case "family":
      return {
        key: "family_track",
        label: `Preuves familiales (${country})`,
        description: `Liens familiaux et statut du répondant pour ${country}.${stepHint}`,
        urgency: "normal",
      };
    case "residence":
      return {
        key: "residence_track",
        label: `Dossier résidence (${country})`,
        description: `Pièces d’installation et critères de ${country}.${stepHint}`,
        urgency: "normal",
      };
    default:
      return {
        key: "follow_up",
        label: "Qualifier pays et procédure",
        description: "Préciser la destination et le type de visa pour activer le parcours, la checklist et les sources officielles adaptés.",
        urgency: "low",
      };
  }
}

/**
 * Prochaine action 360° : garde les priorités paiement / pièces, puis contextualise
 * par pays + type de procédure (e‑visa, travail, études…).
 */
export function determineDynamicCandidate360NextAction(input: {
  workflowStatus: string;
  paymentStatus?: string | null;
  pendingDocuments: number;
  openTasks: number;
  dueAt?: Date | null;
  destination?: string | null;
  visaType?: string | null;
  procedureLabel?: string | null;
}): AdminDynamicNextAction {
  const journey = getEnrichedCandidateJourney(
    input.destination,
    input.visaType,
    input.procedureLabel ?? input.visaType,
  );
  const kind = detectAdminProcedureKind(input.visaType, input.procedureLabel ?? journey.visaType);
  const country = journey.country || input.destination?.trim() || "destination à préciser";
  const nextStepLabel = journey.steps[1]?.label ?? journey.steps[0]?.label ?? null;

  if (input.paymentStatus && !["SUCCESS", "success", "completed", "paye"].includes(input.paymentStatus)) {
    return {
      key: "payment",
      label: "Vérifier le paiement",
      description: `Contrôler le paiement avant d’engager le parcours ${country} (${KIND_LABELS[kind]}).`,
      urgency: "high",
    };
  }
  if (input.pendingDocuments > 0) {
    return {
      key: "documents",
      label: `Contrôler les documents — ${country}`,
      description: `${input.pendingDocuments} pièce(s) liées à ${KIND_LABELS[kind]} restent à recevoir ou valider.`,
      urgency: "high",
    };
  }
  if (input.workflowStatus === "new" || input.workflowStatus === "qualifying") {
    return {
      key: "evaluation",
      label: `Préparer l’évaluation — ${country}`,
      description: `Bilan et orientation sur ${KIND_LABELS[kind]} pour ${country}, sans réutiliser un modèle d’un autre pays.`,
      urgency: "normal",
    };
  }
  if (input.openTasks > 0) {
    return {
      key: "task",
      label: "Terminer les actions ouvertes",
      description: `${input.openTasks} action(s) sur le dossier ${country} restent à traiter.`,
      urgency: "normal",
    };
  }
  if (input.workflowStatus === "submitted" || input.workflowStatus === "processing") {
    return {
      key: "partner",
      label: kind === "evisa" ? `Suivre le portail e‑Visa (${country})` : `Suivre la soumission (${country})`,
      description:
        kind === "evisa"
          ? `Relancer le portail / consigner la décision électronique pour ${country}.`
          : `Relancer partenaire ou autorité compétente pour ${country} (${KIND_LABELS[kind]}).`,
      urgency: "normal",
    };
  }
  return kindSpecificFollowUp(kind, country, nextStepLabel);
}

export function buildAdminDynamicPilotageContext(input: {
  destination?: string | null;
  visaType?: string | null;
  procedureLabel?: string | null;
  workflowStatus: string;
  paymentStatus?: string | null;
  pendingDocuments: number;
  openTasks: number;
  dueAt?: Date | null;
  currentStepIndex?: number | null;
}): AdminDynamicPilotageContext {
  const journey = getEnrichedCandidateJourney(
    input.destination,
    input.visaType,
    input.procedureLabel ?? input.visaType,
  );
  const kind = detectAdminProcedureKind(input.visaType, input.procedureLabel ?? journey.visaType);
  const stepIndex = Math.min(
    Math.max(input.currentStepIndex ?? 0, 0),
    Math.max(0, journey.steps.length - 1),
  );
  const currentStepLabel = journey.steps[stepIndex]?.label ?? null;
  const nextStepLabel = journey.steps[stepIndex + 1]?.label ?? null;
  const checklistKey = resolveProcedureChecklistKey(input.procedureLabel || input.visaType) ?? null;
  const country = journey.country || input.destination?.trim() || "Destination à préciser";

  return {
    country,
    visaType: journey.visaType || input.visaType?.trim() || "Procédure à qualifier",
    procedureKind: kind,
    procedureKindLabel: KIND_LABELS[kind],
    journeyTitle: journey.title,
    currentStepLabel,
    nextStepLabel,
    officialSources: resolveOfficialSourcesForAdmin(input.destination, input.visaType, input.procedureLabel),
    checklistKey,
    reassurance:
      kind === "evisa"
        ? `Traitement e‑Visa adapté à ${country} : portail électronique et pièces du catalogue officiel, distinct d’un visa papier classique.`
        : `Pilotage calé sur ${country} · ${KIND_LABELS[kind]}. Les sources officielles ci-dessous sont celles à vérifier avant toute décision.`,
    nextAction: determineDynamicCandidate360NextAction(input),
  };
}
