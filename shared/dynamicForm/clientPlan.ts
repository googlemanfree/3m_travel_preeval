import { FAMILY_DOCUMENTS } from "./documents";
import { getDomain } from "./domains";
import { describeProjectDetails, detectFormFlags, formCompleteness, resolveDynamicForm, sanitizeProjectDetails, type DescribedAnswer, type FormCompleteness, type FormFlag, type ResolvedForm } from "./resolve";
import { getProgram } from "./programs";
import { PROJECT_KINDS, type FormValues, type ProjectKind } from "./types";

/**
 * Parcours du candidat dans l'espace client et pour le conseiller, calculé à partir de ce qu'il a déclaré dans le formulaire :
 * actions à préparer, pièces attendues (avec leur état) et réponses lisibles. Tout est formulé comme une préparation :
 * aucune exigence officielle n'est affirmée, aucune admissibilité n'est suggérée.
 */
export type PlanAction = { id: string; text: string };

export type ClientPlan = {
  programLabel: string;
  domainLabel: string | null;
  countryName: string | null;
  blurb: string;
  actions: PlanAction[];
  /** Les mêmes actions, formulées pour le conseiller. */
  staffActions: PlanAction[];
  documents: Array<{ label: string; received: boolean }>;
  answers: DescribedAnswer[];
  completeness: FormCompleteness;
  flags: FormFlag[];
};

const LEVEL_LOW = new Set(["aucun", "a1_a2"]);

/** Actions de préparation selon les réponses : une situation « à faire » devient une étape concrète du parcours. */
export function buildPlanActions(form: ResolvedForm, values: FormValues): PlanAction[] {
  const v = (key: string) => (values[key] ?? "").trim();
  const actions: PlanAction[] = [];
  const add = (id: string, text: string) => { if (!actions.some((action) => action.id === id)) actions.push({ id, text }); };

  const offerFamilies = ["work_employer", "work_highly_qualified", "imm_employer"];
  if (offerFamilies.includes(form.family) && ["aucune", "en_discussion"].includes(v("offerStatus"))) add("offer", v("offerStatus") === "aucune" ? "Rechercher et sécuriser une offre d’emploi : votre conseiller peut vous orienter vers les canaux de recrutement fiables." : "Faire confirmer l’offre en discussion par écrit : employeur, poste, date de début.");
  if (["work_training", "study_vocational"].includes(form.family) && ["aucune", "en_discussion"].includes(v("trainingContract"))) add("training_contract", "Identifier un employeur ou un établissement formateur et obtenir un contrat ou une promesse de formation.");
  if (["non_commencee", "preparation"].includes(v("healthRecognitionStatus")) || ["non_commencee"].includes(v("qualificationRecognition"))) add("recognition", "Préparer la reconnaissance de votre diplôme dans le pays visé : votre conseiller vous indiquera l’organisme compétent et les pièces à rassembler.");
  if (["a_faire", "en_cours"].includes(v("qualificationRecognition")) && !actions.some((action) => action.id === "recognition")) add("recognition", "Suivre la démarche de reconnaissance de votre diplôme et en conserver les justificatifs.");
  if (["non", "a_prevoir"].includes(v("educationAssessment"))) add("assessment", "Faire évaluer vos diplômes pour ce pays (organisme à confirmer sur la source officielle).");
  if (["non", "prevu"].includes(v("languageProof"))) add("language_test", "Planifier un test de langue officiel : calendrier et centres à confirmer.");
  if (v("languageProofStatus") === "a_passer") add("language_test", "Planifier la preuve de niveau de langue demandée par le programme d’études.");
  for (const key of Object.keys(values)) {
    if (key.startsWith("lang_") && LEVEL_LOW.has(v(key))) add(key, "Prévoir une préparation en langue du pays : un niveau faible peut allonger le calendrier de votre projet.");
  }
  if (["aucune"].includes(v("admissionStatus"))) add("admission", "Préparer vos candidatures auprès des établissements : choix des programmes, dossiers, échéances.");
  if (["bourse"].includes(v("fundingPlan")) && v("scholarshipStatus") !== "obtenue") add("scholarship", "Suivre l’échéancier de la bourse visée.");
  if (["a_preparer", "partielle"].includes(v("settlementFunds"))) add("funds", "Constituer et documenter vos ressources financières.");
  if (["a_preciser"].includes(v("fundingPlan")) || v("trainingFunding") === "a_clarifier") add("funding_plan", "Préciser le financement du projet avec votre conseiller.");
  if (["non"].includes(v("hostInvitation")) || ["en_cours"].includes(v("hostInvitation"))) add("invitation", "Obtenir l’invitation ou l’attestation d’accueil de la personne que vous visitez.");
  if (["non", "en_cours"].includes(v("invitationLetter"))) add("invitation_letter", "Obtenir la lettre d’invitation de l’organisation d’accueil.");
  if (["inconnu", "non"].includes(v("healthRegistration"))) add("registration", "Vérifier si votre profession est encadrée par un ordre ou un registre dans votre pays, et rassembler les attestations.");
  if (v("hostFamilyStatus") === "non") add("host_family", "Identifier une famille d’accueil ou une agence agréée.");
  if (["non"].includes(v("onwardTicket"))) add("onward_ticket", "Réserver le billet vers la destination finale (selon les règles de transit).");
  if (["aucune"].includes(v("scholarshipStatus")) || v("scholarshipStatus") === "a_deposer") add("scholarship_apply", "Déposer la candidature à la bourse avant l’échéance.");
  if (v("passportExpiry") && v("plannedArrival")) add("passport", "Vérifier la validité de votre passeport au regard de la date de voyage.");
  if (v("businessStage") === "idee") add("business_plan", "Rédiger un plan d’affaires structuré avec l’appui de votre conseiller.");

  if (actions.length === 0) add("review", "Votre conseiller examine votre dossier et vous indique les prochaines pièces à fournir.");
  return actions.slice(0, 7);
}

const KEYWORD_GROUPS: string[][] = [
  ["passeport", "passport"], ["photo"], ["cv", "curriculum"], ["diplome", "diploma", "licence", "master"], ["releve", "bulletin", "transcript"],
  ["attestation", "certificat", "emploi", "travail"], ["contrat", "promesse", "offre"], ["admission", "acceptation", "inscription"], ["invitation"],
  ["assurance"], ["ressource", "fonds", "bancaire", "financ", "revenu"], ["langue", "tcf", "tef", "ielts", "goethe", "delf", "toefl"],
  ["naissance", "etat civil", "mariage"], ["casier"], ["logement", "hebergement", "reservation"], ["billet", "vol"], ["plan d affaires", "business plan"],
];
const fold = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Indice du groupe de mots-clés d'une pièce (passeport, diplôme, contrat…) : deux libellés du même groupe désignent la même pièce. */
export function keywordGroupIndex(label: string): number {
  const folded = fold(label);
  return KEYWORD_GROUPS.findIndex((words) => words.some((word) => folded.includes(word)));
}

/** Pièces propres au visa ou programme et au domaine choisis, au format des checklists de dossier. */
export function programChecklistLines(programId: string | null | undefined, domainId: string | null | undefined): Array<{ documentType: string; comment: string; source: "program" }> {
  const program = getProgram(programId);
  if (!program || program.id.endsWith("-orientation")) return [];
  const domain = getDomain(domainId);
  const labels = Array.from(new Set([...FAMILY_DOCUMENTS[program.family], ...(domain?.documents ?? [])]));
  return labels.map((documentType) => ({ documentType, comment: `Pièce propre au parcours « ${program.label} »${domain ? ` · ${domain.label}` : ""} : à confirmer par le conseiller selon la source officielle.`, source: "program" as const }));
}

/** Une pièce attendue est considérée reçue si un document déposé porte le même mot-clé (passeport, diplôme, contrat…). */
export function documentIsReceived(expectedLabel: string, uploaded: Array<{ documentType?: string | null; documentName?: string | null }>): boolean {
  const label = fold(expectedLabel);
  const group = KEYWORD_GROUPS.find((words) => words.some((word) => label.includes(word)));
  if (!group) return false;
  return uploaded.some((document) => {
    const haystack = fold(`${document.documentType ?? ""} ${document.documentName ?? ""}`);
    return group.some((word) => haystack.includes(word));
  });
}

/** Réponses du formulaire d'une évaluation, relues pour l'espace du candidat : uniquement les champs du formulaire dynamique (jamais les accords, liens ou pièces). */
export function parseClientProjectDetails(json: string | null | undefined, country: string | null | undefined, projectType: string | null | undefined): Record<string, string> | null {
  if (!json || !isKind(projectType)) return null;
  try {
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const strings: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) if (typeof value === "string") strings[key] = value;
    return strings.programId ? sanitizeProjectDetails({ country, projectType }, strings) : null;
  } catch {
    return null;
  }
}

const STAFF_TEXT: Record<string, string> = {
  offer: "Aider le candidat à sécuriser une offre d’emploi (employeurs partenaires, canaux de recrutement fiables) ou à la faire confirmer par écrit.",
  training_contract: "Identifier avec le candidat un employeur ou un établissement formateur et obtenir un contrat ou une promesse de formation.",
  recognition: "Ouvrir le dossier de reconnaissance du diplôme : organisme compétent, pièces, traductions assermentées si exigées.",
  assessment: "Orienter le candidat vers l’évaluation de ses diplômes (organisme à confirmer sur la source officielle).",
  language_test: "Planifier un test de langue officiel avec le candidat (calendrier, centre, préparation).",
  admission: "Préparer les candidatures aux établissements : programmes, dossiers, échéances.",
  funds: "Faire le point sur les ressources et leur justification.",
  funding_plan: "Clarifier le plan de financement avec le candidat.",
  invitation: "Aider le candidat à obtenir l’invitation ou l’attestation d’accueil de son hôte.",
  invitation_letter: "Obtenir la lettre d’invitation de l’organisation d’accueil.",
  registration: "Vérifier si la profession est encadrée par un ordre ou un registre et rassembler les attestations.",
  host_family: "Aider à identifier une famille d’accueil ou une agence agréée.",
  onward_ticket: "Vérifier le billet vers la destination finale et les règles de transit.",
  scholarship: "Suivre l’échéancier de la bourse.",
  scholarship_apply: "Accompagner le dépôt de la candidature à la bourse avant l’échéance.",
  passport: "Contrôler la validité du passeport au regard de la date de voyage.",
  business_plan: "Accompagner la rédaction d’un plan d’affaires structuré.",
  review: "Examiner le dossier et indiquer au candidat les pièces à fournir.",
};

/** Mêmes actions que dans l'espace du candidat, formulées pour le conseiller (qui fait quoi avec le candidat). */
export function buildStaffFollowUps(form: ResolvedForm, values: FormValues): PlanAction[] {
  return buildPlanActions(form, values).map((action) => ({ id: action.id, text: STAFF_TEXT[action.id] ?? (action.id.startsWith("lang_") ? "Prévoir avec le candidat un plan de préparation dans la langue du pays." : action.text) }));
}

const isKind = (value: unknown): value is ProjectKind => typeof value === "string" && (PROJECT_KINDS as readonly string[]).includes(value);

export function buildClientPlan(
  input: { projectType: string | null | undefined; country: string | null | undefined; details: Record<string, unknown> | null | undefined; uploaded?: Array<{ documentType?: string | null; documentName?: string | null }>; columns?: FormValues },
): ClientPlan | null {
  const details = input.details;
  if (!details || typeof details.programId !== "string" || !isKind(input.projectType)) return null;
  const program = getProgram(details.programId);
  if (!program) return null;
  const strings: FormValues = {};
  for (const [key, value] of Object.entries(details)) if (typeof value === "string") strings[key] = value;
  const values = { ...(input.columns ?? {}), ...strings };
  const form = resolveDynamicForm({ country: input.country, projectType: input.projectType, programId: program.id, domainId: strings.domainId });
  const documents = Array.from(new Set([...FAMILY_DOCUMENTS[form.family], ...(getDomain(strings.domainId)?.documents ?? [])]))
    .map((label) => ({ label, received: documentIsReceived(label, input.uploaded ?? []) }));
  return {
    programLabel: program.id.endsWith("-orientation") ? "Orientation générale" : program.label,
    domainLabel: form.domain?.label ?? null,
    countryName: form.countryName,
    blurb: form.blurb,
    actions: buildPlanActions(form, values),
    staffActions: buildStaffFollowUps(form, values),
    documents,
    answers: describeProjectDetails({ country: input.country, projectType: input.projectType }, details),
    completeness: formCompleteness(form, values),
    flags: detectFormFlags(form, values),
  };
}
