import { z } from "zod";

/**
 * Règles de l'évaluation IA avec validation administrateur OBLIGATOIRE avant tout envoi au client.
 *
 * Ce module est volontairement pur (aucune base, aucune IA, aucun réseau) : il porte les règles de
 * conformité du brief afin que le serveur, l'interface administrateur et les tests s'appuient sur
 * une seule définition.
 *   - la sortie de l'IA est un BROUILLON INTERNE, jamais visible du candidat ;
 *   - seule la version validée et publiée par un administrateur devient un rapport client ;
 *   - le rapport client et l'e-mail sont générés depuis cette version, jamais depuis le brouillon.
 */

// ── Libellés imposés par le brief ─────────────────────────────────────────────

export const AI_DRAFT_LABEL = "BROUILLON IA — VALIDATION ADMINISTRATEUR REQUISE";
export const ADMIN_DRAFT_BADGE = "BROUILLON IA — À VÉRIFIER ET VALIDER";

/** Seul message affiché au candidat tant que rien n'est validé et publié. */
export const CANDIDATE_PENDING_NOTICE = {
  title: "Dossier reçu avec succès.",
  body: "Votre dossier est actuellement en cours d’analyse et de vérification par notre équipe. Vous recevrez une notification dès que votre évaluation aura été validée et publiée dans votre espace personnel.",
} as const;

export const LEGAL_DISCLAIMER =
  "Cette évaluation constitue une préanalyse interne 3M fondée sur les informations et documents disponibles à la date de validation. Elle ne constitue pas une décision d’immigration, une garantie de visa, une offre d’emploi, un contrat de travail, une résidence permanente, une reconnaissance de diplôme ou une garantie de logement. Les décisions relèvent exclusivement des employeurs, organismes professionnels et autorités compétentes.";

export const EMAIL_DISCLAIMER =
  "Cette préévaluation est informative et interne. Elle ne constitue pas une garantie de visa, d’emploi, de contrat, de résidence permanente ou de logement.";

// ── Grille de score sur 100 ───────────────────────────────────────────────────

export const SCORE_CRITERIA = [
  { key: "identity", label: "Identité et conformité", max: 10 },
  { key: "qualification", label: "Formation et qualification", max: 15 },
  { key: "languages", label: "Langues vérifiables", max: 15 },
  { key: "experience", label: "Expérience et compétences", max: 20 },
  { key: "employability", label: "Employabilité dans le pays choisi", max: 15 },
  { key: "finances", label: "Capacité financière", max: 10 },
  { key: "documents", label: "Dossier documentaire", max: 10 },
  { key: "coherence", label: "Cohérence du projet", max: 5 },
] as const;

export type ScoreCriterionKey = (typeof SCORE_CRITERIA)[number]["key"];
export type ScoreBreakdown = Record<ScoreCriterionKey, number>;
export const SCORE_MAX_TOTAL = SCORE_CRITERIA.reduce((sum, criterion) => sum + criterion.max, 0);

export const SUGGESTED_STATUSES = ["tres_favorable", "favorable", "moderement_favorable", "a_renforcer", "preparation_recommandee"] as const;
export type SuggestedStatus = (typeof SUGGESTED_STATUSES)[number];

export const SUGGESTED_STATUS_LABELS: Record<SuggestedStatus, string> = {
  tres_favorable: "Très favorable",
  favorable: "Favorable",
  moderement_favorable: "Modérément favorable",
  a_renforcer: "À renforcer",
  preparation_recommandee: "Préparation recommandée",
};

/** Note d'un critère : entier borné à [0, max] ; toute valeur illisible vaut 0. */
export function normalizeCriterionScore(key: ScoreCriterionKey, value: unknown): number {
  const criterion = SCORE_CRITERIA.find((item) => item.key === key);
  const max = criterion?.max ?? 0;
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(max, Math.max(0, Math.round(number)));
}

export function normalizeScoreBreakdown(scores: Partial<Record<ScoreCriterionKey, unknown>> | null | undefined): ScoreBreakdown {
  const result = {} as ScoreBreakdown;
  for (const criterion of SCORE_CRITERIA) result[criterion.key] = normalizeCriterionScore(criterion.key, scores?.[criterion.key]);
  return result;
}

/** Total calculé à partir des notes par critère (recalculé après chaque modification). */
export function computeScoreTotal(scores: Partial<Record<ScoreCriterionKey, unknown>> | null | undefined): number {
  const breakdown = normalizeScoreBreakdown(scores);
  return SCORE_CRITERIA.reduce((sum, criterion) => sum + breakdown[criterion.key], 0);
}

export function suggestedStatusForScore(total: number): SuggestedStatus {
  const score = Math.min(SCORE_MAX_TOTAL, Math.max(0, Math.round(Number.isFinite(total) ? total : 0)));
  if (score >= 80) return "tres_favorable";
  if (score >= 70) return "favorable";
  if (score >= 60) return "moderement_favorable";
  if (score >= 45) return "a_renforcer";
  return "preparation_recommandee";
}

export type ScoreResolution = {
  breakdown: ScoreBreakdown;
  /** Somme des notes par critère. */
  computedTotal: number;
  /** Score retenu : la valeur saisie à la main si l'administrateur en a fixé une, sinon le calcul. */
  effectiveTotal: number;
  hasManualTotal: boolean;
  /** Écart entre le score manuel et le calcul (0 sans score manuel). */
  deviation: number;
  /** Statut suggéré : suit toujours le score retenu. */
  suggestedStatus: SuggestedStatus;
  /** Statut final : le choix de l'administrateur, jamais remplacé automatiquement. */
  effectiveStatus: SuggestedStatus;
  hasManualStatus: boolean;
};

/**
 * Règle du brief : après toute modification des notes, le total est recalculé et le statut suggéré
 * est mis à jour, mais une valeur fixée à la main par l'administrateur (score global ou statut
 * final) n'est JAMAIS remplacée automatiquement.
 */
export function resolveScore(input: {
  scores?: Partial<Record<ScoreCriterionKey, unknown>> | null;
  totalOverride?: number | null;
  finalStatus?: SuggestedStatus | null;
}): ScoreResolution {
  const breakdown = normalizeScoreBreakdown(input.scores);
  const computedTotal = computeScoreTotal(breakdown);
  const override = typeof input.totalOverride === "number" && Number.isFinite(input.totalOverride) ? Math.min(SCORE_MAX_TOTAL, Math.max(0, Math.round(input.totalOverride))) : null;
  const effectiveTotal = override ?? computedTotal;
  const suggestedStatus = suggestedStatusForScore(effectiveTotal);
  const finalStatus = input.finalStatus && SUGGESTED_STATUSES.includes(input.finalStatus) ? input.finalStatus : null;
  return {
    breakdown,
    computedTotal,
    effectiveTotal,
    hasManualTotal: override !== null,
    deviation: override === null ? 0 : override - computedTotal,
    suggestedStatus,
    effectiveStatus: finalStatus ?? suggestedStatus,
    hasManualStatus: finalStatus !== null,
  };
}

// ── Voies possibles ───────────────────────────────────────────────────────────

export const ROUTE_KEYS = ["A", "B", "C", "D", "E", "F"] as const;
export type RouteKey = (typeof ROUTE_KEYS)[number];
export const ROUTE_LABELS: Record<RouteKey, string> = {
  A: "Visa travail avec employeur",
  B: "Résidence permanente / immigration qualifiée",
  C: "Études ou formation internationale",
  D: "Reconnaissance professionnelle / équivalence",
  E: "Plan de préparation de 6 à 24 mois",
  F: "Réorientation vers un pays plus réaliste",
};

export const MAX_ALTERNATIVE_COUNTRIES = 3;

// ── Statuts du workflow et transitions autorisées ────────────────────────────

export const WORKFLOW_STATUSES = [
  "dossier_recu",
  "attente_validation_admin",
  "en_revue_admin",
  "informations_complementaires",
  "validee_publiee",
  "validee_publiee_notifiee",
] as const;
export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
  dossier_recu: "DOSSIER REÇU",
  attente_validation_admin: "EN ATTENTE DE VALIDATION ADMINISTRATEUR",
  en_revue_admin: "EN REVUE ADMINISTRATEUR",
  informations_complementaires: "INFORMATIONS COMPLÉMENTAIRES REQUISES",
  validee_publiee: "ÉVALUATION VALIDÉE ET PUBLIÉE",
  validee_publiee_notifiee: "ÉVALUATION VALIDÉE, PUBLIÉE ET NOTIFIÉE",
};

export const WORKFLOW_ACTIONS = [
  "generate_ai_draft",
  "save_draft",
  "request_info",
  "candidate_replied",
  "publish",
  "publish_and_notify",
  "send_notification",
  "start_reevaluation",
] as const;
export type WorkflowAction = (typeof WORKFLOW_ACTIONS)[number];

const TRANSITIONS: Record<WorkflowStatus, Partial<Record<WorkflowAction, WorkflowStatus>>> = {
  dossier_recu: {
    generate_ai_draft: "attente_validation_admin",
    save_draft: "en_revue_admin",
    request_info: "informations_complementaires",
    publish: "validee_publiee",
    publish_and_notify: "validee_publiee_notifiee",
  },
  attente_validation_admin: {
    save_draft: "en_revue_admin",
    request_info: "informations_complementaires",
    publish: "validee_publiee",
    publish_and_notify: "validee_publiee_notifiee",
  },
  en_revue_admin: {
    save_draft: "en_revue_admin",
    request_info: "informations_complementaires",
    publish: "validee_publiee",
    publish_and_notify: "validee_publiee_notifiee",
  },
  informations_complementaires: {
    // le candidat a répondu ou déposé des pièces : le dossier repart en attente de validation
    candidate_replied: "attente_validation_admin",
    save_draft: "en_revue_admin",
  },
  // la publication reste acquise même si l'e-mail échoue : la notification peut être renvoyée
  validee_publiee: { send_notification: "validee_publiee_notifiee", start_reevaluation: "en_revue_admin" },
  validee_publiee_notifiee: { start_reevaluation: "en_revue_admin" },
};

/** Statut suivant, ou null si l'action est interdite depuis le statut courant. */
export function nextWorkflowStatus(current: WorkflowStatus, action: WorkflowAction): WorkflowStatus | null {
  return TRANSITIONS[current]?.[action] ?? null;
}

export function isPublishedStatus(status: WorkflowStatus): boolean {
  return status === "validee_publiee" || status === "validee_publiee_notifiee";
}

/**
 * Ce que le candidat a le droit de voir. Le rapport final n'est visible que s'il existe une version
 * PUBLIÉE (une réévaluation en cours ne retire pas le dernier rapport publié, et ne montre jamais
 * son brouillon). Les demandes de complément sont visibles à part, sans brouillon ni score.
 */
export function candidateVisibility(status: WorkflowStatus, hasPublishedVersion: boolean): {
  showFinalReport: boolean;
  showPendingNotice: boolean;
  showInfoRequests: boolean;
} {
  const showFinalReport = hasPublishedVersion || isPublishedStatus(status);
  return {
    showFinalReport,
    showPendingNotice: !showFinalReport,
    showInfoRequests: status === "informations_complementaires",
  };
}

// ── Formulations interdites et données sensibles ─────────────────────────────

// Caractères invisibles ou de mise en forme (trait d'union conditionnel, espaces de largeur nulle, marques de
// direction, joiners, BOM) : ils permettraient d'écrire « garanti » sans que la détection le voie.
const INVISIBLE_CHARACTERS = /[\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g;

const fold = (value: string) =>
  value
    .normalize("NFKD")
    .replace(INVISIBLE_CHARACTERS, "")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’‘`´]/g, "'");

export const FORBIDDEN_TERMS: ReadonlyArray<{ label: string; pattern: RegExp }> = [
  { label: "approuvé", pattern: /\bapprouv\w*/ },
  { label: "garanti", pattern: /\bgaranti\w*/ },
  { label: "éligible officiellement", pattern: /\b(?:eligible|eligibles)\s+officiellement\b|\bofficiellement\s+(?:eligible|eligibles)\b/ },
  { label: "visa assuré", pattern: /\bvisa\s+assur\w*/ },
  { label: "emploi assuré", pattern: /\bemploi\s+assur\w*/ },
  { label: "résidence assurée", pattern: /\bresidence\s+(?:permanente\s+)?assur\w*/ },
];

const BOILERPLATES = [LEGAL_DISCLAIMER, EMAIL_DISCLAIMER].map(fold);
// « aucune garantie », « sans garantie de résultat », « ne constitue pas une garantie » : négations légitimes
const NEGATED_GUARANTEE = /\b(?:aucune|nulle|sans|pas\s+(?:une|de|d'|la)|ne\s+constitue\s+pas\s+une|n'est\s+pas\s+une)\s+garantie\w*/g;

/** Termes interdits présents dans un texte destiné au candidat (avertissements légaux exemptés). */
export function findForbiddenTerms(text: string): string[] {
  let folded = fold(text);
  for (const boilerplate of BOILERPLATES) folded = folded.split(boilerplate).join(" ");
  folded = folded.replace(NEGATED_GUARANTEE, " ");
  return FORBIDDEN_TERMS.filter((term) => term.pattern.test(folded)).map((term) => term.label);
}

export class ClientTextViolationError extends Error {
  constructor(public readonly field: string, public readonly terms: string[]) {
    super(`Formulation interdite dans « ${field} » : ${terms.join(", ")}. Corrigez-la avant de publier.`);
    this.name = "ClientTextViolationError";
  }
}

export function assertClientSafeText(field: string, text: string): void {
  const terms = findForbiddenTerms(text);
  if (terms.length > 0) throw new ClientTextViolationError(field, terms);
}

/** Motifs de données sensibles qui ne doivent jamais partir par e-mail. */
export function findSensitiveData(text: string): string[] {
  const folded = fold(text);
  const reasons: string[] = [];
  if (/\bnumero\s+de\s+passeport\b|\bpasseport\s*(?:n°|no\b|num\w*|:)\s*[a-z0-9]{6,}/.test(folded) || /\b[a-z]{1,2}\d{6,9}\b/.test(folded)) reasons.push("numéro de passeport");
  if (/\b[a-z]{2}\d{2}(?:\s?[a-z0-9]{4}){3,7}\b/.test(folded) || /\biban\b|\brib\b|\bnumero\s+de\s+compte\b|\breleve\s+bancaire\b/.test(folded)) reasons.push("information bancaire");
  if (/\b(?:\d[ -]?){13,19}\b/.test(folded)) reasons.push("numéro de carte");
  if (/\bacte\s+de\s+naissance\b/.test(folded)) reasons.push("acte de naissance");
  if (/\bcasier\s+judiciaire\b|\bextrait\s+de\s+casier\b/.test(folded)) reasons.push("casier judiciaire");
  return reasons;
}

export class SensitiveDataError extends Error {
  constructor(public readonly field: string, public readonly reasons: string[]) {
    super(`« ${field} » contient une donnée sensible (${reasons.join(", ")}) : elle ne doit jamais être envoyée par e-mail.`);
    this.name = "SensitiveDataError";
  }
}

export function assertNoSensitiveData(field: string, text: string): void {
  const reasons = findSensitiveData(text);
  if (reasons.length > 0) throw new SensitiveDataError(field, reasons);
}

/**
 * Valeurs sensibles elles-mêmes (numéro de passeport, IBAN, numéro de carte), sans les simples mots : un rapport
 * peut légitimement NOMMER un document (« Acte de naissance », « Relevé bancaire ») sans en contenir le contenu.
 */
export function findSensitiveValues(text: string): string[] {
  const folded = fold(text);
  const reasons: string[] = [];
  if (/\bpasseport\s*(?:n°|no\b|num\w*|:)\s*[a-z0-9]{6,}/.test(folded) || /\b[a-z]{1,2}\d{6,9}\b/.test(folded)) reasons.push("numéro de passeport");
  if (/\b[a-z]{2}\d{2}(?:\s?[a-z0-9]{4}){3,7}\b/.test(folded)) reasons.push("information bancaire");
  if (/\b(?:\d[ -]?){13,19}\b/.test(folded)) reasons.push("numéro de carte");
  return reasons;
}

export function assertNoSensitiveValues(field: string, text: string): void {
  const reasons = findSensitiveValues(text);
  if (reasons.length > 0) throw new SensitiveDataError(field, reasons);
}

// ── Checklist obligatoire avant publication ──────────────────────────────────

export const PUBLICATION_CHECKLIST = [
  { key: "coherence", label: "J’ai vérifié la cohérence du CV, du formulaire et des documents disponibles.", onlyWhenEmail: false },
  { key: "priorityCountry", label: "J’ai confirmé le pays prioritaire du candidat.", onlyWhenEmail: false },
  { key: "finalScore", label: "J’ai contrôlé ou ajusté le score final.", onlyWhenEmail: false },
  { key: "route", label: "J’ai vérifié la voie recommandée et les alternatives éventuelles.", onlyWhenEmail: false },
  { key: "documents", label: "J’ai vérifié la liste des documents à fournir.", onlyWhenEmail: false },
  { key: "unverifiable", label: "J’ai retiré toute information non vérifiable ou formulation trompeuse.", onlyWhenEmail: false },
  { key: "clientPreview", label: "J’ai relu l’aperçu final visible par le candidat.", onlyWhenEmail: false },
  { key: "emailReviewed", label: "J’ai relu l’email de notification, si l’envoi est sélectionné.", onlyWhenEmail: true },
] as const;
export type PublicationChecklistKey = (typeof PUBLICATION_CHECKLIST)[number]["key"];
export type PublicationChecklist = Partial<Record<PublicationChecklistKey, boolean>>;

/** Éléments encore à cocher ; la relecture de l'e-mail n'est exigée que si l'envoi est choisi. */
export function missingChecklistItems(checked: PublicationChecklist | null | undefined, options: { sendEmail: boolean }): PublicationChecklistKey[] {
  return PUBLICATION_CHECKLIST.filter((item) => (options.sendEmail || !item.onlyWhenEmail) && checked?.[item.key] !== true).map((item) => item.key);
}

export function isChecklistComplete(checked: PublicationChecklist | null | undefined, options: { sendEmail: boolean }): boolean {
  return missingChecklistItems(checked, options).length === 0;
}

// ── Version administrateur (celle qui devient le rapport client) ─────────────

export const DOCUMENT_STATUSES = ["recu", "a_fournir", "a_mettre_a_jour", "a_verifier"] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];
export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  recu: "Reçu",
  a_fournir: "À fournir",
  a_mettre_a_jour: "À mettre à jour",
  a_verifier: "À vérifier",
};

export const RISK_LEVELS = ["faible", "modere", "eleve"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];
export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = { faible: "Faible", modere: "Modéré", eleve: "Élevé" };

const shortText = z.string().trim().min(1).max(600);
const longText = z.string().trim().max(4000);

const scoreShape = Object.fromEntries(SCORE_CRITERIA.map((criterion) => [criterion.key, z.number().int().min(0).max(criterion.max)])) as Record<ScoreCriterionKey, z.ZodNumber>;

export const AdminEvaluationVersionSchema = z.object({
  priorityCountry: z.string().trim().min(2).max(100),
  scores: z.object(scoreShape),
  /** Score global fixé à la main (sinon calculé). */
  totalOverride: z.number().int().min(0).max(SCORE_MAX_TOTAL).nullable(),
  finalStatus: z.enum(SUGGESTED_STATUSES).nullable(),
  route: z.enum(ROUTE_KEYS).nullable(),
  targetJobs: z.array(shortText).max(12),
  targetSectors: z.array(shortText).max(12),
  profileSummary: longText,
  strengths: z.array(shortText).max(20),
  improvements: z.array(shortText).max(20),
  blockers: z.array(shortText).max(20),
  riskLevel: z.enum(RISK_LEVELS).nullable(),
  actionPlan: z.array(z.object({ title: shortText, detail: longText.optional(), horizon: z.string().trim().max(80).optional() })).max(20),
  requiredDocuments: z.array(z.object({ label: shortText, status: z.enum(DOCUMENT_STATUSES) })).max(40),
  alternatives: z.array(z.object({ country: z.string().trim().min(2).max(100), rationale: longText })).max(MAX_ALTERNATIVE_COUNTRIES),
  clientRemarks: longText,
  evaluationDate: z.string().trim().max(40),
  validUntil: z.string().trim().max(40).nullable(),
  emailSubject: z.string().trim().max(200),
  emailBody: z.string().trim().max(6000),
  sendEmail: z.boolean(),
  /** Jamais visible du candidat. */
  internalComment: longText,
});
export type AdminEvaluationVersion = z.infer<typeof AdminEvaluationVersionSchema>;

/** Champs suivis dans l'historique des modifications (ancienne et nouvelle valeur, auteur, date). */
export const AUDITED_VERSION_FIELDS = Object.keys(AdminEvaluationVersionSchema.shape) as Array<keyof AdminEvaluationVersion>;

export type FieldChange = { field: keyof AdminEvaluationVersion | `scores.${ScoreCriterionKey}`; oldValue: unknown; newValue: unknown };

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** Différences champ par champ (les notes sont détaillées critère par critère). */
export function diffEvaluationVersions(previous: AdminEvaluationVersion | null, next: AdminEvaluationVersion): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const field of AUDITED_VERSION_FIELDS) {
    if (field === "scores") {
      for (const criterion of SCORE_CRITERIA) {
        const before = previous?.scores?.[criterion.key] ?? null;
        const after = next.scores[criterion.key];
        if (!same(before, after)) changes.push({ field: `scores.${criterion.key}`, oldValue: before, newValue: after });
      }
      continue;
    }
    if (!same(previous?.[field], next[field])) changes.push({ field, oldValue: previous?.[field] ?? null, newValue: next[field] });
  }
  return changes;
}

// ── Rapport client (généré UNIQUEMENT depuis la version administrateur validée) ──

export type ClientReport = {
  candidateName: string;
  validatedAt: string;
  priorityCountry: string;
  score: number;
  scoreMax: number;
  status: SuggestedStatus;
  statusLabel: string;
  route: { key: RouteKey; label: string } | null;
  profileSummary: string;
  scoreBreakdown: Array<{ key: ScoreCriterionKey; label: string; score: number; max: number }>;
  strengths: string[];
  improvements: string[];
  riskLevel: RiskLevel | null;
  actionPlan: AdminEvaluationVersion["actionPlan"];
  documents: Array<{ label: string; status: DocumentStatus; statusLabel: string }>;
  alternatives: AdminEvaluationVersion["alternatives"];
  remarks: string;
  validUntil: string | null;
  legalDisclaimer: string;
};

/**
 * Construit le rapport visible par le candidat. Le rapport ne reprend explicitement que les champs
 * destinés au client : le commentaire interne, l'e-mail et le brouillon IA n'y figurent jamais.
 * Toute formulation interdite fait échouer la publication au lieu d'être publiée.
 */
export function buildClientReport(version: AdminEvaluationVersion, meta: { candidateName: string; validatedAt: string }): ClientReport {
  const parsed = AdminEvaluationVersionSchema.parse(version);
  const resolution = resolveScore({ scores: parsed.scores, totalOverride: parsed.totalOverride, finalStatus: parsed.finalStatus });
  const report: ClientReport = {
    candidateName: meta.candidateName,
    validatedAt: meta.validatedAt,
    priorityCountry: parsed.priorityCountry,
    score: resolution.effectiveTotal,
    scoreMax: SCORE_MAX_TOTAL,
    status: resolution.effectiveStatus,
    statusLabel: SUGGESTED_STATUS_LABELS[resolution.effectiveStatus],
    route: parsed.route ? { key: parsed.route, label: ROUTE_LABELS[parsed.route] } : null,
    profileSummary: parsed.profileSummary,
    scoreBreakdown: SCORE_CRITERIA.map((criterion) => ({ key: criterion.key, label: criterion.label, score: resolution.breakdown[criterion.key], max: criterion.max })),
    strengths: parsed.strengths,
    improvements: [...parsed.improvements, ...parsed.blockers],
    riskLevel: parsed.riskLevel,
    actionPlan: parsed.actionPlan,
    documents: parsed.requiredDocuments.map((document) => ({ label: document.label, status: document.status, statusLabel: DOCUMENT_STATUS_LABELS[document.status] })),
    alternatives: parsed.alternatives.slice(0, MAX_ALTERNATIVE_COUNTRIES),
    remarks: parsed.clientRemarks,
    validUntil: parsed.validUntil,
    legalDisclaimer: LEGAL_DISCLAIMER,
  };
  // TOUT texte affiché au candidat est contrôlé (formulations interdites ET valeurs sensibles) : y compris les
  // champs courts (échéances, pays, validité, nom) qui échappaient à un contrôle limité aux paragraphes.
  const texts: Array<[string, string]> = [
    ["Nom du candidat", report.candidateName],
    ["Pays prioritaire", report.priorityCountry],
    ["Résumé du profil", report.profileSummary],
    ["Observations", report.remarks],
    ["Valable jusqu’au", report.validUntil ?? ""],
    ...report.strengths.map((value, index): [string, string] => [`Atout ${index + 1}`, value]),
    ...report.improvements.map((value, index): [string, string] => [`Point à renforcer ${index + 1}`, value]),
    ...report.actionPlan.map((step, index): [string, string] => [`Plan d’action ${index + 1}`, `${step.title} ${step.detail ?? ""} ${step.horizon ?? ""}`]),
    ...report.documents.map((document, index): [string, string] => [`Document ${index + 1}`, document.label]),
    ...report.alternatives.map((alternative, index): [string, string] => [`Alternative ${index + 1}`, `${alternative.country} ${alternative.rationale}`]),
  ];
  for (const [field, text] of texts) {
    assertClientSafeText(field, text);
    assertNoSensitiveValues(field, text);
  }
  return report;
}

// ── E-mail de notification ───────────────────────────────────────────────────

export const NOTIFICATION_EMAIL_SUBJECT = "Votre évaluation professionnelle est disponible — 3M Travel & Services";
export const NOTIFICATION_PORTAL_PLACEHOLDER = "[LIEN_PORTAIL_CLIENT]";

export const NOTIFICATION_EMAIL_SIGNATURE = [
  "Direction de la Mobilité Internationale",
  "3M Travel & Services",
  "",
  "Cameroun / WhatsApp : +237 698 104 832 | +237 620 996 045",
  "Bureau Canada : +1 672 897 2999",
  "Email : hello@3mtravelagency.com",
  "Site : www.3mtravelagency.com",
].join("\n");

/** Objet et corps par défaut (modifiables par l'administrateur avant envoi). */
export function defaultNotificationEmail(input: { candidateName: string; priorityCountry: string }): { subject: string; body: string } {
  const body = [
    `Bonjour ${input.candidateName},`,
    "",
    `Votre préévaluation professionnelle pour votre projet de mobilité vers ${input.priorityCountry} a été examinée et validée par notre équipe.`,
    "",
    "Votre rapport personnel est désormais disponible dans votre espace sécurisé.",
    "",
    "Consulter votre évaluation :",
    "[BOUTON : Consulter mon évaluation]",
    "",
    `Lien sécurisé : ${NOTIFICATION_PORTAL_PLACEHOLDER}`,
    "",
    "Votre espace personnel contient votre score validé, l’analyse de votre projet, les recommandations, les documents à fournir et les prochaines étapes.",
    "",
    EMAIL_DISCLAIMER,
  ].join("\n");
  return { subject: NOTIFICATION_EMAIL_SUBJECT, body };
}

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const BUTTON_MARKER = /\[BOUTON\s*:\s*([^\]]*)\]/g;

/**
 * Rend l'e-mail à envoyer. L'objet et le corps sont contrôlés (formulations interdites, données
 * sensibles) ; le lien sécurisé est celui du portail, jamais un lien vers un brouillon.
 */
export function renderNotificationEmail(input: { subject: string; body: string; portalUrl: string }): { subject: string; text: string; html: string } {
  assertClientSafeText("Objet de l’e-mail", input.subject);
  assertClientSafeText("Corps de l’e-mail", input.body);
  assertNoSensitiveData("Objet de l’e-mail", input.subject);
  assertNoSensitiveData("Corps de l’e-mail", input.body);
  const withLink = input.body.split(NOTIFICATION_PORTAL_PLACEHOLDER).join(input.portalUrl);
  // Le marqueur [BOUTON : libellé] devient un vrai bouton en HTML et « libellé : lien » en texte brut.
  const text = `${withLink.replace(BUTTON_MARKER, (_marker, label: string) => `${label.trim()} : ${input.portalUrl}`)}\n\n${NOTIFICATION_EMAIL_SIGNATURE}`;
  const blocks = withLink
    .replace(BUTTON_MARKER, (_marker, label: string) => `\n\n[[BOUTON:${label.trim()}]]\n\n`)
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  const paragraphs = blocks.map((block) => {
    const button = /^\[\[BOUTON:(.*)\]\]$/.exec(block);
    if (button) {
      return `<p style="text-align:center;margin:24px 0"><a href="${escapeHtml(input.portalUrl)}" style="background:#1d4ed8;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold">${escapeHtml(button[1] || "Consulter mon évaluation")}</a></p>`;
    }
    return `<p style="margin:0 0 14px;line-height:1.6">${escapeHtml(block).replace(/\n/g, "<br>")}</p>`;
  });
  const signature = `<p style="margin:24px 0 0;line-height:1.6;color:#334155">${escapeHtml(NOTIFICATION_EMAIL_SIGNATURE).replace(/\n/g, "<br>")}</p>`;
  return { subject: input.subject, text, html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a">${paragraphs.join("")}${signature}</div>` };
}

// ── Brouillon IA (sortie validée par schéma ; jamais visible du candidat) ─────

export const PROJECT_TYPES = ["travail", "etudes", "residence_permanente", "formation", "reconnaissance", "autre"] as const;

const gapItem = z.object({ label: shortText, detail: longText.optional() });
const nullableText = z.string().trim().max(300).nullable();

export const AiEvaluationDraftSchema = z.object({
  priorityCountry: z.string().trim().min(2).max(100),
  projectType: z.enum(PROJECT_TYPES),
  /** Informations extraites : null quand l'information n'a pas été fournie (jamais inventée). */
  extracted: z.object({
    fullName: nullableText,
    ageOrBirthDate: nullableText,
    nationality: nullableText,
    residenceCountry: nullableText,
    passportAvailable: z.boolean().nullable(),
    profession: nullableText,
    professionalLevel: nullableText,
    diplomas: z.array(shortText).max(20),
    verifiableExperienceYears: z.number().min(0).max(60).nullable(),
    skills: z.array(shortText).max(40),
    languages: z.array(shortText).max(20),
    budget: nullableText,
    documentsAvailable: z.array(shortText).max(40),
    documentsMissing: z.array(shortText).max(40),
  }),
  gaps: z.object({ blocking: z.array(gapItem).max(20), reinforceable: z.array(gapItem).max(20), nonBlocking: z.array(gapItem).max(20) }),
  route: z.enum(ROUTE_KEYS),
  alternativeCountries: z.array(z.object({ country: z.string().trim().min(2).max(100), rationale: longText })).max(MAX_ALTERNATIVE_COUNTRIES),
  scores: z.object(scoreShape),
  strengths: z.array(shortText).max(20),
  improvements: z.array(shortText).max(20),
  targetJobs: z.array(shortText).max(12),
  targetSectors: z.array(shortText).max(12),
  riskLevel: z.enum(RISK_LEVELS),
  profileSummary: longText,
  actionPlan: z.array(z.object({ title: shortText, detail: longText.optional(), horizon: z.string().trim().max(80).optional() })).max(20),
  requiredDocuments: z.array(z.object({ label: shortText, status: z.enum(DOCUMENT_STATUSES) })).max(40),
});
export type AiEvaluationDraft = z.infer<typeof AiEvaluationDraftSchema>;

/** Point de départ de la version administrateur : une COPIE du brouillon IA (l'original reste intact). */
export function versionFromAiDraft(draft: AiEvaluationDraft, meta: { evaluationDate: string }): AdminEvaluationVersion {
  const resolution = resolveScore({ scores: draft.scores });
  const email = defaultNotificationEmail({ candidateName: draft.extracted.fullName ?? "", priorityCountry: draft.priorityCountry });
  return {
    priorityCountry: draft.priorityCountry,
    scores: resolution.breakdown,
    totalOverride: null,
    finalStatus: null,
    route: draft.route,
    targetJobs: [...draft.targetJobs],
    targetSectors: [...draft.targetSectors],
    profileSummary: draft.profileSummary,
    strengths: [...draft.strengths],
    improvements: [...draft.improvements],
    blockers: draft.gaps.blocking.map((gap) => gap.label),
    riskLevel: draft.riskLevel,
    actionPlan: draft.actionPlan.map((step) => ({ ...step })),
    requiredDocuments: draft.requiredDocuments.map((document) => ({ ...document })),
    alternatives: draft.alternativeCountries.map((alternative) => ({ ...alternative })),
    clientRemarks: "",
    evaluationDate: meta.evaluationDate,
    validUntil: null,
    emailSubject: email.subject,
    emailBody: email.body,
    sendEmail: false,
    internalComment: "",
  };
}

/** Formulations interdites détectées dans un brouillon IA : signalées à l'administrateur, jamais supprimées en silence. */
export function auditAiDraftWording(draft: AiEvaluationDraft): Array<{ field: string; terms: string[] }> {
  const gaps = [...draft.gaps.blocking, ...draft.gaps.reinforceable, ...draft.gaps.nonBlocking];
  const fields: Array<[string, string]> = [
    ["Résumé du profil", draft.profileSummary],
    ...draft.strengths.map((value, index): [string, string] => [`Atout ${index + 1}`, value]),
    ...draft.improvements.map((value, index): [string, string] => [`Point à renforcer ${index + 1}`, value]),
    ...draft.actionPlan.map((step, index): [string, string] => [`Plan d’action ${index + 1}`, `${step.title} ${step.detail ?? ""} ${step.horizon ?? ""}`]),
    ...draft.alternativeCountries.map((alternative, index): [string, string] => [`Alternative ${index + 1}`, `${alternative.country} ${alternative.rationale}`]),
    // les lacunes bloquantes sont publiées parmi les « points à renforcer » et les documents tels quels
    ...gaps.map((gap, index): [string, string] => [`Lacune ${index + 1}`, `${gap.label} ${gap.detail ?? ""}`]),
    ...draft.requiredDocuments.map((document, index): [string, string] => [`Document ${index + 1}`, document.label]),
  ];
  return fields
    .map(([field, text]) => ({ field, terms: [...findForbiddenTerms(text), ...findSensitiveValues(text).map((reason) => `donnée sensible (${reason})`)] }))
    .filter((entry) => entry.terms.length > 0);
}

/** Version administrateur vierge (IA indisponible ou évaluation saisie à la main) : rien n'est inventé. */
export function blankAdminVersion(meta: { priorityCountry: string; candidateName: string; evaluationDate: string }): AdminEvaluationVersion {
  const email = defaultNotificationEmail({ candidateName: meta.candidateName, priorityCountry: meta.priorityCountry });
  return {
    priorityCountry: meta.priorityCountry,
    scores: normalizeScoreBreakdown({}),
    totalOverride: null,
    finalStatus: null,
    route: null,
    targetJobs: [],
    targetSectors: [],
    profileSummary: "",
    strengths: [],
    improvements: [],
    blockers: [],
    riskLevel: null,
    actionPlan: [],
    requiredDocuments: [],
    alternatives: [],
    clientRemarks: "",
    evaluationDate: meta.evaluationDate,
    validUntil: null,
    emailSubject: email.subject,
    emailBody: email.body,
    sendEmail: false,
    internalComment: "",
  };
}

/** Rendu texte du rapport client (compatibilité avec les écrans qui affichent un texte de réponse). */
export function clientReportToPlainText(report: ClientReport): string {
  const lines: string[] = [
    `Évaluation validée le ${report.validatedAt} — pays prioritaire : ${report.priorityCountry}`,
    `Score validé : ${report.score}/${report.scoreMax} — ${report.statusLabel}`,
  ];
  if (report.route) lines.push(`Voie principale recommandée : ${report.route.label}`);
  if (report.profileSummary) lines.push("", report.profileSummary);
  if (report.strengths.length) lines.push("", "Atouts :", ...report.strengths.map((item) => `- ${item}`));
  if (report.improvements.length) lines.push("", "Points à renforcer :", ...report.improvements.map((item) => `- ${item}`));
  if (report.actionPlan.length) lines.push("", "Plan d’action :", ...report.actionPlan.map((step) => `- ${step.title}${step.horizon ? ` (${step.horizon})` : ""}`));
  if (report.documents.length) lines.push("", "Documents :", ...report.documents.map((document) => `- ${document.label} : ${document.statusLabel}`));
  lines.push("", report.legalDisclaimer);
  return lines.join("\n");
}
