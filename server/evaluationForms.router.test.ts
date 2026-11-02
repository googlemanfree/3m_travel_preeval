import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  rows: [] as Array<Record<string, unknown>>,
  inserted: [] as Array<Record<string, unknown>>,
  updated: [] as Array<Record<string, unknown>>,
  deleted: 0,
  total: 0,
  audit: vi.fn(),
}));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: (columns?: unknown) => ({
      from: () => {
        const result = columns ? Promise.resolve([{ total: state.total }]) : Object.assign(Promise.resolve(state.rows), {});
        return Object.assign(result, {
          where: () => ({ orderBy: () => ({ limit: async () => state.rows.filter((row) => row.active !== false) }) }),
          orderBy: () => ({ limit: async () => state.rows }),
        });
      },
    }),
    insert: () => ({ values: async (values: Record<string, unknown>) => { state.inserted.push(values); return [{ insertId: 42 }]; } }),
    update: () => ({ set: (values: Record<string, unknown>) => ({ where: async () => { state.updated.push(values); } }) }),
    delete: () => ({ where: async () => { state.deleted += 1; } }),
  }),
}));
vi.mock("./routers/adminAuth", async () => {
  const { TRPCError } = await import("@trpc/server");
  return { requireValidAdminSession: async (token: string) => { if (token === "mauvais-jeton-0000") throw new TRPCError({ code: "UNAUTHORIZED", message: "Session invalide" }); return { id: 3, email: "admin@example.com" }; } };
});
vi.mock("./services/privacyAudit", () => ({ recordPrivacyEvent: (...args: unknown[]) => state.audit(...args) }));

import { evaluationFormsRouter } from "./routers/evaluationForms";
import { invalidateFormOverrides } from "./services/formOverrides";

const caller = () => evaluationFormsRouter.createCaller({} as never);
const token = "jeton-admin-valide-00000000";
const dbRow = (overrides: Record<string, unknown>) => ({ id: 1, fieldKey: "trainingStart", action: "hide", projectKind: "etudes", programId: null, domainId: null, countryCode: null, payload: null, note: null, active: true, createdByLabel: "admin@example.com", createdAt: new Date(), ...overrides });

beforeEach(() => {
  state.rows = []; state.inserted = []; state.updated = []; state.deleted = 0; state.total = 0; state.audit.mockReset();
  invalidateFormOverrides();
});

describe("questions modifiables — routeur", () => {
  it("la liste des règles actives est publique et ne contient que le nécessaire à l'affichage", async () => {
    state.rows = [dbRow({ id: 2, fieldKey: "custom_a", action: "add", payload: JSON.stringify({ label: "Question ajoutée", kind: "text" }) })];
    const list = await caller().activeOverrides();
    expect(list).toEqual([{ id: 2, fieldKey: "custom_a", action: "add", projectKind: "etudes", programId: null, domainId: null, countryCode: null, payload: { label: "Question ajoutée", kind: "text" } }]);
    expect(JSON.stringify(list)).not.toMatch(/admin@example|createdBy/);
  });

  it("les règles désactivées n'apparaissent pas dans les formulaires", async () => {
    state.rows = [dbRow({ id: 1, active: false }), dbRow({ id: 2, fieldKey: "targetJob" })];
    expect((await caller().activeOverrides()).map((override) => override.fieldKey)).toEqual(["targetJob"]);
  });

  it("toute gestion exige une session administrateur valide", async () => {
    await expect(caller().adminList({ sessionToken: "mauvais-jeton-0000" })).rejects.toThrow("Session invalide");
    await expect(caller().adminSave({ sessionToken: "mauvais-jeton-0000", fieldKey: "targetJob", action: "hide" })).rejects.toThrow("Session invalide");
    await expect(caller().adminDelete({ sessionToken: "mauvais-jeton-0000", id: 1 })).rejects.toThrow("Session invalide");
    expect(state.inserted).toHaveLength(0);
  });

  it("enregistre une règle valide, la journalise et renvoie son numéro", async () => {
    const result = await caller().adminSave({ sessionToken: token, fieldKey: "custom_clinique", action: "add", projectKind: "etudes", programId: "etudes-professionnelle", domainId: "sante", countryCode: "de", payload: { label: "Avez-vous déjà travaillé dans une clinique ?", kind: "select", options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }], section: "domain" } });
    expect(result).toEqual({ id: 42 });
    expect(state.inserted[0]).toMatchObject({ fieldKey: "custom_clinique", action: "add", projectKind: "etudes", programId: "etudes-professionnelle", domainId: "sante", countryCode: "DE", createdByAdminId: 3 });
    expect(JSON.parse(String(state.inserted[0].payload)).label).toMatch(/clinique/);
    expect(state.audit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ action: "evaluation_form.override_saved", resourceType: "evaluation_form_override", resourceId: 42 }));
  });

  it("refuse une promesse de résultat, un programme inconnu, un visa d'un autre projet et un domaine inconnu", async () => {
    await expect(caller().adminSave({ sessionToken: token, fieldKey: "custom_a", action: "add", payload: { label: "Visa garanti ?" } })).rejects.toThrow(/promet un résultat/);
    await expect(caller().adminSave({ sessionToken: token, fieldKey: "targetJob", action: "hide", programId: "inconnu" })).rejects.toThrow(/Visa ou programme inconnu/);
    await expect(caller().adminSave({ sessionToken: token, fieldKey: "targetJob", action: "hide", projectKind: "etudes", programId: "travail-employeur" })).rejects.toThrow(/n'appartient pas à ce type de projet/);
    await expect(caller().adminSave({ sessionToken: token, fieldKey: "targetJob", action: "hide", domainId: "inconnu" })).rejects.toThrow(/Domaine inconnu/);
    expect(state.inserted).toHaveLength(0);
  });

  it("plafonne le nombre de règles", async () => {
    state.total = 300;
    await expect(caller().adminSave({ sessionToken: token, fieldKey: "targetJob", action: "hide" })).rejects.toThrow(/Nombre maximal de règles/);
  });

  it("modifie, désactive et supprime en journalisant chaque action", async () => {
    await caller().adminSave({ sessionToken: token, id: 7, fieldKey: "targetJob", action: "relabel", payload: { label: "Poste visé" } });
    expect(state.updated[0]).toMatchObject({ fieldKey: "targetJob", action: "relabel" });
    await caller().adminSetActive({ sessionToken: token, id: 7, active: false });
    expect(state.updated[1]).toEqual({ active: false });
    await caller().adminDelete({ sessionToken: token, id: 7 });
    expect(state.deleted).toBe(1);
    expect(state.audit.mock.calls.map((call) => (call[1] as { action: string }).action)).toEqual(["evaluation_form.override_saved", "evaluation_form.override_disabled", "evaluation_form.override_deleted"]);
  });

  it("l'aperçu montre les questions masquées, renommées, obligatoires et ajoutées", async () => {
    state.rows = [
      dbRow({ id: 1, fieldKey: "trainingStart", projectKind: "etudes", programId: "etudes-professionnelle" }),
      dbRow({ id: 2, fieldKey: "trainingKind", action: "relabel", projectKind: "etudes", programId: "etudes-professionnelle", payload: JSON.stringify({ label: "Quel type de formation ?" }) }),
      dbRow({ id: 3, fieldKey: "custom_q", action: "add", projectKind: "etudes", programId: "etudes-professionnelle", payload: JSON.stringify({ label: "Une question de plus", kind: "text" }) }),
    ];
    const preview = await caller().adminPreview({ sessionToken: token, projectType: "etudes", programId: "etudes-professionnelle", country: "Allemagne" });
    const fields = preview.sections.flatMap((section) => section.fields);
    expect(fields.find((entry) => entry.key === "trainingStart")).toMatchObject({ hidden: true });
    expect(fields.find((entry) => entry.key === "trainingKind")).toMatchObject({ label: "Quel type de formation ?", baseLabel: "Type de formation", hidden: false });
    expect(fields.find((entry) => entry.key === "custom_q")).toMatchObject({ custom: true, label: "Une question de plus" });
    expect(preview.program.id).toBe("etudes-professionnelle");
  });
});
