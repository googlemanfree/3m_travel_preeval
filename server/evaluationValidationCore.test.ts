import { describe, expect, it } from "vitest";
import {
  ClientTextViolationError,
  LEGAL_DISCLAIMER,
  NOTIFICATION_EMAIL_SUBJECT,
  PUBLICATION_CHECKLIST,
  SensitiveDataError,
  type AdminEvaluationVersion,
  type AiEvaluationDraft,
} from "../shared/evaluationValidation";
import {
  SYSTEM_ACTOR,
  ValidationFlowError,
  buildAdminView,
  buildCandidateView,
  ensureCase,
  findAdminView,
  publishEvaluation,
  recordAiDraft,
  requestInformation,
  resendNotification,
  saveAdminVersion,
  startReevaluation,
  submitCandidateReply,
  versionStamp,
  type EvaluationContext,
  type ValidationDeps,
  type ValidationPolicy,
} from "./services/evaluationValidationCore";
import { CANDIDATE_CONTEXT, FakeMailer, InMemoryValidationStore, GOOD_SCORES, sampleAiDraft } from "./services/evaluationValidationTestkit";

const ADMIN_A = { email: "admin.a@3m.test" };
const ADMIN_B = { email: "admin.b@3m.test" };
const PORTAL_URL = "https://www.3mtravelagency.com/mon-espace";
const FULL_CHECKLIST = Object.fromEntries(PUBLICATION_CHECKLIST.map((item) => [item.key, true]));

function setup(options: { context?: Partial<EvaluationContext>; policy?: ValidationPolicy } = {}) {
  let clockMs = Date.parse("2026-09-21T09:00:00.000Z");
  const now = () => new Date(clockMs);
  const store = new InMemoryValidationStore([{ ...CANDIDATE_CONTEXT, ...options.context }], now);
  const mailer = new FakeMailer(store.timeline);
  const deps: ValidationDeps = { store, mailer, now, portalUrl: PORTAL_URL, policy: options.policy };
  return { store, mailer, deps, tick: (ms: number) => { clockMs += ms; } };
}
type Setup = ReturnType<typeof setup>;

async function openWithDraft(s: Setup, draft: AiEvaluationDraft = sampleAiDraft()) {
  return recordAiDraft(s.deps, 1, { ok: true, draft, model: "gemini-test" });
}

async function latest(s: Setup) {
  const found = await s.store.getLatestCase(1);
  if (!found) throw new Error("aucune version");
  return found;
}

async function edit(s: Setup, admin: { email: string }, patch: Partial<AdminEvaluationVersion>) {
  const current = await latest(s);
  return saveAdminVersion(s.deps, admin, 1, { ...current.adminVersion!, ...patch });
}

async function publishInput(s: Setup, overrides: Partial<{ checklist: Record<string, boolean>; sendEmail: boolean; reviewedVersionStamp: string }> = {}) {
  const current = await latest(s);
  return { checklist: FULL_CHECKLIST, sendEmail: false, reviewedVersionStamp: versionStamp(current.adminVersion!), ...overrides };
}

const candidateView = async (s: Setup) => buildCandidateView({ latest: await s.store.getLatestCase(1), latestPublished: await s.store.getLatestPublishedCase(1) });

describe("ouverture du dossier et brouillon IA", () => {
  it("crée une seule version « DOSSIER REÇU », de façon idempotente", async () => {
    const s = setup();
    const first = await ensureCase(s.deps, 1);
    const second = await ensureCase(s.deps, 1);
    expect(first.workflowStatus).toBe("dossier_recu");
    expect(second.id).toBe(first.id);
    expect(s.store.cases).toHaveLength(1);
    await expect(ensureCase(s.deps, 999)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("range la sortie de l'IA en brouillon interne : statut « en attente de validation », version administrateur copiée", async () => {
    const s = setup();
    const record = await openWithDraft(s);
    expect(record.workflowStatus).toBe("attente_validation_admin");
    expect(record.aiDraft?.scores).toEqual(GOOD_SCORES);
    expect(record.aiDraftModel).toBe("gemini-test");
    expect(record.adminVersion?.priorityCountry).toBe("Canada");
    expect(record.adminVersion?.emailSubject).toBe(NOTIFICATION_EMAIL_SUBJECT);
    expect(record.adminVersion?.emailBody).toContain("Bonjour Aïcha Nkolo");
    expect(record.adminVersion?.sendEmail).toBe(false);
    expect(record.adminVersionUpdatedBy).toBeNull();
    expect(record.publishedReport).toBeNull();
    expect(s.store.audit.at(-1)).toMatchObject({ action: "structured_ai_draft", adminEmail: SYSTEM_ACTOR });
    expect(s.mailer.sent).toHaveLength(0);
  });

  it("garde toujours le pays choisi par le candidat comme pays prioritaire, et le signale", async () => {
    const s = setup();
    const record = await openWithDraft(s, sampleAiDraft({ priorityCountry: "Belgique", alternativeCountries: [{ country: "canada", rationale: "x" }, { country: "France", rationale: "y" }] }));
    expect(record.aiDraft?.priorityCountry).toBe("Canada");
    expect(record.adminVersion?.priorityCountry).toBe("Canada");
    expect(record.aiDraft?.alternativeCountries.map((alternative) => alternative.country)).toEqual(["France"]);
    expect(record.aiDraftWarnings.map((warning) => warning.field)).toEqual(expect.arrayContaining(["Pays prioritaire", "Pays alternatifs"]));
  });

  it("limite les pays alternatifs à trois", async () => {
    const s = setup();
    const many = ["Belgique", "France", "Allemagne", "Irlande", "Suisse"].map((country) => ({ country, rationale: "raison" }));
    const record = await openWithDraft(s, sampleAiDraft({ alternativeCountries: many }));
    expect(record.aiDraft?.alternativeCountries).toHaveLength(3);
    expect(record.adminVersion?.alternatives).toHaveLength(3);
  });

  it("signale une formulation interdite dans le brouillon sans la retirer en silence", async () => {
    const s = setup();
    const record = await openWithDraft(s, sampleAiDraft({ profileSummary: "Votre visa est garanti au Canada." }));
    expect(record.aiDraftWarnings.some((warning) => warning.field === "Résumé du profil" && warning.message.includes("garanti"))).toBe(true);
    expect(record.adminVersion?.profileSummary).toBe("Votre visa est garanti au Canada.");
  });

  it("n'écrit le brouillon IA qu'une seule fois : le score initial ne change plus", async () => {
    const s = setup();
    await openWithDraft(s);
    const again = await openWithDraft(s, sampleAiDraft({ scores: { ...GOOD_SCORES, experience: 0 } }));
    expect(again.aiDraft?.scores.experience).toBe(15);
    expect(s.store.audit.filter((event) => event.action === "structured_ai_draft")).toHaveLength(1);
  });

  it("si l'IA échoue, ouvre une version vierge que l'administrateur peut remplir, sans rien inventer", async () => {
    const s = setup();
    const record = await recordAiDraft(s.deps, 1, { ok: false, error: "Quota Gemini dépassé" });
    expect(record.workflowStatus).toBe("attente_validation_admin");
    expect(record.aiDraft).toBeNull();
    expect(record.aiDraftError).toBe("Quota Gemini dépassé");
    expect(record.adminVersion).toMatchObject({ priorityCountry: "Canada", route: null, profileSummary: "" });
    expect(record.adminVersion?.scores).toEqual({ identity: 0, qualification: 0, languages: 0, experience: 0, employability: 0, finances: 0, documents: 0, coherence: 0 });
  });

  it("un brouillon IA obtenu après un échec remplace la version vierge, mais jamais une version retouchée", async () => {
    const s = setup();
    await recordAiDraft(s.deps, 1, { ok: false, error: "indisponible" });
    const recovered = await openWithDraft(s);
    expect(recovered.aiDraftError).toBeNull();
    expect(recovered.adminVersion?.profileSummary).toContain("infirmière");

    const t = setup();
    await recordAiDraft(t.deps, 1, { ok: false, error: "indisponible" });
    await edit(t, ADMIN_A, { profileSummary: "Résumé rédigé par Aurélie." });
    await requestInformation(t.deps, ADMIN_A, 1, { message: "", items: ["Relevé de notes"] });
    await submitCandidateReply(t.deps, 1, { answers: [{ id: "q1", answer: "Ci-joint" }], note: "" });
    expect((await latest(t)).workflowStatus).toBe("attente_validation_admin");
    const late = await openWithDraft(t);
    expect(late.aiDraft).not.toBeNull();
    expect(late.adminVersion?.profileSummary).toBe("Résumé rédigé par Aurélie.");
  });

  it("ignore un brouillon IA tardif quand l'administrateur a déjà commencé la revue", async () => {
    const s = setup();
    await recordAiDraft(s.deps, 1, { ok: false, error: "indisponible" });
    await edit(s, ADMIN_A, { profileSummary: "Saisie manuelle." });
    const late = await openWithDraft(s);
    expect(late.aiDraft).toBeNull();
    expect(late.workflowStatus).toBe("en_revue_admin");
  });
});

describe("version administrateur et historique des modifications", () => {
  it("historise chaque champ modifié (ancienne et nouvelle valeur, auteur, date) et passe en revue administrateur", async () => {
    const s = setup();
    await openWithDraft(s);
    s.tick(60_000);
    const result = await edit(s, ADMIN_A, { profileSummary: "Nouveau résumé.", scores: { ...GOOD_SCORES, experience: 10 } });
    expect(result.case.workflowStatus).toBe("en_revue_admin");
    expect(result.changedFields.sort()).toEqual(["profileSummary", "scores.experience"]);
    const summary = s.store.changes.find((change) => change.field === "profileSummary");
    expect(summary).toMatchObject({ adminEmail: ADMIN_A.email, oldValue: "Profil d’infirmière confirmée visant le Canada.", newValue: "Nouveau résumé.", versionNumber: 1 });
    expect(s.store.changes.find((change) => change.field === "scores.experience")).toMatchObject({ oldValue: 15, newValue: 10 });
    expect(result.case.adminVersionUpdatedBy).toBe(ADMIN_A.email);
    expect(s.store.audit.at(-1)).toMatchObject({ action: "structured_save_draft", adminEmail: ADMIN_A.email });
  });

  it("n'écrit rien quand rien n'a changé", async () => {
    const s = setup();
    await openWithDraft(s);
    await edit(s, ADMIN_A, { profileSummary: "Un résumé." });
    const writes = s.store.timeline.length;
    const again = await edit(s, ADMIN_A, { profileSummary: "Un résumé." });
    expect(again.changedFields).toEqual([]);
    expect(s.store.timeline).toHaveLength(writes);
  });

  it("rejette une version invalide sans rien écrire", async () => {
    const s = setup();
    await openWithDraft(s);
    const writes = s.store.timeline.length;
    const current = await latest(s);
    await expect(saveAdminVersion(s.deps, ADMIN_A, 1, { ...current.adminVersion!, scores: { ...GOOD_SCORES, identity: 11 } })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(saveAdminVersion(s.deps, ADMIN_A, 1, { nimportequoi: true })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    expect(s.store.timeline).toHaveLength(writes);
  });

  it("fixe à la main le score global sans jamais le remplacer, et garde le score IA initial", async () => {
    const s = setup();
    await openWithDraft(s);
    await edit(s, ADMIN_A, { totalOverride: 88, scores: { ...GOOD_SCORES, experience: 5 } });
    const view = await buildAdminView(s.deps, 1);
    expect(view.adminScore).toMatchObject({ effectiveTotal: 88, hasManualTotal: true, computedTotal: 64 });
    expect(view.aiScore).toMatchObject({ effectiveTotal: 74, hasManualTotal: false });
    expect(view.case.aiDraft?.scores.experience).toBe(15);
  });

  it("refuse de modifier une évaluation déjà publiée (il faut une réévaluation)", async () => {
    const s = setup();
    await openWithDraft(s);
    await publishEvaluation(s.deps, ADMIN_A, 1, await publishInput(s));
    await expect(edit(s, ADMIN_A, { profileSummary: "Retouche après publication." })).rejects.toMatchObject({ code: "INVALID_STATE" });
  });

  it("invalide la première validation dès que le contenu change", async () => {
    const s = setup();
    await openWithDraft(s);
    await edit(s, ADMIN_A, { totalOverride: 40 });
    const first = await publishEvaluation(s.deps, ADMIN_A, 1, await publishInput(s));
    expect(first.outcome).toBe("awaiting_second_validation");
    expect((await latest(s)).firstValidatedBy).toBe(ADMIN_A.email);
    await edit(s, ADMIN_B, { clientRemarks: "Précision ajoutée." });
    expect((await latest(s)).firstValidatedBy).toBeNull();
  });

  it("calcule une empreinte stable, sensible à tout changement de contenu", async () => {
    const s = setup();
    const record = await openWithDraft(s);
    const version = record.adminVersion!;
    const reordered = Object.fromEntries(Object.entries(version).reverse()) as AdminEvaluationVersion;
    expect(versionStamp(reordered)).toBe(versionStamp(version));
    expect(versionStamp({ ...version, clientRemarks: "x" })).not.toBe(versionStamp(version));
  });
});

describe("demande d'informations complémentaires", () => {
  it("place le dossier en « informations complémentaires requises » et le candidat ne voit que la demande", async () => {
    const s = setup();
    await openWithDraft(s);
    const record = await requestInformation(s.deps, ADMIN_A, 1, { message: "Merci de compléter votre dossier.", items: ["Relevé de notes", "Attestation de travail"] });
    expect(record.workflowStatus).toBe("informations_complementaires");
    expect(record.infoRequest?.items).toEqual([{ id: "q1", label: "Relevé de notes" }, { id: "q2", label: "Attestation de travail" }]);
    const view = await candidateView(s);
    expect(view.stage).toBe("info_requested");
    expect(view.infoRequest).toEqual({ message: "Merci de compléter votre dossier.", items: record.infoRequest!.items });
    expect(view.report).toBeNull();
    expect(JSON.stringify(view)).not.toContain(ADMIN_A.email);
    expect(s.store.audit.at(-1)).toMatchObject({ action: "structured_request_info", adminEmail: ADMIN_A.email });
    expect(s.mailer.sent).toHaveLength(0);
  });

  it("refuse toute promesse et toute donnée sensible dans ce que lira le candidat", async () => {
    const s = setup();
    await openWithDraft(s);
    await expect(requestInformation(s.deps, ADMIN_A, 1, { message: "Votre visa est garanti.", items: ["Diplôme"] })).rejects.toBeInstanceOf(ClientTextViolationError);
    await expect(requestInformation(s.deps, ADMIN_A, 1, { message: "", items: ["Envoyez votre numéro de passeport par retour"] })).rejects.toBeInstanceOf(SensitiveDataError);
    expect((await latest(s)).workflowStatus).toBe("attente_validation_admin");
  });

  it("exige un élément ou un message, et n'est possible ni une seconde fois ni après publication", async () => {
    const s = setup();
    await openWithDraft(s);
    await expect(requestInformation(s.deps, ADMIN_A, 1, { message: "", items: [] })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await requestInformation(s.deps, ADMIN_A, 1, { message: "", items: ["Diplôme"] });
    await expect(requestInformation(s.deps, ADMIN_A, 1, { message: "", items: ["Autre"] })).rejects.toMatchObject({ code: "INVALID_STATE" });

    const t = setup();
    await openWithDraft(t);
    await publishEvaluation(t.deps, ADMIN_A, 1, await publishInput(t));
    await expect(requestInformation(t.deps, ADMIN_A, 1, { message: "", items: ["Diplôme"] })).rejects.toMatchObject({ code: "INVALID_STATE" });
  });

  it("empêche de publier tant que la demande est ouverte", async () => {
    const s = setup();
    await openWithDraft(s);
    const input = await publishInput(s);
    await requestInformation(s.deps, ADMIN_A, 1, { message: "", items: ["Diplôme"] });
    await expect(publishEvaluation(s.deps, ADMIN_A, 1, input)).rejects.toMatchObject({ code: "INVALID_STATE" });
  });

  it("remet le dossier « en attente de validation » quand le candidat répond, et ne l'accepte qu'une fois", async () => {
    const s = setup();
    await openWithDraft(s);
    await requestInformation(s.deps, ADMIN_A, 1, { message: "", items: ["Diplôme"] });
    await expect(submitCandidateReply(s.deps, 1, { answers: [{ id: "q9", answer: "inconnu" }], note: "" })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    const replied = await submitCandidateReply(s.deps, 1, { answers: [{ id: "q1", answer: "Envoyé par la messagerie du dossier" }, { id: "q9", answer: "ignoré" }], note: "Merci" });
    expect(replied.workflowStatus).toBe("attente_validation_admin");
    expect(replied.infoRequest?.response?.answers).toEqual([{ id: "q1", answer: "Envoyé par la messagerie du dossier" }]);
    expect(s.store.audit.at(-1)).toMatchObject({ action: "structured_candidate_replied", adminEmail: "candidat" });
    await expect(submitCandidateReply(s.deps, 1, { answers: [{ id: "q1", answer: "encore" }], note: "" })).rejects.toMatchObject({ code: "INVALID_STATE" });
    expect((await candidateView(s)).stage).toBe("pending");
  });

  it("refuse une réponse sans demande en cours", async () => {
    const s = setup();
    await openWithDraft(s);
    await expect(submitCandidateReply(s.deps, 1, { answers: [], note: "Bonjour" })).rejects.toMatchObject({ code: "INVALID_STATE" });
  });
});

describe("publication : vérifications avant toute écriture", () => {
  it("exige toute la checklist (la relecture de l'e-mail seulement si l'envoi est choisi)", async () => {
    const s = setup();
    await openWithDraft(s);
    const writes = s.store.timeline.length;
    const partial = { ...FULL_CHECKLIST, clientPreview: false, finalScore: false };
    await expect(publishEvaluation(s.deps, ADMIN_A, 1, await publishInput(s, { checklist: partial }))).rejects.toMatchObject({ code: "CHECKLIST_INCOMPLETE", details: { missing: ["finalScore", "clientPreview"] } });
    await expect(publishEvaluation(s.deps, ADMIN_A, 1, await publishInput(s, { checklist: {} }))).rejects.toMatchObject({ code: "CHECKLIST_INCOMPLETE" });

    const withoutEmailReview = { ...FULL_CHECKLIST, emailReviewed: false };
    await expect(publishEvaluation(s.deps, ADMIN_A, 1, await publishInput(s, { checklist: withoutEmailReview, sendEmail: true }))).rejects.toMatchObject({ code: "CHECKLIST_INCOMPLETE", details: { missing: ["emailReviewed"] } });
    expect(s.store.timeline).toHaveLength(writes);
    expect(s.mailer.sent).toHaveLength(0);
    // sans e-mail, la relecture de l'e-mail n'est pas exigée
    const ok = await publishEvaluation(s.deps, ADMIN_A, 1, await publishInput(s, { checklist: withoutEmailReview, sendEmail: false }));
    expect(ok.outcome).toBe("published");
  });

  it("refuse de publier une version modifiée depuis la relecture", async () => {
    const s = setup();
    await openWithDraft(s);
    const reviewed = await publishInput(s);
    await edit(s, ADMIN_B, { clientRemarks: "Ajout d'un autre administrateur." });
    await expect(publishEvaluation(s.deps, ADMIN_A, 1, reviewed)).rejects.toMatchObject({ code: "STALE_VERSION" });
    expect((await latest(s)).publishedReport).toBeNull();
  });

  it("refuse de publier une version sans résumé ni voie principale", async () => {
    const s = setup();
    await recordAiDraft(s.deps, 1, { ok: false, error: "indisponible" });
    await expect(publishEvaluation(s.deps, ADMIN_A, 1, await publishInput(s))).rejects.toMatchObject({ code: "INCOMPLETE_VERSION", details: { missing: ["Résumé du profil", "Voie principale recommandée"] } });
    expect((await latest(s)).publishedReport).toBeNull();
  });

  it("refuse une formulation interdite, sans rien publier ni envoyer", async () => {
    const s = setup();
    await openWithDraft(s);
    await edit(s, ADMIN_A, { strengths: ["Emploi assuré au Canada"] });
    const writes = s.store.timeline.length;
    await expect(publishEvaluation(s.deps, ADMIN_A, 1, await publishInput(s, { sendEmail: true }))).rejects.toBeInstanceOf(ClientTextViolationError);
    expect(s.store.timeline).toHaveLength(writes);
    expect(s.mailer.sent).toHaveLength(0);
    expect((await latest(s)).workflowStatus).toBe("en_revue_admin");
  });

  it("refuse un e-mail contenant une donnée sensible, sans rien publier", async () => {
    const s = setup();
    await openWithDraft(s);
    await edit(s, ADMIN_A, { emailBody: "Bonjour,\n\nVotre numéro de passeport est bien enregistré.\n\n[LIEN_PORTAIL_CLIENT]" });
    await expect(publishEvaluation(s.deps, ADMIN_A, 1, await publishInput(s, { sendEmail: true }))).rejects.toBeInstanceOf(SensitiveDataError);
    expect((await latest(s)).publishedReport).toBeNull();
    expect(s.mailer.sent).toHaveLength(0);
  });

  it("refuse l'envoi sans adresse exploitable, mais permet de publier sans e-mail", async () => {
    const s = setup({ context: { candidateEmail: "pas-une-adresse" } });
    await openWithDraft(s);
    await expect(publishEvaluation(s.deps, ADMIN_A, 1, await publishInput(s, { sendEmail: true }))).rejects.toMatchObject({ code: "NO_RECIPIENT" });
    expect((await latest(s)).publishedReport).toBeNull();
    const ok = await publishEvaluation(s.deps, ADMIN_A, 1, await publishInput(s, { sendEmail: false }));
    expect(ok.outcome).toBe("published");
  });

  it("refuse un objet ou un corps d'e-mail vides quand l'envoi est demandé", async () => {
    const s = setup();
    await openWithDraft(s);
    await edit(s, ADMIN_A, { emailSubject: "", emailBody: "" });
    await expect(publishEvaluation(s.deps, ADMIN_A, 1, await publishInput(s, { sendEmail: true }))).rejects.toMatchObject({ code: "INCOMPLETE_VERSION" });
  });
});

describe("publication : ordre, e-mail et concurrence", () => {
  it("publie sans e-mail : rapport visible du candidat, aucun envoi, miroir hérité renseigné", async () => {
    const s = setup();
    await openWithDraft(s);
    const result = await publishEvaluation(s.deps, ADMIN_A, 1, await publishInput(s));
    expect(result).toMatchObject({ outcome: "published", emailAttempted: false, emailSent: false });
    const record = await latest(s);
    expect(record).toMatchObject({ workflowStatus: "validee_publiee", publishedBy: ADMIN_A.email, firstValidatedBy: ADMIN_A.email });
    expect(record.publishedChecklist).toMatchObject({ coherence: true, emailReviewed: true });
    expect(s.mailer.sent).toHaveLength(0);
    expect(s.store.audit.at(-1)).toMatchObject({ action: "structured_publish", adminEmail: ADMIN_A.email });
    expect(s.store.legacyPublications).toHaveLength(1);
    expect(s.store.legacyPublications[0]).toMatchObject({ evaluationId: 1, publishedBy: ADMIN_A.email, secondValidatedBy: null });
    expect(s.store.legacyPublications[0].reportText).toContain("pays prioritaire : Canada");
    expect((await candidateView(s)).stage).toBe("published");
  });

  it("publie D'ABORD, envoie l'e-mail ENSUITE, et n'écrit « notifié » qu'après l'envoi", async () => {
    const s = setup();
    await openWithDraft(s);
    const before = s.store.timeline.length;
    const result = await publishEvaluation(s.deps, ADMIN_A, 1, await publishInput(s, { sendEmail: true }));
    expect(result).toMatchObject({ outcome: "published", emailAttempted: true, emailSent: true, emailError: null });
    expect(s.store.timeline.slice(before)).toEqual(["store:update:validee_publiee", "mail:send", "store:update:validee_publiee_notifiee"]);
    const record = await latest(s);
    expect(record).toMatchObject({ workflowStatus: "validee_publiee_notifiee", emailError: null });
    expect(record.emailSentAt).not.toBeNull();
    expect(s.mailer.sent).toHaveLength(1);
    const mail = s.mailer.sent[0];
    expect(mail).toMatchObject({ to: "aicha@example.com", subject: NOTIFICATION_EMAIL_SUBJECT });
    expect(mail.text).toContain(PORTAL_URL);
    expect(mail.text).not.toContain("[LIEN_PORTAIL_CLIENT]");
    expect(mail.text).not.toContain("[BOUTON");
    expect(mail.text).toContain("Direction de la Mobilité Internationale");
    expect(mail.html).toContain(`href="${PORTAL_URL}"`);
  });

  it("un e-mail en échec ne dépublie pas : l'évaluation reste publiée, l'erreur est tracée, le renvoi est possible", async () => {
    const s = setup();
    await openWithDraft(s);
    s.mailer.failWith(new Error("SMTP indisponible"));
    const result = await publishEvaluation(s.deps, ADMIN_A, 1, await publishInput(s, { sendEmail: true }));
    expect(result).toMatchObject({ outcome: "published", emailAttempted: true, emailSent: false, emailError: "SMTP indisponible" });
    const record = await latest(s);
    expect(record).toMatchObject({ workflowStatus: "validee_publiee", emailError: "SMTP indisponible", emailSentAt: null });
    expect((await candidateView(s)).stage).toBe("published");
    expect(s.store.audit.at(-1)).toMatchObject({ action: "structured_email_failed" });

    s.mailer.failWith(null);
    const retry = await resendNotification(s.deps, ADMIN_B, 1);
    expect(retry).toMatchObject({ emailSent: true, emailError: null });
    expect((await latest(s)).workflowStatus).toBe("validee_publiee_notifiee");
    expect(s.mailer.sent).toHaveLength(1);
    await expect(resendNotification(s.deps, ADMIN_B, 1)).rejects.toMatchObject({ code: "INVALID_STATE" });
    expect(s.mailer.sent).toHaveLength(1);
  });

  it("permet d'envoyer plus tard l'e-mail d'une évaluation publiée sans e-mail, mais jamais d'un dossier non publié", async () => {
    const s = setup();
    await openWithDraft(s);
    await expect(resendNotification(s.deps, ADMIN_A, 1)).rejects.toMatchObject({ code: "INVALID_STATE" });
    // publication sans e-mail : l'élément « e-mail relu » n'est pas présenté, donc pas coché
    await publishEvaluation(s.deps, ADMIN_A, 1, await publishInput(s, { checklist: { ...FULL_CHECKLIST, emailReviewed: false } }));
    // publiée sans e-mail : la case « e-mail relu » n'a pas été cochée, l'envoi tardif exige donc une confirmation explicite
    await expect(resendNotification(s.deps, ADMIN_A, 1)).rejects.toMatchObject({ code: "CHECKLIST_INCOMPLETE", details: { missing: ["emailReviewed"] } });
    await expect(resendNotification(s.deps, ADMIN_A, 1, { emailReviewed: false })).rejects.toMatchObject({ code: "CHECKLIST_INCOMPLETE" });
    expect(s.mailer.sent).toHaveLength(0);
    const sent = await resendNotification(s.deps, ADMIN_A, 1, { emailReviewed: true });
    expect(sent.emailSent).toBe(true);
    expect(s.mailer.sent).toHaveLength(1);
  });

  it("empêche la double publication : la seconde tentative n'envoie rien", async () => {
    const s = setup();
    await openWithDraft(s);
    const input = await publishInput(s, { sendEmail: true });
    await publishEvaluation(s.deps, ADMIN_A, 1, input);
    await expect(publishEvaluation(s.deps, ADMIN_B, 1, input)).rejects.toMatchObject({ code: "INVALID_STATE" });
    expect(s.mailer.sent).toHaveLength(1);
    expect(s.store.legacyPublications).toHaveLength(1);
  });

  it("si un autre administrateur écrit entre la lecture et la publication, échoue en conflit sans rien envoyer", async () => {
    const s = setup();
    await openWithDraft(s);
    const input = await publishInput(s, { sendEmail: true });
    const current = await latest(s);
    s.store.interceptNextUpdate(async () => {
      await s.store.updateCaseIf(current.id, "attente_validation_admin", { workflowStatus: "informations_complementaires" });
    });
    await expect(publishEvaluation(s.deps, ADMIN_A, 1, input)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(s.mailer.sent).toHaveLength(0);
    expect((await latest(s)).publishedReport).toBeNull();
    expect(s.store.legacyPublications).toHaveLength(0);
  });
});

describe("seconde validation d'un résultat « préparation recommandée »", () => {
  const lowScore = { totalOverride: 40 } as const;

  it("exige deux administrateurs distincts, et le premier ne voit rien publié", async () => {
    const s = setup();
    await openWithDraft(s);
    await edit(s, ADMIN_A, lowScore);
    const first = await publishEvaluation(s.deps, ADMIN_A, 1, await publishInput(s, { sendEmail: true }));
    expect(first).toMatchObject({ outcome: "awaiting_second_validation", firstValidatedBy: ADMIN_A.email });
    expect((await latest(s)).workflowStatus).toBe("en_revue_admin");
    expect((await candidateView(s)).report).toBeNull();
    expect(s.mailer.sent).toHaveLength(0);
    expect(s.store.legacyPublications).toHaveLength(0);

    await expect(publishEvaluation(s.deps, { email: "ADMIN.A@3m.test" }, 1, await publishInput(s, { sendEmail: true }))).rejects.toMatchObject({ code: "SECOND_VALIDATION_REQUIRED" });
    expect(s.mailer.sent).toHaveLength(0);

    const second = await publishEvaluation(s.deps, ADMIN_B, 1, await publishInput(s, { sendEmail: true }));
    expect(second).toMatchObject({ outcome: "published", emailSent: true });
    expect((await latest(s)).publishedBy).toBe(ADMIN_B.email);
    expect(s.store.legacyPublications[0]).toMatchObject({ publishedBy: ADMIN_B.email, secondValidatedBy: ADMIN_B.email });
  });

  it("ne s'applique pas aux résultats plus favorables, ni quand la politique le désactive", async () => {
    const s = setup();
    await openWithDraft(s);
    expect((await publishEvaluation(s.deps, ADMIN_A, 1, await publishInput(s))).outcome).toBe("published");

    const t = setup({ policy: { requireSecondValidationFor: [] } });
    await openWithDraft(t);
    await edit(t, ADMIN_A, lowScore);
    expect((await publishEvaluation(t.deps, ADMIN_A, 1, await publishInput(t))).outcome).toBe("published");
  });

  it("annonce à l'administrateur qu'une seconde validation sera nécessaire", async () => {
    const s = setup();
    await openWithDraft(s);
    expect((await buildAdminView(s.deps, 1)).needsSecondValidation).toBe(false);
    await edit(s, ADMIN_A, lowScore);
    expect((await buildAdminView(s.deps, 1)).needsSecondValidation).toBe(true);
  });
});

describe("réévaluation", () => {
  it("ouvre une nouvelle version sans toucher à l'historique, et le candidat garde le dernier rapport publié", async () => {
    const s = setup();
    await openWithDraft(s);
    await edit(s, ADMIN_A, { internalComment: "SECRET-INTERNE-42" });
    await publishEvaluation(s.deps, ADMIN_A, 1, await publishInput(s));
    const publishedV1 = (await latest(s)).publishedReport;
    expect(publishedV1).not.toBeNull();

    const v2 = await startReevaluation(s.deps, ADMIN_B, 1, { reason: "Nouveau test de langue reçu" });
    expect(v2).toMatchObject({ versionNumber: 2, workflowStatus: "en_revue_admin", publishedReport: null });
    expect(v2.adminVersion?.sendEmail).toBe(false);
    expect(v2.aiDraft?.scores).toEqual(GOOD_SCORES);
    expect(s.store.audit.at(-1)).toMatchObject({ action: "structured_reevaluation", note: "Nouveau test de langue reçu" });

    await edit(s, ADMIN_B, { profileSummary: "Résumé de la version 2, pas encore validée.", totalOverride: 90 });
    const during = await candidateView(s);
    expect(during.stage).toBe("published");
    expect(during.report).toEqual(publishedV1);
    expect(JSON.stringify(during)).not.toContain("version 2");

    await publishEvaluation(s.deps, ADMIN_B, 1, await publishInput(s));
    const after = await candidateView(s);
    expect(after.report?.profileSummary).toBe("Résumé de la version 2, pas encore validée.");
    expect(after.report?.score).toBe(90);
    const versions = await s.store.listCases(1);
    expect(versions.map((entry) => [entry.versionNumber, entry.workflowStatus])).toEqual([[1, "validee_publiee"], [2, "validee_publiee"]]);
    expect(versions[0].publishedReport).toEqual(publishedV1);
    expect(s.store.changes.some((change) => change.versionNumber === 2 && change.field === "totalOverride")).toBe(true);
  });

  it("n'est possible que depuis une évaluation publiée, avec un motif", async () => {
    const s = setup();
    await openWithDraft(s);
    await expect(startReevaluation(s.deps, ADMIN_A, 1, { reason: "Motif valable" })).rejects.toMatchObject({ code: "INVALID_STATE" });
    await publishEvaluation(s.deps, ADMIN_A, 1, await publishInput(s));
    await expect(startReevaluation(s.deps, ADMIN_A, 1, { reason: "  " })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await startReevaluation(s.deps, ADMIN_A, 1, { reason: "Motif valable" });
    await expect(startReevaluation(s.deps, ADMIN_A, 1, { reason: "Encore un motif" })).rejects.toMatchObject({ code: "INVALID_STATE" });
  });

  it("gère deux réévaluations simultanées : une seule version est créée", async () => {
    const s = setup();
    await openWithDraft(s);
    await publishEvaluation(s.deps, ADMIN_A, 1, await publishInput(s));
    const results = await Promise.allSettled([startReevaluation(s.deps, ADMIN_A, 1, { reason: "Premier motif" }), startReevaluation(s.deps, ADMIN_B, 1, { reason: "Second motif" })]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(s.store.cases.filter((entry) => entry.versionNumber === 2)).toHaveLength(1);
  });
});

describe("ce que le candidat peut voir", () => {
  const SECRETS = ["SECRET-IA-A_VERIFIER", "SECRET-BUDGET-IA", "SECRET-INTERNE-42", "SECRET-EMAIL-7", ADMIN_A.email, ADMIN_B.email, "aiDraft", "adminVersion", "internalComment", "firstValidatedBy"];
  const leakyDraft = () => sampleAiDraft({ gaps: { blocking: [], reinforceable: [{ label: "SECRET-IA-A_VERIFIER" }], nonBlocking: [{ label: "SECRET-IA-A_VERIFIER" }] }, extracted: { ...sampleAiDraft().extracted, budget: "SECRET-BUDGET-IA" } });

  const expectNoLeak = (value: unknown) => {
    const serialized = JSON.stringify(value);
    for (const secret of SECRETS) expect(serialized, secret).not.toContain(secret);
  };

  it("ne voit que l'avis d'attente à chaque étape précédant la publication, quel que soit le contenu du brouillon", async () => {
    const s = setup();
    expect(await candidateView(s)).toMatchObject({ stage: "not_started", report: null });
    await ensureCase(s.deps, 1);
    let view = await candidateView(s);
    expect(view).toMatchObject({ stage: "pending", report: null, infoRequest: null });
    expect(view.pendingNotice?.title).toBe("Dossier reçu avec succès.");
    expectNoLeak(view);

    await openWithDraft(s, leakyDraft());
    expectNoLeak(await candidateView(s));

    await edit(s, ADMIN_A, { internalComment: "SECRET-INTERNE-42", emailBody: "Bonjour,\n\nSECRET-EMAIL-7\n\n[LIEN_PORTAIL_CLIENT]", totalOverride: 61 });
    view = await candidateView(s);
    expect(view).toMatchObject({ stage: "pending", report: null });
    expectNoLeak(view);
    expect(JSON.stringify(view)).not.toContain("61");
    expect(JSON.stringify(view)).not.toContain("74");

    await requestInformation(s.deps, ADMIN_A, 1, { message: "Merci de compléter.", items: ["Diplôme"] });
    expectNoLeak(await candidateView(s));
  });

  it("voit le rapport validé (score de l'administrateur), sans brouillon IA, score initial, commentaire interne, e-mail ni identité d'administrateur", async () => {
    const s = setup();
    await openWithDraft(s, leakyDraft());
    await edit(s, ADMIN_A, { internalComment: "SECRET-INTERNE-42", emailBody: "Bonjour,\n\nSECRET-EMAIL-7\n\n[LIEN_PORTAIL_CLIENT]", scores: { ...GOOD_SCORES, experience: 10 } });
    await publishEvaluation(s.deps, ADMIN_B, 1, await publishInput(s, { sendEmail: true }));
    const view = await candidateView(s);
    expect(view.stage).toBe("published");
    expect(view.pendingNotice).toBeNull();
    expect(view.report).toMatchObject({ candidateName: "Aïcha Nkolo", priorityCountry: "Canada", score: 69, scoreMax: 100 });
    expect(view.report?.legalDisclaimer).toBe(LEGAL_DISCLAIMER);
    expect(view.publishedAt).not.toBeNull();
    expectNoLeak(view);
    expect(JSON.stringify(view)).not.toContain('"score":74');
  });
});

describe("vue administrateur", () => {
  it("présente brouillon IA, version administrateur et aperçu client, et explique ce qui bloque la publication", async () => {
    const s = setup();
    await openWithDraft(s);
    let view = await buildAdminView(s.deps, 1);
    expect(view.labels.aiDraft).toBe("BROUILLON IA — VALIDATION ADMINISTRATEUR REQUISE");
    expect(view.labels.workflow).toBe("EN ATTENTE DE VALIDATION ADMINISTRATEUR");
    expect(view.case.aiDraft).not.toBeNull();
    expect(view.case.adminVersion).not.toBeNull();
    expect(view.case.versionStamp).toBe(versionStamp(view.case.adminVersion!));
    expect(view.clientPreview?.priorityCountry).toBe("Canada");
    expect(view.previewError).toBeNull();
    expect(view.incompleteFields).toEqual([]);

    await edit(s, ADMIN_A, { profileSummary: "Votre visa est garanti." });
    view = await buildAdminView(s.deps, 1);
    expect(view.clientPreview).toBeNull();
    expect(view.previewError).toContain("garanti");
    expect(view.changes.some((change) => change.field === "profileSummary" && change.adminEmail === ADMIN_A.email)).toBe(true);
    expect(view.versions).toHaveLength(1);
  });

  it("se consulte en lecture seule : aucune ligne n'est créée tant que le dossier n'a pas été ouvert", async () => {
    const s = setup();
    expect(await findAdminView(s.deps, 1)).toBeNull();
    expect(await findAdminView(s.deps, 1)).toBeNull();
    expect(s.store.cases).toHaveLength(0);
    expect(s.store.timeline).toEqual([]);
    await expect(findAdminView(s.deps, 999)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await ensureCase(s.deps, 1);
    expect((await findAdminView(s.deps, 1))?.case.workflowStatus).toBe("dossier_recu");
  });

  it("indique que la version administrateur est incomplète quand l'IA a échoué", async () => {
    const s = setup();
    await recordAiDraft(s.deps, 1, { ok: false, error: "Quota dépassé" });
    const view = await buildAdminView(s.deps, 1);
    expect(view.case.aiDraftError).toBe("Quota dépassé");
    expect(view.aiScore).toBeNull();
    expect(view.incompleteFields).toEqual(["Résumé du profil", "Voie principale recommandée"]);
  });
});

describe("codes d'erreur de l'orchestration", () => {
  it("expose des erreurs typées que le routeur sait traduire", async () => {
    const s = setup();
    await expect(publishEvaluation(s.deps, ADMIN_A, 1, { checklist: {}, sendEmail: false, reviewedVersionStamp: "x" })).rejects.toBeInstanceOf(ValidationFlowError);
    await expect(publishEvaluation(s.deps, ADMIN_A, 1, { checklist: {}, sendEmail: false, reviewedVersionStamp: "x" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
