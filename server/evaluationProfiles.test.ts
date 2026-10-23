import { describe, expect, it } from "vitest";
import { EVALUATION_PROFILES, PROFILE_DEFS, SCORE_KEYS, criteriaFor, resolveEvaluationProfile } from "../shared/evaluationProfiles";
import {
  AdminEvaluationVersionSchema,
  PUBLICATION_CHECKLIST,
  blankAdminVersion,
  buildClientReport,
  normalizeScoreBreakdown,
  resolveScore,
  scoresAboveProfileMax,
} from "../shared/evaluationValidation";
import { ROUTE_KEYS } from "../shared/evaluationValidation";
import { ValidationFlowError, buildAdminView, publishEvaluation, recordAiDraft, saveAdminVersion, versionStamp, type EvaluationContext, type ValidationDeps } from "./services/evaluationValidationCore";
import { buildDeclaredProfile, buildStructuredPrompt, evaluationProfileOfRow, structuredOutputSchemaFor } from "./services/structuredEvaluationDraft";
import { CANDIDATE_CONTEXT, FakeMailer, InMemoryValidationStore, sampleAiDraft } from "./services/evaluationValidationTestkit";

const ADMIN = { email: "admin@3m.test" };
const FULL_CHECKLIST = Object.fromEntries(PUBLICATION_CHECKLIST.map((item) => [item.key, true]));

function setup(context: Partial<EvaluationContext>) {
  let clock = Date.parse("2026-10-23T09:00:00.000Z");
  const now = () => new Date(clock);
  const store = new InMemoryValidationStore([{ ...CANDIDATE_CONTEXT, ...context }], now);
  const deps: ValidationDeps = { store, mailer: new FakeMailer(store.timeline), now, portalUrl: "https://www.3mtravelagency.com/mon-espace" };
  return { store, deps };
}

describe("grilles par profil", () => {
  it("chaque profil note sur 100, avec les huit clés et six voies", () => {
    for (const profile of EVALUATION_PROFILES) {
      const grid = criteriaFor(profile);
      expect(grid.map((criterion) => criterion.key), profile).toEqual([...SCORE_KEYS]);
      expect(grid.reduce((sum, criterion) => sum + criterion.max, 0), profile).toBe(100);
      expect(Object.keys(PROFILE_DEFS[profile].routes), profile).toEqual([...ROUTE_KEYS]);
      expect(PROFILE_DEFS[profile].reportTitle).toMatch(/Bilan d’évaluation/);
    }
  });

  it("le vocabulaire suit le projet : pas d'employabilité pour des études ni pour un e-Visa", () => {
    expect(PROFILE_DEFS.etudes.criteria.employability.label).toMatch(/Admission/);
    expect(PROFILE_DEFS.etudes.criteria.finances.label).toMatch(/Financement des études/);
    expect(PROFILE_DEFS.evisa.criteria.identity.label).toMatch(/Passeport/);
    expect(PROFILE_DEFS.evisa.criteria.documents.label).toMatch(/portail officiel/);
    for (const profile of ["etudes", "tourisme", "evisa"] as const) {
      const labels = criteriaFor(profile).map((criterion) => criterion.label).join(" ");
      expect(labels, profile).not.toMatch(/Employabilité/);
    }
    expect(PROFILE_DEFS.evisa.targets).toEqual({ jobs: null, sectors: null });
    expect(PROFILE_DEFS.tourisme.targets).toEqual({ jobs: null, sectors: null });
  });
});

describe("profil déduit de la demande du candidat", () => {
  it("le programme choisi fait foi, puis le type de projet, puis le visa", () => {
    expect(resolveEvaluationProfile({ programId: "etudes-cursus" })).toBe("etudes");
    expect(resolveEvaluationProfile({ programId: "evisa-touristique", projectType: "tourisme" })).toBe("evisa");
    expect(resolveEvaluationProfile({ programId: "travail-employeur" })).toBe("travail");
    expect(resolveEvaluationProfile({ programId: "immigration-famille" })).toBe("immigration");
    expect(resolveEvaluationProfile({ projectType: "etudes" })).toBe("etudes");
    expect(resolveEvaluationProfile({ projectType: "tourisme" })).toBe("tourisme");
    expect(resolveEvaluationProfile({ projectType: "evisa" })).toBe("evisa");
    expect(resolveEvaluationProfile({ visaType: "canada_etude" })).toBe("etudes");
    expect(resolveEvaluationProfile({ visaType: "e-visa Ouganda" })).toBe("evisa");
    expect(resolveEvaluationProfile({})).toBe("travail");
  });

  it("une évaluation reçue donne son profil", () => {
    expect(evaluationProfileOfRow({ projectType: "etudes", visaType: null, projectDetailsJson: null })).toBe("etudes");
    expect(evaluationProfileOfRow({ projectType: "tourisme", visaType: null, projectDetailsJson: JSON.stringify({ programId: "evisa-touristique" }) })).toBe("evisa");
  });
});

describe("notes et rapport selon le profil", () => {
  it("le barème du profil borne chaque note et le total reste sur 100", () => {
    const scores = { identity: 10, qualification: 20, languages: 15, experience: 5, employability: 15, finances: 20, documents: 10, coherence: 5 };
    const etudes = resolveScore({ scores, profile: "etudes" });
    expect(etudes.computedTotal).toBe(100);
    // la même saisie sur la grille « travail » est bornée (qualification 15, finances 10…)
    expect(resolveScore({ scores, profile: "travail" }).computedTotal).toBeLessThan(100);
    expect(scoresAboveProfileMax(scores, "travail").map((entry) => entry.key)).toEqual(expect.arrayContaining(["qualification", "finances"]));
    expect(scoresAboveProfileMax(scores, "etudes")).toEqual([]);
  });

  it("le schéma refuse une note hors barème du profil et accepte celle du bon profil", () => {
    const base = { ...blankAdminVersion({ priorityCountry: "Allemagne", candidateName: "A", evaluationDate: "2026-10-23", profile: "etudes" }), profileSummary: "Résumé", route: "A" as const };
    const high = { ...base, scores: { ...base.scores, qualification: 18 } };
    expect(AdminEvaluationVersionSchema.safeParse(high).success).toBe(true);
    expect(AdminEvaluationVersionSchema.safeParse({ ...high, profile: "travail" }).success).toBe(false);
    expect(AdminEvaluationVersionSchema.safeParse({ ...high, scores: { ...high.scores, coherence: 6 } }).success).toBe(false);
  });

  it("le rapport client porte le titre, la grille et les voies du profil", () => {
    const base = blankAdminVersion({ priorityCountry: "Ouganda", candidateName: "A", evaluationDate: "2026-10-23", profile: "evisa" });
    const report = buildClientReport({ ...base, profileSummary: "Dossier e-Visa à compléter.", route: "A", scores: { ...base.scores, identity: 25, documents: 20 } }, { candidateName: "A", validatedAt: "2026-10-23" });
    expect(report.profile).toBe("evisa");
    expect(report.reportTitle).toBe("Bilan d’évaluation — demande d’e-Visa");
    expect(report.route?.label).toBe("e-Visa standard (une entrée)");
    expect(report.scoreBreakdown.find((entry) => entry.key === "identity")).toMatchObject({ label: "Passeport et identité", max: 25, score: 25 });
    expect(report.scoreBreakdown.reduce((sum, entry) => sum + entry.max, 0)).toBe(100);
  });

  it("une ancienne version sans profil garde la grille « travail » (rien ne change pour les bilans déjà publiés)", () => {
    const base = blankAdminVersion({ priorityCountry: "Canada", candidateName: "A", evaluationDate: "2026-10-23" });
    const { profile: _profile, ...legacy } = base;
    const report = buildClientReport({ ...legacy, profileSummary: "Résumé", route: "A" }, { candidateName: "A", validatedAt: "2026-10-23" });
    expect(report.profile).toBe("travail");
    expect(report.scoreBreakdown.find((entry) => entry.key === "employability")?.label).toBe("Employabilité dans le pays choisi");
  });
});

describe("analyse assistée adaptée au profil", () => {
  const row = { fullName: "A B", destinationCountry: "Ouganda", projectType: "tourisme", visaType: null, projectDetailsJson: JSON.stringify({ programId: "evisa-touristique" }) } as never;

  it("la consigne, la grille et les voies sont celles du profil", () => {
    const profile = buildDeclaredProfile(row, new Date("2026-10-23T00:00:00Z"));
    const prompt = buildStructuredPrompt(profile, null, "evisa");
    expect(prompt).toContain("DEMANDE D’E-VISA");
    expect(prompt).toContain("Passeport et identité");
    expect(prompt).toContain("e-Visa standard (une entrée)");
    expect(prompt).not.toContain("Employabilité dans le pays choisi");
    expect(buildStructuredPrompt(profile, null, "etudes")).toContain("PROJET D’ÉTUDES");
  });

  it("le schéma de sortie reprend le barème du profil", () => {
    const etudes = structuredOutputSchemaFor("etudes").schema as { properties: { scores: { properties: Record<string, { maximum: number }> } } };
    expect(etudes.properties.scores.properties.finances.maximum).toBe(20);
    const evisa = structuredOutputSchemaFor("evisa").schema as typeof etudes;
    expect(evisa.properties.scores.properties.identity.maximum).toBe(25);
  });
});

describe("validation administrateur : le bilan suit la demande, l'administrateur garde la main", () => {
  it("une demande d'études ouvre un bilan d'études (e-mail compris) et reste en attente de validation", async () => {
    const { deps, store } = setup({ projectType: "etudes", visaType: "canada_etude", programId: "etudes-cursus" });
    const created = await recordAiDraft(deps, 1, { ok: true, draft: sampleAiDraft({ projectType: "etudes" }), model: "gemini-test" });
    expect(created.workflowStatus).toBe("attente_validation_admin");
    expect(created.adminVersion?.profile).toBe("etudes");
    expect(created.adminVersion?.emailSubject).toBe("Votre bilan d’évaluation (Études) est disponible — 3M TRAVEL AGENCY");
    expect(created.adminVersion?.emailBody).toContain("votre projet d’études");
    const view = await buildAdminView(deps, 1);
    expect(view.profile).toBe("etudes");
    expect(view.suggestedProfile).toBe("etudes");
    expect(await store.getLatestPublishedCase(1)).toBeNull();
  });

  it("une demande d'e-Visa donne un bilan d'e-Visa publié sous ce titre, après validation de l'administrateur", async () => {
    const { deps } = setup({ projectType: "evisa", visaType: null, programId: "evisa-touristique", candidateCountry: "Ouganda" });
    await recordAiDraft(deps, 1, { ok: true, draft: sampleAiDraft({ priorityCountry: "Ouganda", projectType: "evisa" }), model: "gemini-test" });
    const current = await deps.store.getLatestCase(1);
    expect(current?.adminVersion?.profile).toBe("evisa");
    const stamp = versionStamp(current!.adminVersion!);
    const published = await publishEvaluation(deps, ADMIN, 1, { checklist: FULL_CHECKLIST, sendEmail: false, reviewedVersionStamp: stamp });
    expect(published.case.publishedReport?.reportTitle).toBe("Bilan d’évaluation — demande d’e-Visa");
    expect(published.case.publishedReport?.profile).toBe("evisa");
  });

  it("l'administrateur peut changer le profil : les notes sont reprises sur le nouveau barème et tout est tracé", async () => {
    const { deps, store } = setup({ projectType: "travail", programId: "travail-employeur" });
    await recordAiDraft(deps, 1, { ok: true, draft: sampleAiDraft(), model: "gemini-test" });
    const before = (await store.getLatestCase(1))!.adminVersion!;
    expect(before.profile).toBe("travail");
    const { case: saved, changedFields } = await saveAdminVersion(deps, ADMIN, 1, { ...before, profile: "etudes", scores: { ...normalizeScoreBreakdown(before.scores, "etudes"), qualification: 18, finances: 15 } });
    expect(saved.adminVersion?.profile).toBe("etudes");
    expect(changedFields).toEqual(expect.arrayContaining(["profile", "scores.qualification", "scores.finances"]));
    const view = await buildAdminView(deps, 1);
    expect(view.profile).toBe("etudes");
    expect(view.suggestedProfile).toBe("travail");
  });

  it("une note hors du barème du profil est refusée avec un message clair", async () => {
    const { deps } = setup({ projectType: "evisa", programId: "evisa-touristique" });
    await recordAiDraft(deps, 1, { ok: true, draft: sampleAiDraft({ projectType: "evisa" }), model: "gemini-test" });
    const current = (await deps.store.getLatestCase(1))!.adminVersion!;
    // le formulaire ramène les notes au barème du profil ; le serveur, lui, refuse tout envoi hors barème
    await expect(saveAdminVersion(deps, ADMIN, 1, { ...current, scores: { ...current.scores, languages: 12 } })).rejects.toBeInstanceOf(ValidationFlowError);
    await expect(saveAdminVersion(deps, ADMIN, 1, { ...current, profile: "travail", scores: { ...current.scores, languages: 12 } })).resolves.toBeTruthy();
  });
});
