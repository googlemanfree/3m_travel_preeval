import { describe, expect, it, vi } from "vitest";
import { PUBLICATION_CHECKLIST, type AdminEvaluationVersion } from "../shared/evaluationValidation";
import {
  EMAIL_CLAIM_TTL_MS,
  PLACEHOLDER_COUNTRY,
  publishEvaluation,
  recordAiDraft,
  requestInformation,
  resendNotification,
  saveAdminVersion,
  submitCandidateReply,
  versionStamp,
  type EvaluationContext,
  type ValidationDeps,
} from "./services/evaluationValidationCore";
import { CANDIDATE_CONTEXT, FakeMailer, GOOD_SCORES, InMemoryValidationStore, sampleAiDraft } from "./services/evaluationValidationTestkit";

/**
 * Garanties issues de la revue adversariale : contenu modifié entre la relecture et l'écriture, enregistrements
 * simultanés, génération IA concurrente, un seul e-mail par publication (réservation d'envoi), échecs d'écriture
 * APRÈS la publication, miroir hérité, pays provisoire, réponses du candidat conservées.
 */

const ADMIN_A = { email: "admin.a@3m.test" };
const ADMIN_B = { email: "admin.b@3m.test" };
const FULL = Object.fromEntries(PUBLICATION_CHECKLIST.map((item) => [item.key, true]));

function setup(context: Partial<EvaluationContext> = {}) {
  let clockMs = Date.parse("2026-09-21T09:00:00.000Z");
  const now = () => new Date(clockMs);
  const store = new InMemoryValidationStore([{ ...CANDIDATE_CONTEXT, ...context }], now);
  const mailer = new FakeMailer(store.timeline);
  const deps: ValidationDeps = { store, mailer, now, portalUrl: "https://www.3mtravelagency.com/mon-espace" };
  return { store, mailer, deps, tick: (ms: number) => { clockMs += ms; } };
}
type Setup = ReturnType<typeof setup>;

const latest = async (s: Setup) => (await s.store.getLatestCase(1))!;
const open = (s: Setup, draft = sampleAiDraft()) => recordAiDraft(s.deps, 1, { ok: true, draft, model: "gemini-test" });
const edit = async (s: Setup, admin: { email: string }, patch: Partial<AdminEvaluationVersion>) => saveAdminVersion(s.deps, admin, 1, { ...(await latest(s)).adminVersion!, ...patch });
const publishArgs = async (s: Setup, overrides: Partial<{ checklist: Record<string, boolean>; sendEmail: boolean }> = {}) => ({
  checklist: FULL,
  sendEmail: false,
  reviewedVersionStamp: versionStamp((await latest(s)).adminVersion!),
  ...overrides,
});
const waitForMail = async (s: Setup) => {
  for (let i = 0; i < 100 && !s.store.timeline.includes("mail:send"); i += 1) await new Promise((resolve) => setTimeout(resolve, 0));
};

describe("un contenu modifié entre la relecture et l'écriture n'est jamais publié ni écrasé", () => {
  it("échoue en conflit quand un autre administrateur enregistre entre la lecture et la publication", async () => {
    const s = setup();
    await open(s);
    await edit(s, ADMIN_A, { clientRemarks: "Version 1" }); // statut « en revue » : seule la garde de contenu protège
    const current = await latest(s);
    const input = await publishArgs(s, { sendEmail: true });
    s.store.interceptNextUpdate(async () => {
      await saveAdminVersion(s.deps, ADMIN_B, 1, { ...current.adminVersion!, emailBody: "Bonjour,\n\nTexte modifié par B, jamais relu.\n\n[LIEN_PORTAIL_CLIENT]" });
    });
    await expect(publishEvaluation(s.deps, ADMIN_A, 1, input)).rejects.toMatchObject({ code: "CONFLICT" });
    const after = await latest(s);
    expect(after.publishedReport).toBeNull();
    expect(after.adminVersion?.emailBody).toContain("modifié par B"); // le travail de B est intact
    expect(s.mailer.sent).toHaveLength(0);
    expect(s.store.legacyPublications).toHaveLength(0);
  });

  it("refuse aussi la première validation portant sur un contenu qui a changé", async () => {
    const s = setup();
    await open(s);
    await edit(s, ADMIN_A, { totalOverride: 40 });
    const current = await latest(s);
    const input = await publishArgs(s);
    s.store.interceptNextUpdate(async () => {
      await saveAdminVersion(s.deps, ADMIN_B, 1, { ...current.adminVersion!, clientRemarks: "Ajout de B" });
    });
    await expect(publishEvaluation(s.deps, ADMIN_A, 1, input)).rejects.toMatchObject({ code: "CONFLICT" });
    expect((await latest(s)).firstValidatedBy).toBeNull();
  });

  it("deux enregistrements simultanés : le second reçoit un conflit au lieu d'écraser le premier", async () => {
    const s = setup();
    await open(s);
    await edit(s, ADMIN_A, { clientRemarks: "Base" });
    const current = await latest(s);
    s.store.interceptNextUpdate(async () => {
      await saveAdminVersion(s.deps, ADMIN_B, 1, { ...current.adminVersion!, profileSummary: "Résumé de B" });
    });
    await expect(saveAdminVersion(s.deps, ADMIN_A, 1, { ...current.adminVersion!, profileSummary: "Résumé de A" })).rejects.toMatchObject({ code: "CONFLICT" });
    expect((await latest(s)).adminVersion?.profileSummary).toBe("Résumé de B");
  });

  it("deux générations IA simultanées : la seconde ne réécrit pas le brouillon initial", async () => {
    const s = setup();
    await recordAiDraft(s.deps, 1, { ok: false, error: "indisponible" }); // « en attente », sans brouillon
    const first = sampleAiDraft({ scores: { ...GOOD_SCORES, experience: 5 } });
    const second = sampleAiDraft({ scores: { ...GOOD_SCORES, experience: 15 } });
    s.store.interceptNextUpdate(async () => {
      await recordAiDraft(s.deps, 1, { ok: true, draft: first, model: "concurrent" });
    });
    const result = await recordAiDraft(s.deps, 1, { ok: true, draft: second, model: "tardif" });
    expect(result.aiDraft?.scores.experience).toBe(5);
    expect((await latest(s)).aiDraftModel).toBe("concurrent");
    expect(s.store.audit.filter((event) => event.action === "structured_ai_draft")).toHaveLength(1);
  });
});

describe("un seul e-mail par publication, même en cas de course", () => {
  it("refuse un renvoi pendant que l'envoi de la publication est en cours, puis n'envoie qu'un seul message", async () => {
    const s = setup();
    await open(s);
    const release = s.mailer.hold();
    const publishing = publishEvaluation(s.deps, ADMIN_A, 1, await publishArgs(s, { sendEmail: true }));
    await waitForMail(s);
    expect((await latest(s)).workflowStatus).toBe("validee_publiee"); // publiée d'abord…
    expect((await latest(s)).emailClaimedAt).not.toBeNull(); // …et l'envoi est déjà réservé
    const duplicate = await resendNotification(s.deps, ADMIN_B, 1, { emailReviewed: true });
    expect(duplicate).toMatchObject({ emailSent: false, emailError: expect.stringContaining("déjà en cours") });
    release();
    const result = await publishing;
    expect(result).toMatchObject({ outcome: "published", emailSent: true });
    expect(s.mailer.sent).toHaveLength(1);
    expect(await latest(s)).toMatchObject({ workflowStatus: "validee_publiee_notifiee", emailClaimedAt: null });
  });

  it("refuse deux renvois simultanés, et libère la réservation quand l'envoi échoue", async () => {
    const s = setup();
    await open(s);
    await publishEvaluation(s.deps, ADMIN_A, 1, await publishArgs(s, { checklist: { ...FULL, emailReviewed: false } }));
    const release = s.mailer.hold();
    const first = resendNotification(s.deps, ADMIN_A, 1, { emailReviewed: true });
    await waitForMail(s);
    const second = await resendNotification(s.deps, ADMIN_B, 1, { emailReviewed: true });
    expect(second.emailSent).toBe(false);
    s.mailer.failWith(new Error("SMTP indisponible"));
    release();
    expect(await first).toMatchObject({ emailSent: false, emailError: "SMTP indisponible" });
    expect((await latest(s)).emailClaimedAt).toBeNull(); // libérée : un nouvel essai est possible
    s.mailer.failWith(null);
    expect((await resendNotification(s.deps, ADMIN_B, 1, { emailReviewed: true })).emailSent).toBe(true);
    expect(s.mailer.sent).toHaveLength(1);
  });

  it("la réservation expire d'elle-même (arrêt du processus en plein envoi) et le renvoi redevient possible", async () => {
    const s = setup();
    await open(s);
    await publishEvaluation(s.deps, ADMIN_A, 1, await publishArgs(s, { checklist: { ...FULL, emailReviewed: false } }));
    const current = await latest(s);
    await s.store.updateCaseIf(current.id, "validee_publiee", { emailClaimedAt: new Date("2026-09-21T09:00:00.000Z") });
    s.tick(EMAIL_CLAIM_TTL_MS - 1000);
    expect((await resendNotification(s.deps, ADMIN_A, 1, { emailReviewed: true })).emailSent).toBe(false);
    expect(s.mailer.sent).toHaveLength(0);
    s.tick(2000);
    expect((await resendNotification(s.deps, ADMIN_A, 1, { emailReviewed: true })).emailSent).toBe(true);
    expect(s.mailer.sent).toHaveLength(1);
  });
});

describe("un échec d'écriture APRÈS la publication ne se transforme pas en échec de publication", () => {
  it("échec d'envoi puis échec de l'enregistrement de cet échec : la publication reste réussie", async () => {
    const s = setup();
    await open(s);
    s.mailer.failWith(new Error("SMTP indisponible"));
    const original = s.store.updateCaseIf.bind(s.store);
    let calls = 0;
    s.store.updateCaseIf = async (...args: Parameters<typeof original>) => {
      calls += 1;
      if (calls === 2) throw new Error("verrou perdu"); // l'écriture de l'échec d'envoi
      return original(...args);
    };
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await publishEvaluation(s.deps, ADMIN_A, 1, await publishArgs(s, { sendEmail: true }));
    quiet.mockRestore();
    expect(result).toMatchObject({ outcome: "published", emailAttempted: true, emailSent: false, emailError: "SMTP indisponible" });
    expect((await latest(s)).workflowStatus).toBe("validee_publiee");
  });

  it("e-mail envoyé mais état non enregistré : pas de doublon immédiat", async () => {
    const s = setup();
    await open(s);
    const original = s.store.updateCaseIf.bind(s.store);
    let calls = 0;
    s.store.updateCaseIf = async (...args: Parameters<typeof original>) => {
      calls += 1;
      if (calls === 2) throw new Error("connexion perdue"); // l'écriture « notifié » après un envoi réussi
      return original(...args);
    };
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await publishEvaluation(s.deps, ADMIN_A, 1, await publishArgs(s, { sendEmail: true }));
    quiet.mockRestore();
    expect(result).toMatchObject({ outcome: "published", emailSent: true });
    expect((await latest(s)).workflowStatus).toBe("validee_publiee"); // état non mis à jour…
    const again = await resendNotification(s.deps, ADMIN_B, 1, { emailReviewed: true });
    expect(again.emailSent).toBe(false); // …mais la réservation empêche un second message
    expect(s.mailer.sent).toHaveLength(1);
  });
});

describe("autres garanties", () => {
  it("le miroir hérité distingue le premier validateur du second (deux administrateurs distincts)", async () => {
    const s = setup();
    await open(s);
    await edit(s, ADMIN_A, { totalOverride: 40 });
    await publishEvaluation(s.deps, ADMIN_A, 1, await publishArgs(s)); // première validation
    await publishEvaluation(s.deps, ADMIN_B, 1, await publishArgs(s)); // publication par le second
    expect(s.store.legacyPublications).toHaveLength(1);
    expect(s.store.legacyPublications[0]).toMatchObject({ firstValidatedBy: ADMIN_A.email, secondValidatedBy: ADMIN_B.email, publishedBy: ADMIN_B.email });
  });

  it("refuse de publier le pays provisoire « À confirmer » (aucun pays choisi par le candidat)", async () => {
    const s = setup({ candidateCountry: "" });
    await recordAiDraft(s.deps, 1, { ok: false, error: "indisponible" });
    await edit(s, ADMIN_A, { profileSummary: "Résumé saisi à la main.", route: "D", scores: GOOD_SCORES });
    expect((await latest(s)).adminVersion?.priorityCountry).toBe(PLACEHOLDER_COUNTRY);
    await expect(publishEvaluation(s.deps, ADMIN_A, 1, await publishArgs(s))).rejects.toMatchObject({ code: "INCOMPLETE_VERSION", details: { missing: ["Pays prioritaire"] } });
    await edit(s, ADMIN_A, { priorityCountry: "Belgique" });
    expect((await publishEvaluation(s.deps, ADMIN_A, 1, await publishArgs(s))).outcome).toBe("published");
  });

  it("conserve dans l'audit la réponse précédente du candidat quand une nouvelle demande la remplace", async () => {
    const s = setup();
    await open(s);
    await requestInformation(s.deps, ADMIN_A, 1, { message: "", items: ["Relevé de notes"] });
    await submitCandidateReply(s.deps, 1, { answers: [{ id: "q1", answer: "Voici mon relevé, note 14/20" }], note: "" });
    await requestInformation(s.deps, ADMIN_A, 1, { message: "", items: ["Attestation de travail"] });
    const note = JSON.parse(s.store.audit.filter((event) => event.action === "structured_request_info").at(-1)!.note!);
    expect(note.previousResponse.answers).toEqual([{ id: "q1", answer: "Voici mon relevé, note 14/20" }]);
    expect((await latest(s)).infoRequest?.response).toBeNull(); // la nouvelle demande est vierge
  });
});
