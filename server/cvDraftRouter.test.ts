import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";
import type { CvDraft } from "../shared/cvDraft";
import { CV_DRAFT_MAX_PER_HOUR, createCvDraftLimiter, createCvDraftRouter, type CvDraftRouterPorts, type CvDraftRow } from "./routers/cvDraft";
import type { CvDraftOutcome } from "./services/cvDraftGenerator";

const draft: CvDraft = { headline: "Logisticien", summary: null, experiences: [], education: [], skills: [], languages: [], certifications: [], missing: [] };
const okOutcome: CvDraftOutcome = { ok: true, draft, unverified: [], model: "test-model", excerpt: { chars: 300, truncated: false, masked: 1 } };
const failure: CvDraftOutcome = { ok: false, reason: "no_cv_consent", error: "Le candidat n’a pas donné son accord distinct à la lecture de son CV par l’IA : le générateur ne peut pas partir de son CV." };

const row = (overrides: Partial<CvDraftRow> = {}): CvDraftRow => ({
  id: 7,
  fullName: "Aïcha Nkolo",
  email: "aicha@example.com",
  phone: "+237600000000",
  cityOfResidence: "Yaoundé",
  nationality: "Camerounaise",
  destinationCountry: "Canada",
  ...overrides,
});

function setup(overrides: Partial<CvDraftRouterPorts> = {}) {
  const generate = vi.fn(async () => okOutcome);
  const logExport = vi.fn(async () => {});
  const loadSupportingFacts = vi.fn(async () => ["Diplôme — Licence logistique", "Attestation employeur"]);
  const saveProjectDetails = vi.fn(async () => {});
  const logRelease = vi.fn(async () => {});
  const ports: CvDraftRouterPorts = {
    requireAdmin: async (token) => {
      if (token !== "valid") throw new TRPCError({ code: "UNAUTHORIZED", message: "Session administrateur invalide." });
      return { email: "agent@3mtravelagency.com" };
    },
    loadRow: async (id) => (id === 7 ? row({ projectDetailsJson: JSON.stringify({ preparatoryAnalysisConsent: true, preparatoryCvAnalysisConsent: true }) }) : null),
    loadSupportingFacts,
    generate,
    saveProjectDetails,
    logExport,
    logRelease,
    now: () => 1_700_000_000_000,
    ...overrides,
  };
  return { caller: createCvDraftRouter(ports).createCaller({} as never), generate, logExport, loadSupportingFacts, saveProjectDetails, logRelease };
}

describe("routeur cvDraft : accès administrateur", () => {
  it("session invalide : refus, aucune lecture du dossier ni génération", async () => {
    const loadRow = vi.fn(async () => row());
    const { caller, generate } = setup({ loadRow });
    await expect(caller.generate({ sessionToken: "forged", evaluationId: 7 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.logExport({ sessionToken: "forged", evaluationId: 7, style: "europe" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(loadRow).not.toHaveBeenCalled();
    expect(generate).not.toHaveBeenCalled();
  });

  it("évaluation inconnue : NOT_FOUND", async () => {
    const { caller, generate } = setup();
    await expect(caller.generate({ sessionToken: "valid", evaluationId: 999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(generate).not.toHaveBeenCalled();
  });
});

describe("routeur cvDraft : génération", () => {
  it("propose le style canadien et le français pour une destination Canada, et renvoie l'identité du dossier", async () => {
    const { caller, generate } = setup();
    const result = await caller.generate({ sessionToken: "valid", evaluationId: 7 });
    expect(generate).toHaveBeenCalledTimes(1);
    expect(generate.mock.calls[0]).toEqual([expect.objectContaining({ id: 7 }), { style: "canada", language: "fr", targetRole: undefined, supportingFacts: ["Diplôme — Licence logistique", "Attestation employeur"] }]);
    expect(result.style).toBe("canada");
    expect(result.language).toBe("fr");
    expect(result.identity).toEqual({ fullName: "Aïcha Nkolo", email: "aicha@example.com", phone: "+237600000000", city: "Yaoundé", nationality: "Camerounaise" });
    expect(result.outcome).toEqual(okOutcome);
  });

  it("le style et la langue choisis par l'administrateur l'emportent sur la destination", async () => {
    const { caller, generate } = setup();
    await caller.generate({ sessionToken: "valid", evaluationId: 7, style: "international", language: "en" });
    expect(generate.mock.calls[0][1]).toEqual({ style: "international", language: "en", targetRole: undefined, supportingFacts: ["Diplôme — Licence logistique", "Attestation employeur"] });
  });

  it("un refus du service (consentement manquant) est renvoyé tel quel, sans exception, pour être affiché à l'écran", async () => {
    const { caller } = setup({ generate: async () => failure });
    const result = await caller.generate({ sessionToken: "valid", evaluationId: 7 });
    expect(result.outcome).toEqual(failure);
  });

  it("n'écrit dans les journaux que qui/quel dossier/quel résultat, jamais le contenu du CV ni l'identité", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const { caller } = setup();
    await caller.generate({ sessionToken: "valid", evaluationId: 7 });
    const logged = JSON.stringify(info.mock.calls);
    info.mockRestore();
    expect(logged).toContain("agent@3mtravelagency.com");
    expect(logged).not.toContain("Nkolo");
    expect(logged).not.toContain("aicha@example.com");
    expect(logged).not.toContain("Logisticien");
  });

  it(`plafonne à ${CV_DRAFT_MAX_PER_HOUR} générations par heure et par administrateur`, async () => {
    const { caller, generate } = setup();
    for (let i = 0; i < CV_DRAFT_MAX_PER_HOUR; i += 1) await caller.generate({ sessionToken: "valid", evaluationId: 7 });
    await expect(caller.generate({ sessionToken: "valid", evaluationId: 7 })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(generate).toHaveBeenCalledTimes(CV_DRAFT_MAX_PER_HOUR);
  });

  it("le plafond se libère après une heure", () => {
    const allow = createCvDraftLimiter(2, 1000);
    expect(allow("a", 0)).toBe(true);
    expect(allow("a", 10)).toBe(true);
    expect(allow("a", 20)).toBe(false);
    expect(allow("b", 20)).toBe(true);
    expect(allow("a", 2000)).toBe(true);
  });
});

describe("routeur cvDraft : export", () => {
  it("trace l'export du PDF (administrateur, dossier, style) sans contenu de CV", async () => {
    const { caller, logExport } = setup();
    await expect(caller.logExport({ sessionToken: "valid", evaluationId: 7, style: "canada" })).resolves.toEqual({ ok: true });
    expect(logExport).toHaveBeenCalledWith({ adminEmail: "agent@3mtravelagency.com", evaluationId: 7, style: "canada" });
  });
});

describe("routeur cvDraft : pack candidature admin", () => {
  const richDraft: CvDraft = {
    headline: "Logisticien",
    summary: "Professionnel de la logistique.",
    experiences: [{ role: "Logisticien", employer: "TRANSCAM", location: null, start: "2018", end: "2022", bullets: ["Suivi"] }],
    education: [],
    skills: ["Logistique"],
    languages: [],
    certifications: [],
    missing: [],
  };

  it("enregistre le pack admin dans projectDetailsJson", async () => {
    const { caller, saveProjectDetails, logRelease } = setup();
    const result = await caller.saveApplicationPack({
      sessionToken: "valid",
      evaluationId: 7,
      style: "canada",
      language: "fr",
      includeContact: true,
      targetRole: "Logisticien entrepôt",
      draft: richDraft,
      motivationLetter: "Madame, Monsieur,\n\nJe souhaite postuler au poste de logisticien.",
    });
    expect(result.ok).toBe(true);
    expect(result.savedAt).toBeTruthy();
    expect(saveProjectDetails).toHaveBeenCalledTimes(1);
    const json = saveProjectDetails.mock.calls[0][1] as string;
    expect(json).toContain("applicationPack");
    expect(json).toContain("Logisticien entrepôt");
    expect(logRelease).toHaveBeenCalledWith(expect.objectContaining({ action: "saved", style: "canada" }));
  });

  it("refuse un pack trop incomplet", async () => {
    const { caller, saveProjectDetails } = setup();
    await expect(caller.saveApplicationPack({
      sessionToken: "valid",
      evaluationId: 7,
      style: "canada",
      language: "fr",
      includeContact: false,
      draft,
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(saveProjectDetails).not.toHaveBeenCalled();
  });
});
