import { buildClientPlan } from "./dynamicForm/clientPlan";
import { getProgram } from "./dynamicForm/programs";
import { resolveDynamicForm, type FormCompleteness } from "./dynamicForm/resolve";
import type { FormValues, ProjectKind } from "./dynamicForm/types";
import { PROJECT_KINDS } from "./dynamicForm/types";
import { PROFILE_DEFS, resolveEvaluationProfile, type EvaluationProfile } from "./evaluationProfiles";
import type { AdminEvaluationVersion } from "./evaluationValidation";

/**
 * Bilan à partir du formulaire. Pour les études, les séjours (visiteur), l'e-Visa et l'installation, le formulaire dynamique rempli par
 * le candidat suffit à préparer le bilan : pas de CV à analyser, pas de grille d'« employabilité ». Ce module lit les réponses du
 * formulaire (déjà adaptées au pays, au visa/programme et au domaine) et en tire un BROUILLON de bilan : résumé, atouts, points à
 * renforcer, plan d'action, pièces. Rien n'est inventé : chaque ligne vient d'une réponse précise, et les notes restent à la main de
 * l'administrateur. Tout reste soumis à la validation de l'administrateur avant de partir chez le candidat.
 */
export type FormBilanDraft = {
  profile: EvaluationProfile;
  programLabel: string;
  countryName: string | null;
  completeness: FormCompleteness;
  /** Le formulaire est assez complet pour préparer le bilan sans analyse supplémentaire (aucune réponse obligatoire manquante). */
  ready: boolean;
  profileSummary: string;
  strengths: string[];
  improvements: string[];
  blockers: string[];
  actionPlan: Array<{ title: string; detail?: string; horizon?: string }>;
  requiredDocuments: Array<{ label: string; status: "a_fournir" }>;
  /** Points à clarifier, réservés à l'administrateur (jamais publiés). */
  internalNotes: string[];
};

type Rule = { key: string; values: string[]; text: string };

/** Réponses favorables : chaque règle cite la réponse exacte qui la déclenche. */
const STRENGTH_RULES: Rule[] = [
  { key: "admissionStatus", values: ["recue"], text: "Admission déjà reçue d’un établissement." },
  { key: "languageProofStatus", values: ["disponible"], text: "Preuve de niveau de langue déjà disponible." },
  { key: "languageProof", values: ["oui"], text: "Test de langue officiel déjà disponible." },
  { key: "educationAssessment", values: ["oui"], text: "Évaluation des diplômes déjà obtenue." },
  { key: "settlementFunds", values: ["disponible"], text: "Fonds d’installation déclarés disponibles." },
  { key: "scholarshipStatus", values: ["obtenue"], text: "Bourse obtenue." },
  { key: "researchFunding", values: ["obtenu"], text: "Financement de la recherche obtenu." },
  { key: "hostLabStatus", values: ["contact_etabli"], text: "Contact établi avec le laboratoire ou l’équipe d’accueil." },
  { key: "agreementStatus", values: ["convention"], text: "Convention entre les établissements existante." },
  { key: "internshipHost", values: ["signee"], text: "Convention de stage signée." },
  { key: "offerStatus", values: ["signee"], text: "Offre ou contrat de travail signé." },
  { key: "trainingContract", values: ["signee"], text: "Contrat ou promesse de formation signé." },
  { key: "hostInvitation", values: ["obtenue"], text: "Invitation ou attestation d’accueil obtenue." },
  { key: "invitationLetter", values: ["recue"], text: "Lettre d’invitation reçue." },
  { key: "eventProof", values: ["recue"], text: "Invitation ou inscription à l’événement reçue." },
  { key: "enrolmentProof", values: ["recue"], text: "Preuve d’inscription reçue." },
  { key: "itineraryStatus", values: ["defini"], text: "Itinéraire défini." },
  { key: "accommodationPlan", values: ["hotel", "invitation", "reservation"], text: "Hébergement prévu pour le séjour." },
  { key: "tripFunding", values: ["personnel", "famille", "employeur", "invitant"], text: "Financement du voyage identifié." },
  { key: "travelHistory", values: ["hors_afrique", "schengen_uk_us_ca"], text: "Historique de voyages à l’international." },
  { key: "visitorStatus", values: ["chef_entreprise", "employe"], text: "Activité professionnelle déclarée dans le pays de résidence." },
  { key: "relationshipProof", values: ["disponibles"], text: "Preuves du lien familial disponibles." },
  { key: "fundingPlan", values: ["personnel", "famille", "bourse", "employeur", "mixte"], text: "Source de financement identifiée." },
  { key: "eligibilityChecked", values: ["oui"], text: "Éligibilité de la nationalité déjà vérifiée par le candidat." },
  { key: "healthInsurance", values: ["deja"], text: "Assurance santé déjà souscrite." },
  { key: "remoteInsurance", values: ["deja"], text: "Assurance santé internationale déjà souscrite." },
];

/** Réponses à renforcer : formulées comme des points de préparation, jamais comme un refus. */
const IMPROVEMENT_RULES: Rule[] = [
  { key: "admissionStatus", values: ["aucune"], text: "Aucune demande d’admission déposée pour l’instant." },
  { key: "admissionStatus", values: ["en_cours"], text: "Demande d’admission en cours : réponse à suivre." },
  { key: "languageProofStatus", values: ["a_passer"], text: "Preuve de niveau de langue à passer." },
  { key: "languageProof", values: ["non", "prevu"], text: "Test de langue officiel à passer ou à planifier." },
  { key: "educationAssessment", values: ["non", "a_prevoir"], text: "Évaluation des diplômes à faire." },
  { key: "settlementFunds", values: ["a_preparer", "partielle"], text: "Ressources financières à constituer et à documenter." },
  { key: "fundingPlan", values: ["a_preciser"], text: "Plan de financement à préciser." },
  { key: "tripFunding", values: ["a_preciser"], text: "Financement du voyage à préciser." },
  { key: "scholarshipStatus", values: ["a_deposer", "aucune"], text: "Candidature à la bourse à déposer." },
  { key: "hostInvitation", values: ["non", "en_cours"], text: "Invitation ou attestation d’accueil à obtenir." },
  { key: "invitationLetter", values: ["non", "en_cours"], text: "Lettre d’invitation à obtenir." },
  { key: "eventProof", values: ["non", "en_cours"], text: "Invitation ou inscription à l’événement à obtenir." },
  { key: "enrolmentProof", values: ["non", "en_cours"], text: "Preuve d’inscription à obtenir." },
  { key: "itineraryStatus", values: ["a_definir"], text: "Itinéraire à définir." },
  { key: "accommodationPlan", values: ["a_preciser"], text: "Hébergement à préciser." },
  { key: "travelHistory", values: ["aucun"], text: "Pas encore de voyage à l’étranger : les attaches et les ressources prennent plus d’importance." },
  { key: "relationshipProof", values: ["non", "en_cours"], text: "Preuves du lien familial à rassembler." },
  { key: "eligibilityChecked", values: ["non", "inconnu"], text: "Éligibilité de la nationalité à vérifier sur le portail officiel." },
  { key: "offerStatus", values: ["aucune"], text: "Aucune offre d’emploi déclarée pour l’instant." },
  { key: "trainingContract", values: ["aucune"], text: "Aucun contrat ni promesse de formation pour l’instant." },
  { key: "agreementStatus", values: ["a_confirmer", "aucune"], text: "Convention entre les établissements à confirmer." },
  { key: "internshipHost", values: ["en_cours", "aucune"], text: "Convention de stage à obtenir." },
  { key: "hostLabStatus", values: ["aucun"], text: "Aucun laboratoire d’accueil identifié pour l’instant." },
];

/** Pour ces familles, l'absence d'éléments de retour est un point à renforcer (séjours uniquement). */
const RETURN_TIES_FAMILY = /^(visit_|generic_tourisme)/;

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const dedupe = (items: string[]) => Array.from(new Set(items));

const isKind = (value: unknown): value is ProjectKind => typeof value === "string" && (PROJECT_KINDS as readonly string[]).includes(value);

export function buildFormBilanDraft(input: {
  projectType: string | null | undefined;
  country: string | null | undefined;
  details: Record<string, unknown> | null | undefined;
  columns?: FormValues;
  visaType?: string | null;
}): FormBilanDraft | null {
  if (!isKind(input.projectType) || !input.details || typeof input.details.programId !== "string") return null;
  const program = getProgram(input.details.programId);
  if (!program) return null;
  const plan = buildClientPlan({ projectType: input.projectType, country: input.country, details: input.details, columns: input.columns });
  if (!plan) return null;

  const values: FormValues = { ...(input.columns ?? {}) };
  for (const [key, value] of Object.entries(input.details)) if (typeof value === "string") values[key] = value.trim();
  const form = resolveDynamicForm({ country: input.country, projectType: input.projectType, programId: program.id, domainId: values.domainId });
  const profile = resolveEvaluationProfile({ projectType: input.projectType, visaType: input.visaType, programId: program.id });

  const strengths = dedupe(STRENGTH_RULES.filter((rule) => rule.values.includes(values[rule.key] ?? "")).map((rule) => rule.text));
  const improvements = dedupe(IMPROVEMENT_RULES.filter((rule) => rule.values.includes(values[rule.key] ?? "")).map((rule) => rule.text));
  if (RETURN_TIES_FAMILY.test(form.family)) {
    if ((values.returnTies ?? "").trim()) strengths.push("Éléments de retour dans le pays de résidence déclarés (emploi, famille, activité).");
    else improvements.push("Éléments de retour dans le pays de résidence non renseignés.");
  }

  const blockers: string[] = [];
  const internalNotes: string[] = [];
  for (const flag of plan.flags) {
    if (flag.code === "passport_expires_before_travel") blockers.push("Le passeport expire avant la date de voyage indiquée : à renouveler.");
    else if (flag.code === "travel_date_past") blockers.push("La date de voyage indiquée est déjà passée : à mettre à jour.");
    else internalNotes.push(flag.message);
  }

  const actionPlan: FormBilanDraft["actionPlan"] = plan.actions.map((action) => ({ title: action.text }));
  if (profile === "tourisme") {
    actionPlan.push({
      title: "Prendre rendez-vous avec un conseiller",
      detail: "Certains éléments se vérifient en personne : pièces originales, ressources, attaches dans le pays de résidence.",
      horizon: "Avant le dépôt de la demande",
    });
  }

  const shortAnswers = plan.answers.filter((answer) => answer.answer.length <= 80).slice(0, 8);
  const summaryLines = [
    `Projet « ${plan.programLabel} »${plan.countryName ? ` vers ${plan.countryName}` : ""}${plan.domainLabel ? ` — domaine : ${plan.domainLabel}` : ""}. Formulaire renseigné à ${plan.completeness.percent} % (${plan.completeness.answered} réponses sur ${plan.completeness.total}).`,
    ...shortAnswers.map((answer) => `• ${clean(answer.question)} : ${clean(answer.answer)}`),
  ];

  return {
    profile,
    programLabel: plan.programLabel,
    countryName: plan.countryName,
    completeness: plan.completeness,
    ready: plan.completeness.missingRequired.length === 0,
    profileSummary: summaryLines.join("\n").slice(0, 3900),
    strengths: strengths.slice(0, 20),
    improvements: improvements.slice(0, 20),
    blockers: blockers.slice(0, 20),
    actionPlan: actionPlan.slice(0, 20),
    requiredDocuments: plan.documents.map((document) => ({ label: document.label.slice(0, 600), status: "a_fournir" as const })).slice(0, 40),
    internalNotes,
  };
}

const INTERNAL_MARK = "Points à clarifier (formulaire) :";

/**
 * Applique le brouillon au bilan sans jamais écraser le travail de l'administrateur : seuls les champs encore vides sont remplis
 * (les pièces par défaut du profil sont remplacées par celles du programme choisi). Les notes ne sont jamais touchées.
 */
export function applyFormBilanDraft(version: AdminEvaluationVersion, draft: FormBilanDraft): { version: AdminEvaluationVersion; filled: string[] } {
  const filled: string[] = [];
  const next: AdminEvaluationVersion = { ...version, profile: version.profile ?? draft.profile };
  if (!next.profileSummary.trim() && draft.profileSummary) { next.profileSummary = draft.profileSummary; filled.push("Résumé du profil"); }
  if (next.strengths.length === 0 && draft.strengths.length) { next.strengths = [...draft.strengths]; filled.push("Atouts"); }
  if (next.improvements.length === 0 && draft.improvements.length) { next.improvements = [...draft.improvements]; filled.push("Points à renforcer"); }
  if (next.blockers.length === 0 && draft.blockers.length) { next.blockers = [...draft.blockers]; filled.push("Points bloquants"); }
  if (next.actionPlan.length === 0 && draft.actionPlan.length) { next.actionPlan = draft.actionPlan.map((step) => ({ ...step })); filled.push("Plan d’action"); }
  const defaults = PROFILE_DEFS[next.profile ?? draft.profile].defaultDocuments;
  const untouchedDefaults = next.requiredDocuments.length === 0
    || (next.requiredDocuments.length === defaults.length && next.requiredDocuments.every((document, index) => document.label === defaults[index] && document.status === "a_fournir"));
  if (untouchedDefaults && draft.requiredDocuments.length) { next.requiredDocuments = draft.requiredDocuments.map((document) => ({ ...document })); filled.push("Pièces à fournir"); }
  if (draft.internalNotes.length && !next.internalComment.includes(INTERNAL_MARK)) {
    const notes = `${INTERNAL_MARK}\n${draft.internalNotes.map((note) => `- ${note}`).join("\n")}`;
    next.internalComment = [next.internalComment.trim(), notes].filter(Boolean).join("\n\n").slice(0, 3900);
    filled.push("Commentaire interne");
  }
  return { version: next, filled };
}
