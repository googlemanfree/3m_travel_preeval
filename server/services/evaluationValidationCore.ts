import { createHash } from "node:crypto";
import { z } from "zod";
import { CV_MISSING_FOR_PUBLICATION } from "../../shared/evaluationCv";
import {
  ADMIN_DRAFT_BADGE,
  AI_DRAFT_LABEL,
  AdminEvaluationVersionSchema,
  CANDIDATE_PENDING_NOTICE,
  MAX_ALTERNATIVE_COUNTRIES,
  PUBLICATION_CHECKLIST,
  WORKFLOW_STATUS_LABELS,
  assertClientSafeText,
  assertNoSensitiveData,
  auditAiDraftWording,
  blankAdminVersion,
  buildClientReport,
  candidateVisibility,
  clientReportToPlainText,
  defaultNotificationEmail,
  diffEvaluationVersions,
  missingChecklistItems,
  nextWorkflowStatus,
  renderNotificationEmail,
  resolveScore,
  versionFromAiDraft,
  type AdminEvaluationVersion,
  type AiEvaluationDraft,
  type ClientReport,
  type PublicationChecklist,
  type ScoreResolution,
  type SuggestedStatus,
  type WorkflowStatus,
} from "../../shared/evaluationValidation";

/**
 * Orchestration de l'évaluation IA à validation administrateur obligatoire.
 *
 * Aucune base, aucun réseau, aucune IA ici : le store, le mailer et l'horloge sont injectés afin de
 * tester les garanties du brief sur un store en mémoire :
 *   - rien n'est visible du candidat ni envoyé tant qu'un administrateur n'a pas publié ;
 *   - la publication est enregistrée AVANT l'e-mail, et un e-mail en échec n'annule pas la publication ;
 *   - deux administrateurs ne peuvent pas publier (ni notifier) la même version en même temps ;
 *   - toute modification est tracée champ par champ, dans la même transaction que l'état.
 */

export const SYSTEM_ACTOR = "systeme-ia";
export const CANDIDATE_ACTOR = "candidat";

// ── Erreurs ──────────────────────────────────────────────────────────────────

export type ValidationFlowErrorCode =
  | "NOT_FOUND"
  | "INVALID_STATE"
  | "INVALID_INPUT"
  | "CHECKLIST_INCOMPLETE"
  | "INCOMPLETE_VERSION"
  | "STALE_VERSION"
  | "SECOND_VALIDATION_REQUIRED"
  | "NO_RECIPIENT"
  | "CV_REQUIRED"
  | "CONFLICT";

export class ValidationFlowError extends Error {
  constructor(
    public readonly code: ValidationFlowErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ValidationFlowError";
  }
}

// ── Modèle et ports (injectés) ───────────────────────────────────────────────

export type AiDraftWarning = { field: string; message: string };

export type InfoRequestItem = { id: string; label: string };
export type InfoRequest = {
  message: string;
  items: InfoRequestItem[];
  requestedAt: string;
  response: { answers: Array<{ id: string; answer: string }>; note: string; respondedAt: string } | null;
};

export type ValidationCase = {
  id: number;
  evaluationId: number;
  versionNumber: number;
  workflowStatus: WorkflowStatus;
  aiDraft: AiEvaluationDraft | null;
  aiDraftGeneratedAt: Date | null;
  aiDraftModel: string | null;
  aiDraftWarnings: AiDraftWarning[];
  aiDraftError: string | null;
  adminVersion: AdminEvaluationVersion | null;
  adminVersionUpdatedAt: Date | null;
  adminVersionUpdatedBy: string | null;
  firstValidatedBy: string | null;
  firstValidatedAt: Date | null;
  infoRequest: InfoRequest | null;
  infoRequestedAt: Date | null;
  infoRequestedBy: string | null;
  publishedReport: ClientReport | null;
  publishedAt: Date | null;
  publishedBy: string | null;
  publishedChecklist: PublicationChecklist | null;
  emailSubject: string | null;
  emailSentAt: Date | null;
  emailError: string | null;
  /** Réservation d'un envoi d'e-mail en cours (évite les doublons) ; expire après `EMAIL_CLAIM_TTL_MS`. */
  emailClaimedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ValidationCasePatch = Partial<Omit<ValidationCase, "id" | "evaluationId" | "versionNumber" | "createdAt" | "updatedAt">>;
export type NewValidationCase = ValidationCasePatch & { evaluationId: number; versionNumber: number; workflowStatus: WorkflowStatus };

export type FieldChangeInput = { field: string; oldValue: unknown; newValue: unknown };
export type FieldChangeRecord = FieldChangeInput & { evaluationId: number; versionNumber: number; adminEmail: string; createdAt: Date };

export type LegacyPublication = {
  publishedBy: string;
  publishedAt: Date;
  /** Rapport rendu en texte, pour les écrans qui lisent encore `evaluations.reviewDraft`. */
  reportText: string;
  secondValidatedBy: string | null;
  /** Premier validateur (distinct du second) : les écrans historiques affichent « relu par » puis « seconde relecture par ». */
  firstValidatedBy: string;
  firstValidatedAt: Date;
};

/**
 * Préconditions vérifiées SOUS VERROU en plus du statut : la ligne ne doit pas avoir changé de contenu entre
 * la lecture qui a servi aux contrôles et l'écriture (sinon deux administrateurs qui agissent en même temps se
 * marcheraient dessus sans que le statut ne change).
 */
export type UpdateGuard = {
  /** Empreinte (`versionStamp`) que la version administrateur enregistrée doit encore avoir. */
  adminVersionStamp?: string;
  /** Aucun brouillon IA ne doit encore exister (le brouillon initial n'est écrit qu'une fois). */
  requireNoAiDraft?: boolean;
  /** Aucun envoi d'e-mail ne doit être en cours : `emailClaimedAt` vide, ou antérieur à cette date. */
  emailClaimableSince?: Date;
};

/** Durée pendant laquelle une réservation d'envoi bloque un second envoi (largement > au délai SMTP maximal). */
export const EMAIL_CLAIM_TTL_MS = 10 * 60 * 1000;

/** Effets écrits dans la MÊME transaction que le changement d'état. */
export type TransitionEffects = {
  changes?: { adminEmail: string; rows: FieldChangeInput[] };
  audit?: { adminEmail: string; action: string; note?: string };
  legacyPublication?: LegacyPublication;
};

export type EvaluationContext = {
  evaluationId: number;
  candidateName: string;
  candidateEmail: string;
  /** Pays choisi par le candidat : toujours le pays prioritaire. */
  candidateCountry: string;
  /** CV au dossier : élément clé, l'évaluation ne peut pas être publiée sans lui. */
  cvOnFile: boolean;
  cvFileName: string | null;
  /** Lien d'ouverture du CV, réservé à l'administrateur (jamais renvoyé au candidat). */
  cvFileUrl: string | null;
};

export type CandidateCv = { onFile: boolean; fileName: string | null };

export interface ValidationStore {
  loadEvaluationContext(evaluationId: number): Promise<EvaluationContext | null>;
  /** Remplace le CV du dossier (dépôt par le candidat) ; renvoie false si l'évaluation n'existe pas. */
  attachCv(evaluationId: number, cv: { url: string; fileName: string }): Promise<boolean>;
  getLatestCase(evaluationId: number): Promise<ValidationCase | null>;
  getLatestPublishedCase(evaluationId: number): Promise<ValidationCase | null>;
  listCases(evaluationId: number): Promise<ValidationCase[]>;
  /** Insère une version ; renvoie null si (evaluationId, versionNumber) existe déjà (course entre deux requêtes). */
  insertCase(input: NewValidationCase, effects?: TransitionEffects): Promise<ValidationCase | null>;
  /** Applique le patch seulement si le statut est encore `expectedStatus` et si la `guard` tient ; renvoie null sinon. */
  updateCaseIf(id: number, expectedStatus: WorkflowStatus, patch: ValidationCasePatch, effects?: TransitionEffects, guard?: UpdateGuard): Promise<ValidationCase | null>;
  listChanges(evaluationId: number): Promise<FieldChangeRecord[]>;
  latestStatuses(evaluationIds: number[]): Promise<Map<number, { status: WorkflowStatus; versionNumber: number; updatedAt: Date }>>;
}

export interface Mailer {
  /** Doit lever une erreur si l'e-mail n'a pas pu être remis à l'expéditeur. */
  send(message: { to: string; subject: string; text: string; html: string }): Promise<void>;
}

export type ValidationPolicy = {
  /** Statuts finaux dont la publication exige deux administrateurs distincts (règle historique du site). */
  requireSecondValidationFor: ReadonlyArray<SuggestedStatus>;
};
export const DEFAULT_VALIDATION_POLICY: ValidationPolicy = { requireSecondValidationFor: ["preparation_recommandee"] };

export type ValidationDeps = {
  store: ValidationStore;
  mailer: Mailer;
  now: () => Date;
  portalUrl: string;
  policy?: ValidationPolicy;
};

export type Actor = { email: string };

// ── Utilitaires ──────────────────────────────────────────────────────────────

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const truncate = (value: string, max: number) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);
const foldText = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’‘`´]/g, "'").replace(/\s+/g, " ").trim();
const sameCountry = (a: string, b: string) => foldText(a) === foldText(b);
const sameEmail = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
const looksDeliverable = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

/**
 * Empreinte du contenu de la version administrateur. Elle change dès qu'un champ change, ce qui
 * garantit qu'une publication porte exactement sur la version relue (l'horodatage MySQL n'a qu'une
 * précision d'une seconde et ne suffirait pas).
 */
export function versionStamp(version: AdminEvaluationVersion): string {
  const parsed = AdminEvaluationVersionSchema.safeParse(version);
  return createHash("sha256").update(JSON.stringify(parsed.success ? parsed.data : version)).digest("hex").slice(0, 32);
}

function parseVersion(input: unknown): AdminEvaluationVersion {
  const result = AdminEvaluationVersionSchema.safeParse(input);
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  throw new ValidationFlowError("INVALID_INPUT", `Champ « ${issue?.path.join(".") || "version"} » invalide : ${issue?.message ?? "valeur incorrecte"}.`);
}

function buildReport(version: AdminEvaluationVersion, meta: { candidateName: string; validatedAt: string }): ClientReport {
  try {
    return buildClientReport(version, meta);
  } catch (error) {
    if (error instanceof z.ZodError) throw new ValidationFlowError("INVALID_INPUT", "La version administrateur est invalide et ne peut pas être publiée.");
    throw error; // ClientTextViolationError : remonté tel quel, avec le champ et les termes fautifs
  }
}

/** Éléments sans lesquels un rapport client n'aurait pas de sens (aucune valeur n'est inventée pour les combler). */
export function missingPublishableFields(version: AdminEvaluationVersion): string[] {
  const missing: string[] = [];
  if (!version.priorityCountry.trim() || sameCountry(version.priorityCountry, PLACEHOLDER_COUNTRY)) missing.push("Pays prioritaire");
  if (!version.profileSummary.trim()) missing.push("Résumé du profil");
  if (!version.route) missing.push("Voie principale recommandée");
  return missing;
}

export function normalizeChecklist(input: PublicationChecklist | null | undefined): PublicationChecklist {
  return Object.fromEntries(PUBLICATION_CHECKLIST.map((item) => [item.key, input?.[item.key] === true])) as PublicationChecklist;
}

async function requireContext(store: ValidationStore, evaluationId: number): Promise<EvaluationContext> {
  const context = await store.loadEvaluationContext(evaluationId);
  if (!context) throw new ValidationFlowError("NOT_FOUND", "Évaluation introuvable.");
  return context;
}

async function requireLatest(deps: ValidationDeps, evaluationId: number): Promise<ValidationCase> {
  const found = await deps.store.getLatestCase(evaluationId);
  if (!found) throw new ValidationFlowError("NOT_FOUND", "Aucune évaluation structurée pour ce dossier.");
  return found;
}

/** Valeur provisoire du pays prioritaire quand le candidat n'en a choisi aucun : jamais publiable. */
export const PLACEHOLDER_COUNTRY = "À confirmer";

const conflict = () => new ValidationFlowError("CONFLICT", "Cette évaluation vient d’être modifiée par un autre administrateur. Rechargez la page avant de continuer.");

// ── Ouverture du dossier et brouillon IA ─────────────────────────────────────

/** Crée (une seule fois) la première version au statut « DOSSIER REÇU ». */
export async function ensureCase(deps: ValidationDeps, evaluationId: number): Promise<ValidationCase> {
  const existing = await deps.store.getLatestCase(evaluationId);
  if (existing) return existing;
  await requireContext(deps.store, evaluationId);
  const created = await deps.store.insertCase({ evaluationId, versionNumber: 1, workflowStatus: "dossier_recu" });
  return created ?? (await requireLatest(deps, evaluationId));
}

export type AiDraftOutcome = { ok: true; draft: AiEvaluationDraft; model: string } | { ok: false; error: string };

/**
 * Enregistre le brouillon IA. Il n'est écrit qu'une fois et n'est jamais réécrit (le score initial de
 * l'IA reste consultable) ; il ne remplace jamais une version déjà retouchée par un administrateur.
 * Le pays choisi par le candidat est toujours le pays prioritaire, quoi qu'ait proposé l'IA.
 */
export async function recordAiDraft(deps: ValidationDeps, evaluationId: number, outcome: AiDraftOutcome): Promise<ValidationCase> {
  const context = await requireContext(deps.store, evaluationId);
  const current = await ensureCase(deps, evaluationId);
  if (current.aiDraft) return current;
  if (current.workflowStatus !== "dossier_recu" && current.workflowStatus !== "attente_validation_admin") return current;

  const now = deps.now();
  const evaluationDate = isoDate(now);
  const adminEdited = current.adminVersionUpdatedBy !== null;
  const nextStatus = current.workflowStatus === "dossier_recu" ? (nextWorkflowStatus("dossier_recu", "generate_ai_draft") ?? current.workflowStatus) : current.workflowStatus;
  const chosenCountry = context.candidateCountry.trim();

  let patch: ValidationCasePatch;
  let audit: NonNullable<TransitionEffects["audit"]>;

  if (outcome.ok === false) {
    const error = truncate(outcome.error || "Échec de la génération du brouillon IA", 500);
    patch = {
      workflowStatus: nextStatus,
      aiDraftError: error,
      adminVersion: current.adminVersion ?? blankAdminVersion({ priorityCountry: chosenCountry || PLACEHOLDER_COUNTRY, candidateName: context.candidateName, evaluationDate }),
      adminVersionUpdatedAt: current.adminVersion ? current.adminVersionUpdatedAt : now,
    };
    audit = { adminEmail: SYSTEM_ACTOR, action: "structured_ai_failed", note: error };
  } else {
    const warnings: AiDraftWarning[] = [];
    let draft: AiEvaluationDraft = JSON.parse(JSON.stringify(outcome.draft));
    if (chosenCountry && !sameCountry(draft.priorityCountry, chosenCountry)) {
      warnings.push({ field: "Pays prioritaire", message: `L’IA proposait « ${draft.priorityCountry} » ; le pays choisi par le candidat (« ${chosenCountry} ») a été conservé.` });
      draft = { ...draft, priorityCountry: chosenCountry };
    }
    const alternatives = draft.alternativeCountries.filter((alternative) => !sameCountry(alternative.country, draft.priorityCountry)).slice(0, MAX_ALTERNATIVE_COUNTRIES);
    if (alternatives.length !== draft.alternativeCountries.length) {
      warnings.push({ field: "Pays alternatifs", message: `Alternatives limitées à ${MAX_ALTERNATIVE_COUNTRIES} et débarrassées du pays prioritaire.` });
    }
    draft = { ...draft, alternativeCountries: alternatives };
    for (const finding of auditAiDraftWording(draft)) {
      warnings.push({ field: finding.field, message: `Formulation à revoir avant publication : ${finding.terms.map((term) => `« ${term} »`).join(", ")}.` });
    }

    const seeded = versionFromAiDraft(draft, { evaluationDate });
    const email = defaultNotificationEmail({ candidateName: context.candidateName, priorityCountry: draft.priorityCountry });
    patch = {
      workflowStatus: nextStatus,
      aiDraft: draft,
      aiDraftGeneratedAt: now,
      aiDraftModel: truncate(outcome.model, 80),
      aiDraftWarnings: warnings,
      aiDraftError: null,
      // une version déjà retouchée à la main n'est jamais écrasée par un brouillon IA tardif
      ...(adminEdited ? {} : { adminVersion: { ...seeded, emailSubject: email.subject, emailBody: email.body }, adminVersionUpdatedAt: now, adminVersionUpdatedBy: null }),
    };
    audit = { adminEmail: SYSTEM_ACTOR, action: "structured_ai_draft", note: `${warnings.length} avertissement(s)` };
  }

  // le brouillon initial n'est écrit qu'une fois : si une autre génération l'a devancé, on relit sans rien écraser
  const updated = await deps.store.updateCaseIf(current.id, current.workflowStatus, patch, { audit }, { requireNoAiDraft: true });
  return updated ?? (await requireLatest(deps, evaluationId));
}

// ── Version administrateur ───────────────────────────────────────────────────

/**
 * Enregistre le brouillon de l'administrateur. Chaque champ modifié est historisé (ancienne et
 * nouvelle valeur, auteur, date). Une version modifiée perd sa première validation : une validation
 * vaut pour un contenu précis.
 */
export async function saveAdminVersion(deps: ValidationDeps, admin: Actor, evaluationId: number, input: unknown): Promise<{ case: ValidationCase; changedFields: string[] }> {
  const version = parseVersion(input);
  const current = await ensureCase(deps, evaluationId);
  const nextStatus = nextWorkflowStatus(current.workflowStatus, "save_draft");
  if (!nextStatus) {
    throw new ValidationFlowError("INVALID_STATE", "Cette évaluation est déjà publiée : démarrez une réévaluation pour la modifier.");
  }

  const changes = diffEvaluationVersions(current.adminVersion, version);
  if (changes.length === 0 && nextStatus === current.workflowStatus && current.adminVersion) return { case: current, changedFields: [] };

  const now = deps.now();
  const updated = await deps.store.updateCaseIf(
    current.id,
    current.workflowStatus,
    {
      workflowStatus: nextStatus,
      adminVersion: version,
      adminVersionUpdatedAt: now,
      adminVersionUpdatedBy: admin.email,
      ...(changes.length > 0 ? { firstValidatedBy: null, firstValidatedAt: null } : {}),
    },
    {
      changes: { adminEmail: admin.email, rows: changes.map((change) => ({ field: change.field, oldValue: change.oldValue, newValue: change.newValue })) },
      audit: { adminEmail: admin.email, action: "structured_save_draft", note: `${changes.length} champ(s) modifié(s)` },
    },
    // deux administrateurs qui enregistrent en même temps : le second reçoit un conflit au lieu d'écraser le premier
    { adminVersionStamp: current.adminVersion ? versionStamp(current.adminVersion) : undefined },
  );
  if (!updated) throw conflict();
  return { case: updated, changedFields: changes.map((change) => change.field) };
}

// ── Informations complémentaires ─────────────────────────────────────────────

const InfoRequestInput = z.object({
  message: z.string().trim().max(2000),
  items: z.array(z.string().trim().min(1).max(300)).max(12),
});

export async function requestInformation(deps: ValidationDeps, admin: Actor, evaluationId: number, input: { message: string; items: string[] }): Promise<ValidationCase> {
  const parsed = InfoRequestInput.safeParse(input);
  if (!parsed.success) throw new ValidationFlowError("INVALID_INPUT", "Demande de complément invalide : 12 éléments au maximum, 300 caractères chacun.");
  const { message, items } = parsed.data;
  if (items.length === 0 && !message) throw new ValidationFlowError("INVALID_INPUT", "Indiquez au moins un élément ou un message à transmettre au candidat.");

  // ce texte est lu par le candidat : mêmes règles que le rapport (aucune promesse, aucune donnée sensible)
  assertClientSafeText("Message au candidat", message);
  assertNoSensitiveData("Message au candidat", message);
  items.forEach((label, index) => {
    assertClientSafeText(`Élément demandé ${index + 1}`, label);
    assertNoSensitiveData(`Élément demandé ${index + 1}`, label);
  });

  const current = await ensureCase(deps, evaluationId);
  const nextStatus = nextWorkflowStatus(current.workflowStatus, "request_info");
  if (!nextStatus) throw new ValidationFlowError("INVALID_STATE", "Une demande de complément n’est possible que sur une évaluation en cours de revue.");

  const now = deps.now();
  const infoRequest: InfoRequest = { message, items: items.map((label, index) => ({ id: `q${index + 1}`, label })), requestedAt: now.toISOString(), response: null };
  const updated = await deps.store.updateCaseIf(
    current.id,
    current.workflowStatus,
    { workflowStatus: nextStatus, infoRequest, infoRequestedAt: now, infoRequestedBy: admin.email },
    // la réponse précédente du candidat (remplacée par cette nouvelle demande) reste consultable dans l'audit
    { audit: { adminEmail: admin.email, action: "structured_request_info", note: JSON.stringify({ message, items, previousResponse: current.infoRequest?.response ?? undefined }) } },
  );
  if (!updated) throw conflict();
  return updated;
}

const CandidateReplyInput = z.object({
  answers: z.array(z.object({ id: z.string().trim().min(1).max(20), answer: z.string().trim().max(2000) })).max(12),
  note: z.string().trim().max(2000),
});

/** Réponse du candidat (le routeur a déjà vérifié que le dossier lui appartient). */
export async function submitCandidateReply(deps: ValidationDeps, evaluationId: number, input: { answers: Array<{ id: string; answer: string }>; note: string }): Promise<ValidationCase> {
  const parsed = CandidateReplyInput.safeParse(input);
  if (!parsed.success) throw new ValidationFlowError("INVALID_INPUT", "Réponse invalide : 2 000 caractères maximum par champ.");
  const current = await requireLatest(deps, evaluationId);
  const nextStatus = nextWorkflowStatus(current.workflowStatus, "candidate_replied");
  if (!nextStatus || !current.infoRequest || current.infoRequest.response) {
    throw new ValidationFlowError("INVALID_STATE", "Aucune information complémentaire n’est attendue pour ce dossier.");
  }
  const knownIds = new Set(current.infoRequest.items.map((item) => item.id));
  const answers = parsed.data.answers.filter((entry) => knownIds.has(entry.id) && entry.answer);
  if (answers.length === 0 && !parsed.data.note) throw new ValidationFlowError("INVALID_INPUT", "Renseignez au moins une réponse.");

  const now = deps.now();
  const infoRequest: InfoRequest = { ...current.infoRequest, response: { answers, note: parsed.data.note, respondedAt: now.toISOString() } };
  const updated = await deps.store.updateCaseIf(
    current.id,
    current.workflowStatus,
    { workflowStatus: nextStatus, infoRequest },
    { audit: { adminEmail: CANDIDATE_ACTOR, action: "structured_candidate_replied", note: `${answers.length} réponse(s)` } },
  );
  if (!updated) throw conflict();
  return updated;
}

// ── Publication ──────────────────────────────────────────────────────────────

export type PublishInput = {
  checklist: PublicationChecklist;
  sendEmail: boolean;
  /** Empreinte de la version relue (voir `versionStamp`) : refus si elle a changé depuis. */
  reviewedVersionStamp: string;
};

export type PublishResult =
  | { outcome: "awaiting_second_validation"; case: ValidationCase; firstValidatedBy: string }
  | { outcome: "published"; case: ValidationCase; emailAttempted: boolean; emailSent: boolean; emailError: string | null };

type RenderedEmail = ReturnType<typeof renderNotificationEmail>;

/**
 * Envoie l'e-mail de notification d'une évaluation PUBLIÉE. L'envoi est d'abord RÉSERVÉ (emailClaimedAt, atomique
 * sous verrou) : un second envoi simultané est refusé au lieu de partir en double. La réservation expire d'elle-même
 * (`EMAIL_CLAIM_TTL_MS`) si le processus s'arrête en plein envoi. Aucun échec d'écriture APRÈS la publication ne
 * remonte comme un échec de publication.
 */
async function deliverNotification(
  deps: ValidationDeps,
  published: ValidationCase,
  rendered: RenderedEmail,
  recipient: string,
  actorEmail: string,
  options: { alreadyClaimed: boolean },
): Promise<{ case: ValidationCase; emailSent: boolean; emailError: string | null }> {
  const { store } = deps;
  if (!options.alreadyClaimed) {
    const now = deps.now();
    const claimed = await store.updateCaseIf(published.id, "validee_publiee", { emailClaimedAt: now }, undefined, { emailClaimableSince: new Date(now.getTime() - EMAIL_CLAIM_TTL_MS) });
    if (!claimed) {
      return {
        case: (await store.getLatestCase(published.evaluationId)) ?? published,
        emailSent: false,
        emailError: "Un envoi est déjà en cours pour cette évaluation : patientez quelques minutes avant de réessayer.",
      };
    }
  }

  try {
    await deps.mailer.send({ to: recipient, subject: rendered.subject, text: rendered.text, html: rendered.html });
  } catch (error) {
    const message = truncate((error instanceof Error ? error.message : String(error)) || "Échec de l’envoi de l’e-mail", 300);
    try {
      const updated = await store.updateCaseIf(published.id, "validee_publiee", { emailError: message, emailClaimedAt: null }, { audit: { adminEmail: actorEmail, action: "structured_email_failed", note: message } });
      return { case: updated ?? published, emailSent: false, emailError: message };
    } catch (writeError) {
      console.error("[evaluationValidation] échec d’envoi non enregistré", writeError);
      return { case: published, emailSent: false, emailError: message };
    }
  }
  // L'e-mail est parti : l'état « notifié » n'est écrit qu'à cette condition.
  const notified = nextWorkflowStatus("validee_publiee", "send_notification");
  try {
    const updated = await store.updateCaseIf(
      published.id,
      "validee_publiee",
      { workflowStatus: notified ?? "validee_publiee", emailSentAt: deps.now(), emailError: null, emailSubject: rendered.subject, emailClaimedAt: null },
      { audit: { adminEmail: actorEmail, action: "structured_email_sent" } },
    );
    return { case: updated ?? published, emailSent: true, emailError: null };
  } catch (error) {
    // La réservation reste en place jusqu'à son expiration : elle empêche un renvoi immédiat (donc un doublon).
    console.error("[evaluationValidation] e-mail envoyé mais état non enregistré", error);
    return { case: published, emailSent: true, emailError: null };
  }
}

function renderEmailFor(deps: ValidationDeps, version: AdminEvaluationVersion, recipient: string): RenderedEmail {
  if (!looksDeliverable(recipient)) throw new ValidationFlowError("NO_RECIPIENT", "Le candidat n’a pas d’adresse e-mail exploitable : publiez sans e-mail.");
  if (!version.emailSubject.trim() || !version.emailBody.trim()) throw new ValidationFlowError("INCOMPLETE_VERSION", "L’objet et le corps de l’e-mail sont obligatoires pour l’envoi.");
  return renderNotificationEmail({ subject: version.emailSubject, body: version.emailBody, portalUrl: deps.portalUrl });
}

/**
 * Publie la version administrateur. Ordre garanti : toutes les vérifications (checklist, version relue,
 * formulations interdites, e-mail) AVANT la moindre écriture ; puis publication ; puis, seulement si elle
 * a réussi, envoi de l'e-mail. Un e-mail en échec laisse l'évaluation publiée (renvoi possible).
 */
export async function publishEvaluation(deps: ValidationDeps, admin: Actor, evaluationId: number, input: PublishInput): Promise<PublishResult> {
  const current = await requireLatest(deps, evaluationId);
  const version = current.adminVersion;
  if (!version) throw new ValidationFlowError("INCOMPLETE_VERSION", "Aucune version administrateur à publier : enregistrez d’abord votre version.");
  if (versionStamp(version) !== input.reviewedVersionStamp) {
    throw new ValidationFlowError("STALE_VERSION", "La version a été modifiée depuis votre relecture. Relisez l’aperçu final, puis republiez.");
  }
  if (nextWorkflowStatus(current.workflowStatus, input.sendEmail ? "publish_and_notify" : "publish") === null) {
    throw new ValidationFlowError("INVALID_STATE", `Publication impossible depuis le statut « ${WORKFLOW_STATUS_LABELS[current.workflowStatus]} ».`);
  }
  const missing = missingChecklistItems(input.checklist, { sendEmail: input.sendEmail });
  if (missing.length > 0) throw new ValidationFlowError("CHECKLIST_INCOMPLETE", "Cochez toute la checklist avant de publier.", { missing });
  const incomplete = missingPublishableFields(version);
  if (incomplete.length > 0) throw new ValidationFlowError("INCOMPLETE_VERSION", `Complétez avant de publier : ${incomplete.join(", ")}.`, { missing: incomplete });

  const context = await requireContext(deps.store, evaluationId);
  // Le CV est l'élément clé de la finalisation : sans lui, ni publication ni première validation.
  if (!context.cvOnFile) throw new ValidationFlowError("CV_REQUIRED", `CV manquant : ${CV_MISSING_FOR_PUBLICATION}`);
  const now = deps.now();
  const report = buildReport(version, { candidateName: context.candidateName, validatedAt: isoDate(now) });
  const rendered = input.sendEmail ? renderEmailFor(deps, version, context.candidateEmail) : null;

  // Règle historique du site : un résultat « préparation recommandée » exige deux administrateurs distincts.
  const policy = deps.policy ?? DEFAULT_VALIDATION_POLICY;
  let secondValidatedBy: string | null = null;
  if (policy.requireSecondValidationFor.includes(report.status)) {
    if (!current.firstValidatedBy) {
      const updated = await deps.store.updateCaseIf(
        current.id,
        current.workflowStatus,
        { workflowStatus: nextWorkflowStatus(current.workflowStatus, "save_draft") ?? current.workflowStatus, firstValidatedBy: admin.email, firstValidatedAt: now },
        { audit: { adminEmail: admin.email, action: "structured_first_validation", note: `${report.statusLabel} — seconde validation requise` } },
        { adminVersionStamp: input.reviewedVersionStamp }, // la validation vaut pour le contenu relu, pas pour une version modifiée entre-temps
      );
      if (!updated) throw conflict();
      return { outcome: "awaiting_second_validation", case: updated, firstValidatedBy: admin.email };
    }
    if (sameEmail(current.firstValidatedBy, admin.email)) {
      throw new ValidationFlowError("SECOND_VALIDATION_REQUIRED", "Ce résultat exige la validation d’un second administrateur, différent du premier validateur.");
    }
    secondValidatedBy = admin.email;
  }

  const published = await deps.store.updateCaseIf(
    current.id,
    current.workflowStatus,
    {
      workflowStatus: nextWorkflowStatus(current.workflowStatus, "publish") ?? "validee_publiee",
      publishedReport: report,
      publishedAt: now,
      publishedBy: admin.email,
      publishedChecklist: normalizeChecklist(input.checklist),
      emailSubject: input.sendEmail ? version.emailSubject : null,
      emailSentAt: null,
      emailError: null,
      // l'envoi est réservé DANS la même écriture que la publication : aucun renvoi concurrent ne peut s'intercaler
      emailClaimedAt: input.sendEmail ? now : null,
      firstValidatedBy: current.firstValidatedBy ?? admin.email,
      firstValidatedAt: current.firstValidatedAt ?? now,
    },
    {
      audit: { adminEmail: admin.email, action: input.sendEmail ? "structured_publish_notify" : "structured_publish", note: `Score ${report.score}/${report.scoreMax} — ${report.statusLabel}` },
      legacyPublication: {
        publishedBy: admin.email,
        publishedAt: now,
        reportText: clientReportToPlainText(report),
        secondValidatedBy,
        firstValidatedBy: current.firstValidatedBy ?? admin.email,
        firstValidatedAt: current.firstValidatedAt ?? now,
      },
    },
    { adminVersionStamp: input.reviewedVersionStamp }, // la version publiée est exactement celle qui a été relue
  );
  if (!published) throw conflict();

  if (!rendered) return { outcome: "published", case: published, emailAttempted: false, emailSent: false, emailError: null };
  const delivery = await deliverNotification(deps, published, rendered, context.candidateEmail.trim(), admin.email, { alreadyClaimed: true });
  return { outcome: "published", case: delivery.case, emailAttempted: true, emailSent: delivery.emailSent, emailError: delivery.emailError };
}

/**
 * Envoie (ou renvoie) l'e-mail d'une évaluation publiée dont la notification a échoué ou n'a pas été demandée.
 * L'e-mail doit avoir été relu : soit à la publication (case cochée), soit ici par une confirmation explicite.
 */
export async function resendNotification(
  deps: ValidationDeps,
  admin: Actor,
  evaluationId: number,
  input: { emailReviewed?: boolean } = {},
): Promise<{ case: ValidationCase; emailSent: boolean; emailError: string | null }> {
  const current = await requireLatest(deps, evaluationId);
  if (nextWorkflowStatus(current.workflowStatus, "send_notification") === null || !current.adminVersion || !current.publishedReport) {
    throw new ValidationFlowError("INVALID_STATE", "L’e-mail ne peut être envoyé que pour une évaluation publiée et pas encore notifiée.");
  }
  if (current.publishedChecklist?.emailReviewed !== true && input.emailReviewed !== true) {
    throw new ValidationFlowError("CHECKLIST_INCOMPLETE", "Relisez l’e-mail de notification, puis confirmez-le (« J’ai relu l’email de notification ») avant de l’envoyer.", { missing: ["emailReviewed"] });
  }
  const context = await requireContext(deps.store, evaluationId);
  const rendered = renderEmailFor(deps, current.adminVersion, context.candidateEmail);
  return deliverNotification(deps, current, rendered, context.candidateEmail.trim(), admin.email, { alreadyClaimed: false });
}

// ── Réévaluation ─────────────────────────────────────────────────────────────

/**
 * Ouvre une nouvelle version à partir de la dernière : l'historique et le dernier rapport publié
 * restent intacts, et le candidat continue de voir ce rapport jusqu'à la publication de la suivante.
 */
export async function startReevaluation(deps: ValidationDeps, admin: Actor, evaluationId: number, input: { reason: string }): Promise<ValidationCase> {
  const reason = input.reason.trim();
  if (reason.length < 3 || reason.length > 500) throw new ValidationFlowError("INVALID_INPUT", "Indiquez le motif de la réévaluation (3 à 500 caractères).");
  const current = await requireLatest(deps, evaluationId);
  const nextStatus = nextWorkflowStatus(current.workflowStatus, "start_reevaluation");
  if (!nextStatus || !current.adminVersion) throw new ValidationFlowError("INVALID_STATE", "Seule une évaluation publiée peut être réévaluée.");

  const now = deps.now();
  const created = await deps.store.insertCase(
    {
      evaluationId,
      versionNumber: current.versionNumber + 1,
      workflowStatus: nextStatus,
      aiDraft: current.aiDraft,
      aiDraftGeneratedAt: current.aiDraftGeneratedAt,
      aiDraftModel: current.aiDraftModel,
      aiDraftWarnings: current.aiDraftWarnings,
      adminVersion: { ...current.adminVersion, sendEmail: false },
      adminVersionUpdatedAt: now,
      adminVersionUpdatedBy: admin.email,
    },
    { audit: { adminEmail: admin.email, action: "structured_reevaluation", note: reason } },
  );
  if (!created) throw conflict();
  return created;
}

// ── Vues (administrateur et candidat) ────────────────────────────────────────

const iso = (date: Date | null) => (date ? date.toISOString() : null);

export type AdminValidationView = {
  labels: { aiDraft: string; adminBadge: string; workflow: string };
  evaluation: EvaluationContext;
  case: {
    id: number;
    versionNumber: number;
    workflowStatus: WorkflowStatus;
    aiDraft: AiEvaluationDraft | null;
    aiDraftGeneratedAt: string | null;
    aiDraftModel: string | null;
    aiDraftWarnings: AiDraftWarning[];
    aiDraftError: string | null;
    adminVersion: AdminEvaluationVersion | null;
    versionStamp: string | null;
    adminVersionUpdatedAt: string | null;
    adminVersionUpdatedBy: string | null;
    firstValidatedBy: string | null;
    firstValidatedAt: string | null;
    infoRequest: InfoRequest | null;
    publishedAt: string | null;
    publishedBy: string | null;
    emailSubject: string | null;
    emailSentAt: string | null;
    emailError: string | null;
    /** La relecture de l'e-mail a déjà été confirmée (case cochée à la publication) : le renvoi ne demande rien de plus. */
    emailReviewed: boolean;
  };
  /** Score et statut proposés par l'IA : jamais modifiés après la génération. */
  aiScore: ScoreResolution | null;
  adminScore: ScoreResolution | null;
  /** Aperçu exact de ce que verrait le candidat ; `previewError` explique pourquoi il n'est pas publiable. */
  clientPreview: ClientReport | null;
  previewError: string | null;
  incompleteFields: string[];
  needsSecondValidation: boolean;
  versions: Array<{ versionNumber: number; workflowStatus: WorkflowStatus; publishedAt: string | null; publishedBy: string | null; createdAt: string }>;
  changes: Array<{ versionNumber: number; adminEmail: string; field: string; oldValue: unknown; newValue: unknown; createdAt: string }>;
};

/** Lecture seule : ne crée jamais de dossier (null tant que l'évaluation n'a pas été ouverte dans la validation structurée). */
export async function findAdminView(deps: ValidationDeps, evaluationId: number): Promise<AdminValidationView | null> {
  const context = await requireContext(deps.store, evaluationId);
  const current = await deps.store.getLatestCase(evaluationId);
  return current ? assembleAdminView(deps, context, current) : null;
}

/** Ouvre le dossier au besoin (le crée « DOSSIER REÇU »), puis renvoie la vue. */
export async function buildAdminView(deps: ValidationDeps, evaluationId: number): Promise<AdminValidationView> {
  const context = await requireContext(deps.store, evaluationId);
  const current = await ensureCase(deps, evaluationId);
  return assembleAdminView(deps, context, current);
}

async function assembleAdminView(deps: ValidationDeps, context: EvaluationContext, current: ValidationCase): Promise<AdminValidationView> {
  const evaluationId = current.evaluationId;
  const [cases, changes] = await Promise.all([deps.store.listCases(evaluationId), deps.store.listChanges(evaluationId)]);
  const version = current.adminVersion;

  let clientPreview: ClientReport | null = null;
  let previewError: string | null = null;
  if (version) {
    try {
      clientPreview = buildClientReport(version, { candidateName: context.candidateName, validatedAt: isoDate(deps.now()) });
    } catch (error) {
      previewError = error instanceof Error ? error.message : "Aperçu indisponible.";
    }
  }
  const policy = deps.policy ?? DEFAULT_VALIDATION_POLICY;
  const adminScore = version ? resolveScore({ scores: version.scores, totalOverride: version.totalOverride, finalStatus: version.finalStatus }) : null;

  return {
    labels: { aiDraft: AI_DRAFT_LABEL, adminBadge: ADMIN_DRAFT_BADGE, workflow: WORKFLOW_STATUS_LABELS[current.workflowStatus] },
    evaluation: context,
    case: {
      id: current.id,
      versionNumber: current.versionNumber,
      workflowStatus: current.workflowStatus,
      aiDraft: current.aiDraft,
      aiDraftGeneratedAt: iso(current.aiDraftGeneratedAt),
      aiDraftModel: current.aiDraftModel,
      aiDraftWarnings: current.aiDraftWarnings,
      aiDraftError: current.aiDraftError,
      adminVersion: version,
      versionStamp: version ? versionStamp(version) : null,
      adminVersionUpdatedAt: iso(current.adminVersionUpdatedAt),
      adminVersionUpdatedBy: current.adminVersionUpdatedBy,
      firstValidatedBy: current.firstValidatedBy,
      firstValidatedAt: iso(current.firstValidatedAt),
      infoRequest: current.infoRequest,
      publishedAt: iso(current.publishedAt),
      publishedBy: current.publishedBy,
      emailSubject: current.emailSubject,
      emailSentAt: iso(current.emailSentAt),
      emailError: current.emailError,
      emailReviewed: current.publishedChecklist?.emailReviewed === true,
    },
    aiScore: current.aiDraft ? resolveScore({ scores: current.aiDraft.scores }) : null,
    adminScore,
    clientPreview,
    previewError,
    incompleteFields: version ? missingPublishableFields(version) : ["Version administrateur"],
    needsSecondValidation: adminScore ? policy.requireSecondValidationFor.includes(adminScore.effectiveStatus) : false,
    versions: cases.map((entry) => ({ versionNumber: entry.versionNumber, workflowStatus: entry.workflowStatus, publishedAt: iso(entry.publishedAt), publishedBy: entry.publishedBy, createdAt: entry.createdAt.toISOString() })),
    changes: changes.map((change) => ({ versionNumber: change.versionNumber, adminEmail: change.adminEmail, field: change.field, oldValue: change.oldValue, newValue: change.newValue, createdAt: change.createdAt.toISOString() })),
  };
}

export type CandidateEvaluationView = {
  stage: "not_started" | "pending" | "info_requested" | "published";
  pendingNotice: { title: string; body: string } | null;
  infoRequest: { message: string; items: InfoRequestItem[] } | null;
  report: ClientReport | null;
  publishedAt: string | null;
  /** État du CV : sans lui l'évaluation ne peut pas être finalisée ; le lien du fichier n'est jamais renvoyé. */
  cv: CandidateCv;
};

/**
 * Dépôt (ou remplacement) du CV par le candidat. Refusé une fois l'évaluation publiée : le CV validé fait
 * partie du dossier. `upload` n'est appelé qu'après ce contrôle, pour ne pas stocker un fichier refusé.
 */
export async function attachCandidateCv(deps: ValidationDeps, evaluationId: number, cv: { fileName: string; upload: () => Promise<string> }): Promise<CandidateCv> {
  const latest = await deps.store.getLatestCase(evaluationId);
  if (latest && (latest.workflowStatus === "validee_publiee" || latest.workflowStatus === "validee_publiee_notifiee")) {
    throw new ValidationFlowError("INVALID_STATE", "Votre évaluation est déjà validée : le CV ne peut plus être remplacé. Contactez notre équipe si nécessaire.");
  }
  const context = await requireContext(deps.store, evaluationId);
  const url = await cv.upload();
  const attached = await deps.store.attachCv(context.evaluationId, { url, fileName: cv.fileName });
  if (!attached) throw new ValidationFlowError("NOT_FOUND", "Évaluation introuvable.");
  return { onFile: true, fileName: cv.fileName };
}

/**
 * Ce que le candidat a le droit de voir. Construit champ par champ (jamais par copie d'objet) :
 * ni brouillon IA, ni score initial, ni version administrateur non publiée, ni commentaire interne,
 * ni identité de l'administrateur n'en font partie.
 */
export function buildCandidateView(input: { latest: ValidationCase | null; latestPublished: ValidationCase | null; cv: CandidateCv }): CandidateEvaluationView {
  const { latest, latestPublished } = input;
  const cv: CandidateCv = { onFile: input.cv.onFile === true, fileName: input.cv.onFile === true ? (input.cv.fileName ?? null) : null };
  if (!latest) return { stage: "not_started", pendingNotice: null, infoRequest: null, report: null, publishedAt: null, cv };

  const visibility = candidateVisibility(latest.workflowStatus, latestPublished?.publishedReport != null);
  const report = visibility.showFinalReport ? (latestPublished?.publishedReport ?? null) : null;
  const request = visibility.showInfoRequests && latest.infoRequest && !latest.infoRequest.response ? latest.infoRequest : null;

  const stage: CandidateEvaluationView["stage"] = request ? "info_requested" : report ? "published" : "pending";
  return {
    stage,
    pendingNotice: report ? null : { title: CANDIDATE_PENDING_NOTICE.title, body: CANDIDATE_PENDING_NOTICE.body },
    infoRequest: request ? { message: request.message, items: request.items.map((item) => ({ id: item.id, label: item.label })) } : null,
    report,
    publishedAt: report ? iso(latestPublished?.publishedAt ?? null) : null,
    cv,
  };
}
