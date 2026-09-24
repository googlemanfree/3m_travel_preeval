import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";
import { ClientTextViolationError, PUBLICATION_CHECKLIST, SensitiveDataError, blankAdminVersion } from "../shared/evaluationValidation";
import { publicProcedure } from "./_core/trpc";
import { createEvaluationValidationRouter, toTrpcError, type ValidationRouterPorts } from "./routers/evaluationValidation";
import { ValidationFlowError, type ValidationDeps } from "./services/evaluationValidationCore";
import { CANDIDATE_CONTEXT, FakeMailer, GOOD_SCORES, InMemoryValidationStore, missingTablesError } from "./services/evaluationValidationTestkit";
import type { EvaluationRowForDraft } from "./services/structuredEvaluationDraft";

const ADMINS: Record<string, string> = { "token-a": "admin.a@3m.test", "token-b": "admin.b@3m.test" };
const FULL_CHECKLIST = Object.fromEntries(PUBLICATION_CHECKLIST.map((item) => [item.key, true]));
const NOW = new Date("2026-09-21T09:00:00.000Z");

const CONSENT = JSON.stringify({ preparatoryAnalysisConsent: true });

const evaluationRow = (overrides: Partial<EvaluationRowForDraft> = {}): EvaluationRowForDraft => ({
  id: 1,
  projectDetailsJson: CONSENT,
  ...overrides,
  fullName: "Aïcha Nkolo",
  nationality: "Camerounaise",
  dateOfBirth: "1993-04-12",
  destinationCountry: "Canada",
  destinationCategory: "canada",
  visaType: "canada_travail",
  projectType: "travail",
  currentJobTitle: "Infirmière",
  yearsOfExperience: "6",
});

const modelOutput = (overrides: Record<string, unknown> = {}) => ({
  gaps: { blocking: [{ label: "Équivalence de diplôme requise", detail: "" }], reinforceable: [{ label: "SECRET-IA-A_VERIFIER", detail: "" }], nonBlocking: [{ label: "SECRET-IA-A_VERIFIER", detail: "" }] },
  route: "D",
  alternativeCountries: [{ country: "Belgique", rationale: "Reconnaissance plus rapide à vérifier" }],
  scores: GOOD_SCORES,
  strengths: ["Six ans d’expérience déclarée"],
  improvements: ["Passer un test de langue officiel"],
  targetJobs: ["Infirmière autorisée"],
  targetSectors: ["Santé"],
  riskLevel: "modere",
  profileSummary: "Profil d’infirmière visant le Canada.",
  actionPlan: [{ title: "Demander l’équivalence du diplôme", detail: "", horizon: "3 mois" }],
  requiredDocuments: ["Passeport"],
  ...overrides,
});

function setup(options: { missingTables?: boolean; row?: Partial<EvaluationRowForDraft>; withoutCv?: boolean } = {}) {
  const store = new InMemoryValidationStore([options.withoutCv ? { ...CANDIDATE_CONTEXT, cvOnFile: false, cvFileName: null, cvFileUrl: null } : CANDIDATE_CONTEXT], () => NOW);
  const stored: Array<{ evaluationId: number; fileName: string; mimeType: string; size: number }> = [];
  const mailer = new FakeMailer(store.timeline);
  const deps: ValidationDeps = { store, mailer, now: () => NOW, portalUrl: "https://www.3mtravelagency.com/evaluation" };
  const invoke = vi.fn(async () => ({ choices: [{ message: { content: JSON.stringify(modelOutput()) } }] }) as never);
  const resolveDeps = vi.fn(async () => {
    if (options.missingTables) throw missingTablesError();
    return deps;
  });
  const ports: ValidationRouterPorts = {
    resolveDeps,
    async requireAdmin(token) {
      const email = ADMINS[token];
      if (!email) throw new TRPCError({ code: "UNAUTHORIZED", message: "Session invalide" });
      return { email };
    },
    async findOwnEvaluation(candidate) {
      if (candidate.email !== "aicha@example.com") return null;
      const context = await store.loadEvaluationContext(1);
      return { id: 1, referenceCode: "EVAL-0001", cv: { onFile: context!.cvOnFile, fileName: context!.cvFileName } };
    },
    async ownsEvaluation(candidate, id) {
      return candidate.email === "aicha@example.com" && id === 1;
    },
    async storeCv(file) {
      stored.push({ evaluationId: file.evaluationId, fileName: file.fileName, mimeType: file.mimeType, size: file.bytes.length });
      return `https://files.example.com/cv-uploads/${file.evaluationId}_${file.fileName}`;
    },
    aiRun: { loadRow: async () => evaluationRow(options.row), generator: { invoke } },
  };
  const candidateAs = (identity: { id: number; email: string }) => publicProcedure.use(({ next }) => next({ ctx: { candidate: identity } as never })) as never;
  const build = (identity = { id: 7, email: "aicha@example.com" }) => createEvaluationValidationRouter(ports, candidateAs(identity)).createCaller({} as never);
  return { store, mailer, deps, invoke, resolveDeps, ports, stored, caller: build(), build };
}
type Setup = ReturnType<typeof setup>;

const admin = (token = "token-a", id = 1) => ({ sessionToken: token, evaluationId: id });

async function openedCase(s: Setup) {
  return s.caller.generateAiDraft(admin());
}

async function publishArgs(s: Setup, overrides: Record<string, unknown> = {}) {
  const { view } = await s.caller.getCase(admin());
  return { ...admin(), checklist: FULL_CHECKLIST, sendEmail: false, reviewedVersionStamp: view!.case.versionStamp!, ...overrides };
}

describe("accès administrateur", () => {
  it("refuse toute procédure administrateur sans session valide, sans toucher à la base", async () => {
    const s = setup();
    const bad = admin("token-inconnu");
    const version = (await openedCase(s)).case.adminVersion!;
    const calls: Array<[string, () => Promise<unknown>]> = [
      ["getCase", () => s.caller.getCase(bad)],
      ["listStatuses", () => s.caller.listStatuses({ sessionToken: "x", evaluationIds: [1] })],
      ["openCase", () => s.caller.openCase(bad)],
      ["generateAiDraft", () => s.caller.generateAiDraft(bad)],
      ["saveDraft", () => s.caller.saveDraft({ ...bad, version })],
      ["requestInfo", () => s.caller.requestInfo({ ...bad, message: "m", items: ["Diplôme"] })],
      ["publish", () => s.caller.publish({ ...bad, checklist: FULL_CHECKLIST, sendEmail: false, reviewedVersionStamp: "12345678" })],
      ["resendEmail", () => s.caller.resendEmail(bad)],
      ["startReevaluation", () => s.caller.startReevaluation({ ...bad, reason: "Motif valable" })],
    ];
    const before = s.resolveDeps.mock.calls.length;
    for (const [name, call] of calls) await expect(call(), name).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(s.resolveDeps.mock.calls.length).toBe(before);
    expect(s.mailer.sent).toHaveLength(0);
  });
});

describe("brouillon IA et version administrateur", () => {
  it("génère le brouillon une seule fois (le modèle n'est pas rappelé) et l'expose comme brouillon interne", async () => {
    const s = setup();
    const first = await openedCase(s);
    expect(first.case.workflowStatus).toBe("attente_validation_admin");
    expect(first.case.aiDraft?.priorityCountry).toBe("Canada");
    expect(first.labels.aiDraft).toBe("BROUILLON IA — VALIDATION ADMINISTRATEUR REQUISE");
    expect(s.invoke).toHaveBeenCalledTimes(1);
    await s.caller.generateAiDraft(admin());
    expect(s.invoke).toHaveBeenCalledTimes(1);
    expect(s.mailer.sent).toHaveLength(0);
  });

  it("n'appelle pas le modèle sans le consentement du candidat et le dit à l'administrateur, qui peut saisir à la main", async () => {
    const s = setup({ row: { projectDetailsJson: JSON.stringify({ preparatoryAnalysisConsent: false }) } });
    await expect(s.caller.generateAiDraft(admin())).rejects.toMatchObject({ code: "CONFLICT", message: expect.stringContaining("n’a pas autorisé l’analyse IA") });
    expect(s.invoke).not.toHaveBeenCalled();
    const view = (await s.caller.getCase(admin())).view!;
    expect(view.case).toMatchObject({ workflowStatus: "dossier_recu", aiDraft: null, aiDraftError: null });
    const blank = blankAdminVersion({ priorityCountry: "Canada", candidateName: "Aïcha Nkolo", evaluationDate: "2026-09-21" });
    const saved = await s.caller.saveDraft({ ...admin(), version: { ...blank, profileSummary: "Saisie manuelle.", route: "D" } });
    expect(saved.view.case.workflowStatus).toBe("en_revue_admin");
  });

  it("lit sans jamais créer de dossier, puis l'ouvre explicitement (ancienne évaluation) pour permettre la saisie manuelle", async () => {
    const s = setup();
    expect(await s.caller.getCase(admin())).toEqual({ view: null });
    expect(await s.caller.getCase(admin())).toEqual({ view: null });
    expect(s.store.cases).toHaveLength(0); // consulter une évaluation ne modifie rien (le candidat garde sa vue actuelle)
    const opened = await s.caller.openCase(admin("token-b"));
    expect(opened.view.case).toMatchObject({ workflowStatus: "dossier_recu", aiDraft: null });
    expect(opened.view.incompleteFields).toContain("Version administrateur");
    expect(s.invoke).not.toHaveBeenCalled();
    expect(s.store.cases).toHaveLength(1);
    await s.caller.openCase(admin());
    expect(s.store.cases).toHaveLength(1);
    expect((await s.caller.getCase(admin())).view?.case.workflowStatus).toBe("dossier_recu");
  });

  it("enregistre la version, historise les champs modifiés avec l'administrateur et renvoie la vue à jour", async () => {
    const s = setup();
    const version = (await openedCase(s)).case.adminVersion!;
    const result = await s.caller.saveDraft({ ...admin("token-b"), version: { ...version, profileSummary: "Résumé retouché.", internalComment: "À suivre." } });
    expect(result.changedFields.sort()).toEqual(["internalComment", "profileSummary"]);
    expect(result.view.case.workflowStatus).toBe("en_revue_admin");
    expect(result.view.changes.filter((change) => change.adminEmail === "admin.b@3m.test").map((change) => change.field).sort()).toEqual(["internalComment", "profileSummary"]);
  });

  it("valide la version reçue : une note hors limites est rejetée avant tout enregistrement", async () => {
    const s = setup();
    const version = (await openedCase(s)).case.adminVersion!;
    await expect(s.caller.saveDraft({ ...admin(), version: { ...version, scores: { ...version.scores, identity: 11 } } })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect((await s.caller.getCase(admin())).view!.case.workflowStatus).toBe("attente_validation_admin");
  });
});

describe("publication via le routeur", () => {
  it("refuse une checklist incomplète et une version relue périmée", async () => {
    const s = setup();
    await openedCase(s);
    await expect(s.caller.publish(await publishArgs(s, { checklist: { coherence: true } }))).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringContaining("checklist") });
    const reviewed = await publishArgs(s);
    const version = (await s.caller.getCase(admin())).view!.case.adminVersion!;
    await s.caller.saveDraft({ ...admin("token-b"), version: { ...version, clientRemarks: "Ajout d'un collègue." } });
    await expect(s.caller.publish(reviewed)).rejects.toMatchObject({ code: "CONFLICT", message: expect.stringContaining("modifiée") });
    expect(s.mailer.sent).toHaveLength(0);
  });

  it("publie sans e-mail, puis publie et notifie : l'e-mail n'est envoyé qu'après la publication", async () => {
    const s = setup();
    await openedCase(s);
    const done = await s.caller.publish(await publishArgs(s, { checklist: { ...FULL_CHECKLIST, emailReviewed: false } }));
    expect(done).toMatchObject({ outcome: "published", emailAttempted: false, emailSent: false });
    expect(done.view.labels.workflow).toBe("ÉVALUATION VALIDÉE ET PUBLIÉE");
    expect(s.mailer.sent).toHaveLength(0);

    await expect(s.caller.resendEmail(admin("token-b"))).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringContaining("Relisez l’e-mail") });
    expect(s.mailer.sent).toHaveLength(0);
    const late = await s.caller.resendEmail({ ...admin("token-b"), emailReviewed: true });
    expect(late.emailSent).toBe(true);
    expect(late.view.labels.workflow).toBe("ÉVALUATION VALIDÉE, PUBLIÉE ET NOTIFIÉE");
    expect(s.mailer.sent).toHaveLength(1);
    expect(s.mailer.sent[0].to).toBe("aicha@example.com");
  });

  it("garde l'évaluation publiée quand l'e-mail échoue, et permet de le renvoyer", async () => {
    const s = setup();
    await openedCase(s);
    s.mailer.failWith(new Error("SMTP indisponible"));
    const result = await s.caller.publish(await publishArgs(s, { sendEmail: true }));
    expect(result).toMatchObject({ outcome: "published", emailAttempted: true, emailSent: false, emailError: "SMTP indisponible" });
    expect(result.view.labels.workflow).toBe("ÉVALUATION VALIDÉE ET PUBLIÉE");
    s.mailer.failWith(null);
    expect((await s.caller.resendEmail(admin())).emailSent).toBe(true);
  });

  it("traduit une formulation interdite et une donnée sensible en erreur lisible, sans rien publier", async () => {
    const s = setup();
    const version = (await openedCase(s)).case.adminVersion!;
    await s.caller.saveDraft({ ...admin(), version: { ...version, clientRemarks: "Votre visa est garanti." } });
    await expect(s.caller.publish(await publishArgs(s))).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringContaining("garanti") });
    const clean = (await s.caller.getCase(admin())).view!.case.adminVersion!;
    await s.caller.saveDraft({ ...admin(), version: { ...clean, clientRemarks: "", emailBody: "Bonjour,\n\nVotre numéro de passeport est bien reçu.\n\n[LIEN_PORTAIL_CLIENT]" } });
    await expect(s.caller.publish(await publishArgs(s, { sendEmail: true }))).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringContaining("sensible") });
    expect((await s.caller.getCase(admin())).view!.case.publishedAt).toBeNull();
    expect(s.mailer.sent).toHaveLength(0);
  });

  it("exige deux administrateurs pour un résultat « préparation recommandée »", async () => {
    const s = setup();
    const version = (await openedCase(s)).case.adminVersion!;
    await s.caller.saveDraft({ ...admin("token-a"), version: { ...version, totalOverride: 40 } });
    const first = await s.caller.publish(await publishArgs(s));
    expect(first).toMatchObject({ outcome: "awaiting_second_validation", firstValidatedBy: "admin.a@3m.test" });
    await expect(s.caller.publish(await publishArgs(s))).rejects.toMatchObject({ code: "FORBIDDEN" });
    const second = await s.caller.publish(await publishArgs(s, { sessionToken: "token-b" }));
    expect(second.outcome).toBe("published");
  });

  it("gère la réévaluation et les statuts affichés dans le tableau de bord", async () => {
    const s = setup();
    await openedCase(s);
    const listed = await s.caller.listStatuses({ sessionToken: "token-a", evaluationIds: [1, 2] });
    expect(listed).toEqual([{ evaluationId: 1, status: "attente_validation_admin", label: "EN ATTENTE DE VALIDATION ADMINISTRATEUR", versionNumber: 1, updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/) }]);
    await s.caller.publish(await publishArgs(s));
    const view = (await s.caller.startReevaluation({ ...admin("token-b"), reason: "Nouveau diplôme reçu" })).view;
    expect(view.case).toMatchObject({ versionNumber: 2, workflowStatus: "en_revue_admin" });
    expect(view.versions).toHaveLength(2);
  });

  it("indique clairement que la migration manque, et laisse le tableau de bord vide au lieu d'échouer", async () => {
    const s = setup({ missingTables: true });
    await expect(s.caller.getCase(admin())).rejects.toMatchObject({ code: "PRECONDITION_FAILED", message: expect.stringContaining("0072") });
    expect(await s.caller.listStatuses({ sessionToken: "token-a", evaluationIds: [1] })).toEqual([]);
  });
});

describe("côté candidat", () => {
  const SECRETS = ["SECRET-IA-A_VERIFIER", "SECRET-INTERNE-42", "SECRET-EMAIL-7", "admin.a@3m.test", "admin.b@3m.test", "aiDraft", "adminVersion", "internalComment", "versionStamp", "firstValidatedBy"];
  const expectNoLeak = (value: unknown) => {
    const serialized = JSON.stringify(value);
    for (const secret of SECRETS) expect(serialized, secret).not.toContain(secret);
  };

  it("ne voit rien de particulier tant qu'aucune évaluation n'existe", async () => {
    const s = setup();
    const stranger = s.build({ id: 9, email: "autre@example.com" });
    expect(await stranger.myEvaluation()).toMatchObject({ available: true, evaluationId: null, view: { stage: "not_started", report: null } });
  });

  it("ne voit que l'avis d'attente à chaque étape précédant la publication, et jamais le brouillon", async () => {
    const s = setup();
    const version = (await openedCase(s)).case.adminVersion!;
    const pending = await s.caller.myEvaluation();
    expect(pending).toMatchObject({ available: true, evaluationId: 1, referenceCode: "EVAL-0001", view: { stage: "pending", report: null, infoRequest: null } });
    expect(pending.view.pendingNotice?.title).toBe("Dossier reçu avec succès.");
    expectNoLeak(pending);

    await s.caller.saveDraft({ ...admin(), version: { ...version, internalComment: "SECRET-INTERNE-42", emailBody: "Bonjour,\n\nSECRET-EMAIL-7\n\n[LIEN_PORTAIL_CLIENT]", totalOverride: 61 } });
    const reviewing = await s.caller.myEvaluation();
    expect(reviewing.view.stage).toBe("pending");
    expectNoLeak(reviewing);
    expect(JSON.stringify(reviewing)).not.toContain("61");
  });

  it("voit la demande de complément et y répond ; le dossier repart en attente de validation", async () => {
    const s = setup();
    await openedCase(s);
    await s.caller.requestInfo({ ...admin(), message: "Merci de compléter votre dossier.", items: ["Relevé de notes"] });
    const requested = await s.caller.myEvaluation();
    expect(requested.view).toMatchObject({ stage: "info_requested", report: null, infoRequest: { message: "Merci de compléter votre dossier.", items: [{ id: "q1", label: "Relevé de notes" }] } });
    expectNoLeak(requested);

    const replied = await s.caller.respondToInfoRequest({ evaluationId: 1, answers: [{ id: "q1", answer: "Envoyé" }], note: "Merci" });
    expect(replied.view.stage).toBe("pending");
    expect((await s.caller.getCase(admin())).view!.case.workflowStatus).toBe("attente_validation_admin");
    await expect(s.caller.respondToInfoRequest({ evaluationId: 1, answers: [{ id: "q1", answer: "Encore" }], note: "" })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("ne peut pas répondre pour l'évaluation d'un autre candidat", async () => {
    const s = setup();
    await openedCase(s);
    await s.caller.requestInfo({ ...admin(), message: "", items: ["Diplôme"] });
    const stranger = s.build({ id: 9, email: "autre@example.com" });
    await expect(stranger.respondToInfoRequest({ evaluationId: 1, answers: [{ id: "q1", answer: "Intrusion" }], note: "" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await s.caller.getCase(admin())).view!.case.infoRequest?.response).toBeNull();
  });

  it("voit le rapport validé (score de l'administrateur) sans brouillon, score initial, commentaire interne ni identité d'administrateur", async () => {
    const s = setup();
    const version = (await openedCase(s)).case.adminVersion!;
    await s.caller.saveDraft({ ...admin("token-b"), version: { ...version, internalComment: "SECRET-INTERNE-42", emailBody: "Bonjour,\n\nSECRET-EMAIL-7\n\n[LIEN_PORTAIL_CLIENT]", scores: { ...version.scores, experience: 10 } } });
    await s.caller.publish(await publishArgs(s, { sendEmail: true, sessionToken: "token-a" }));
    const mine = await s.caller.myEvaluation();
    expect(mine.view.stage).toBe("published");
    expect(mine.view.report).toMatchObject({ priorityCountry: "Canada", score: 69, scoreMax: 100 });
    expect(mine.view.pendingNotice).toBeNull();
    expectNoLeak(mine);
    expect(JSON.stringify(mine)).not.toContain('"score":74');
  });

  it("retombe sur l'ancien parcours (available: false) quand la migration n'est pas appliquée", async () => {
    const s = setup({ missingTables: true });
    expect(await s.caller.myEvaluation()).toMatchObject({ available: false, evaluationId: 1, view: { stage: "not_started" } });
  });
});

const PDF_BASE64 = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n").toString("base64");
const PNG_BASE64 = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from("données")]).toString("base64");

describe("CV : élément clé de la finalisation", () => {
  it("refuse la publication tant que le CV n'est pas au dossier, sans rien publier ni envoyer", async () => {
    const s = setup({ withoutCv: true });
    await openedCase(s);
    await expect(s.caller.publish(await publishArgs(s, { sendEmail: true }))).rejects.toMatchObject({ code: "PRECONDITION_FAILED", message: expect.stringContaining("CV manquant") });
    const { view } = await s.caller.getCase(admin());
    expect(view!.case.workflowStatus).toBe("attente_validation_admin"); // rien n'a changé : le brouillon attend toujours la validation
    expect(view!.evaluation).toMatchObject({ cvOnFile: false, cvFileName: null, cvFileUrl: null });
    expect(s.mailer.sent).toHaveLength(0);
    expect(s.store.legacyPublications).toHaveLength(0);
  });

  it("autorise la publication une fois le CV déposé par le candidat", async () => {
    const s = setup({ withoutCv: true });
    await openedCase(s);
    await s.caller.attachCv({ evaluationId: 1, fileName: "cv-aicha.pdf", base64: PDF_BASE64 });
    const { view } = await s.caller.getCase(admin());
    expect(view!.evaluation).toMatchObject({ cvOnFile: true, cvFileName: "cv-aicha.pdf", cvFileUrl: "https://files.example.com/cv-uploads/1_cv-aicha.pdf" });
    const result = await s.caller.publish(await publishArgs(s));
    expect(result.outcome).toBe("published");
  });

  it("indique au candidat si son CV est au dossier, sans jamais lui renvoyer le lien du fichier", async () => {
    const without = setup({ withoutCv: true });
    await openedCase(without);
    const missing = await without.caller.myEvaluation();
    expect(missing.view.cv).toEqual({ onFile: false, fileName: null });
    const present = setup();
    await openedCase(present);
    const view = (await present.caller.myEvaluation()).view;
    expect(view.cv).toEqual({ onFile: true, fileName: "cv-aicha-nkolo.pdf" });
    expect(JSON.stringify(view)).not.toContain("files.example.com");
  });

  it("enregistre un PDF ou un PNG valide, avec un nom de fichier nettoyé, et met à jour la vue du candidat", async () => {
    const s = setup({ withoutCv: true });
    await openedCase(s);
    expect(await s.caller.attachCv({ evaluationId: 1, fileName: "../../mon CV (final).pdf", base64: `data:application/pdf;base64,${PDF_BASE64}` })).toEqual({ cv: { onFile: true, fileName: "mon_CV__final_.pdf" } });
    expect(s.stored).toEqual([{ evaluationId: 1, fileName: "mon_CV__final_.pdf", mimeType: "application/pdf", size: Buffer.from(PDF_BASE64, "base64").length }]);
    await s.caller.attachCv({ evaluationId: 1, fileName: "scan.png", base64: PNG_BASE64 });
    expect(s.stored.at(-1)).toMatchObject({ fileName: "scan.png", mimeType: "image/png" });
    expect((await s.caller.myEvaluation()).view.cv).toEqual({ onFile: true, fileName: "scan.png" }); // remplacement possible tant que rien n'est publié
  });

  it("refuse un fichier dont le contenu n'est pas un PDF, un JPEG ou un PNG, même si le nom dit le contraire", async () => {
    const s = setup({ withoutCv: true });
    await openedCase(s);
    const script = Buffer.from("<script>alert(1)</script>").toString("base64");
    await expect(s.caller.attachCv({ evaluationId: 1, fileName: "cv.pdf", base64: script })).rejects.toMatchObject({ code: "BAD_REQUEST", message: "Le CV doit être au format PDF, JPG ou PNG." });
    await expect(s.caller.attachCv({ evaluationId: 1, fileName: "cv.pdf", base64: "!!! pas du base64 !!!" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(s.stored).toHaveLength(0);
    expect((await s.store.loadEvaluationContext(1))!.cvOnFile).toBe(false);
  });

  it("refuse un fichier trop lourd sans le stocker", async () => {
    const s = setup({ withoutCv: true });
    await openedCase(s);
    const tooBig = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(5 * 1024 * 1024)]).toString("base64");
    await expect(s.caller.attachCv({ evaluationId: 1, fileName: "gros.pdf", base64: tooBig })).rejects.toMatchObject({ code: "BAD_REQUEST", message: "Le CV ne doit pas dépasser 5 Mo." });
    expect(s.stored).toHaveLength(0);
  });

  it("n'accepte le dépôt que pour l'évaluation du candidat connecté", async () => {
    const s = setup({ withoutCv: true });
    await openedCase(s);
    const stranger = s.build({ id: 99, email: "autre@example.com" });
    await expect(stranger.attachCv({ evaluationId: 1, fileName: "cv.pdf", base64: PDF_BASE64 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(s.caller.attachCv({ evaluationId: 2, fileName: "cv.pdf", base64: PDF_BASE64 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(s.stored).toHaveLength(0);
  });

  it("ne remplace plus le CV d'une évaluation déjà publiée, et ne stocke alors aucun fichier", async () => {
    const s = setup();
    await openedCase(s);
    await s.caller.publish(await publishArgs(s));
    await expect(s.caller.attachCv({ evaluationId: 1, fileName: "nouveau.pdf", base64: PDF_BASE64 })).rejects.toMatchObject({ code: "CONFLICT", message: expect.stringContaining("déjà validée") });
    expect(s.stored).toHaveLength(0);
    expect((await s.store.loadEvaluationContext(1))!.cvFileName).toBe("cv-aicha-nkolo.pdf");
  });
});

describe("traduction des erreurs", () => {
  it.each([
    ["NOT_FOUND", "NOT_FOUND"],
    ["INVALID_STATE", "CONFLICT"],
    ["STALE_VERSION", "CONFLICT"],
    ["CONFLICT", "CONFLICT"],
    ["INVALID_INPUT", "BAD_REQUEST"],
    ["CHECKLIST_INCOMPLETE", "BAD_REQUEST"],
    ["INCOMPLETE_VERSION", "BAD_REQUEST"],
    ["NO_RECIPIENT", "BAD_REQUEST"],
    ["CV_REQUIRED", "PRECONDITION_FAILED"],
    ["SECOND_VALIDATION_REQUIRED", "FORBIDDEN"],
  ] as const)("%s devient %s", (flow, trpc) => {
    const error = toTrpcError(new ValidationFlowError(flow, "Message lisible"));
    expect(error).toMatchObject({ code: trpc, message: "Message lisible" });
  });

  it("reconnaît les violations de contenu, laisse passer les erreurs tRPC et ignore les autres", () => {
    expect(toTrpcError(new ClientTextViolationError("Résumé", ["garanti"]))?.code).toBe("BAD_REQUEST");
    expect(toTrpcError(new SensitiveDataError("E-mail", ["numéro de passeport"]))?.code).toBe("BAD_REQUEST");
    const existing = new TRPCError({ code: "UNAUTHORIZED", message: "x" });
    expect(toTrpcError(existing)).toBe(existing);
    expect(toTrpcError(new Error("panne réseau"))).toBeNull();
  });
});
