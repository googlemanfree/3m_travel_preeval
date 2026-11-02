import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ rows: [] as Array<Record<string, unknown>>, adminChecked: vi.fn() }));

vi.mock("./db", () => ({
  getDb: async () => ({ select: () => ({ from: () => ({ orderBy: () => ({ limit: async () => state.rows }) }) }) }),
}));
vi.mock("./routers/adminAuth", () => ({ requireValidAdminSession: async (token: string) => { state.adminChecked(token); if (token === "mauvais-jeton-0000") throw new Error("Session invalide"); return { id: 1, email: "admin@example.com" }; } }));

import { evaluationJourneysRouter } from "./routers/evaluationJourneys";

const row = (id: number, overrides: Record<string, unknown>) => ({
  id, referenceCode: `3M-EV-${id}`, fullName: `Candidat ${id}`, status: "pending", createdAt: new Date(`2026-10-${10 + id}T10:00:00Z`),
  destinationCountry: "Allemagne", projectType: "etudes", educationLevel: "", frenchLevel: "", englishLevel: "",
  projectDetailsJson: JSON.stringify({ programId: "etudes-professionnelle", programFamily: "study_vocational", domainId: "sante", trainingKind: "apprentissage", trainingTarget: "Soins", trainingContract: "aucune", trainingFunding: "remuneree", healthTrainingTrack: "soins_infirmiers" }),
  ...overrides,
});

const caller = () => evaluationJourneysRouter.createCaller({} as never);
const token = "jeton-admin-valide-00000000";

beforeEach(() => {
  state.adminChecked.mockReset();
  state.rows = [
    row(1, {}),
    row(2, { destinationCountry: "Canada", projectType: "travail", projectDetailsJson: JSON.stringify({ programId: "travail-employeur", programFamily: "work_employer", domainId: "btp", targetJob: "Soudeur", relevantExperience: "3_5", offerStatus: "aucune", availability: "2 mois" }) }),
    row(3, { destinationCountry: "France", projectType: "tourisme", projectDetailsJson: JSON.stringify({ programId: "tourisme-tourisme", programFamily: "visit_tourist" }) }),
    row(4, { projectDetailsJson: JSON.stringify({ targetJob: "soudeur" }), destinationCountry: "Canada", projectType: "travail" }),
  ];
});

describe("pilotage des évaluations par parcours (administration)", () => {
  it("exige une session administrateur valide", async () => {
    await expect(caller().adminOverview({ sessionToken: "mauvais-jeton-0000" })).rejects.toThrow("Session invalide");
    expect(state.adminChecked).toHaveBeenCalledWith("mauvais-jeton-0000");
  });

  it("compte les évaluations dynamiques, l'ancien formulaire et regroupe par pays, visa et domaine", async () => {
    const overview = await caller().adminOverview({ sessionToken: token });
    expect(overview.scanned).toBe(4);
    expect(overview.dynamicCount).toBe(3);
    expect(overview.legacyCount).toBe(1);
    expect(overview.byCountry.map((entry) => [entry.key, entry.count])).toEqual(expect.arrayContaining([["Allemagne", 1], ["Canada", 1], ["France", 1]]));
    expect(overview.byProgram.map((entry) => entry.key)).toEqual(expect.arrayContaining(["study_vocational", "work_employer", "visit_tourist"]));
    expect(overview.byDomain.map((entry) => entry.key).sort()).toEqual(["btp", "sante"]);
    expect(overview.byProgram.find((entry) => entry.key === "study_vocational")?.label).toBe("Formation professionnelle ou apprentissage");
  });

  it("filtre par pays, par programme et par domaine", async () => {
    expect((await caller().adminOverview({ sessionToken: token, country: "Canada" })).items.map((item) => item.id)).toEqual([2]);
    expect((await caller().adminOverview({ sessionToken: token, programFamily: "study_vocational" })).items.map((item) => item.id)).toEqual([1]);
    expect((await caller().adminOverview({ sessionToken: token, domainId: "btp" })).items.map((item) => item.id)).toEqual([2]);
    expect((await caller().adminOverview({ sessionToken: token, country: "Allemagne", domainId: "btp" })).matching).toBe(0);
  });

  it("signale les points à clarifier et les questions obligatoires manquantes", async () => {
    const flagged = await caller().adminOverview({ sessionToken: token, flaggedOnly: true });
    const ids = flagged.items.map((item) => item.id);
    expect(ids).toEqual(expect.arrayContaining([1, 2]));
    expect(flagged.items.find((item) => item.id === 1)?.flags.join(" ")).toMatch(/rémunérée par l’employeur, mais sans contrat/);
    expect(flagged.items.find((item) => item.id === 1)?.firstAction).toMatch(/Identifier avec le candidat un employeur/);
    const incomplete = await caller().adminOverview({ sessionToken: token, incompleteOnly: true });
    expect(incomplete.items.every((item) => item.missingRequired > 0)).toBe(true);
  });

  it("ne renvoie ni coordonnées ni détails bruts du dossier", async () => {
    const overview = await caller().adminOverview({ sessionToken: token });
    const text = JSON.stringify(overview);
    expect(text).not.toMatch(/@|projectDetailsJson|trainingContract|healthTrainingTrack/);
    expect(overview.averageCompleteness).toBeGreaterThanOrEqual(0);
    expect(overview.averageCompleteness).toBeLessThanOrEqual(100);
  });
});
