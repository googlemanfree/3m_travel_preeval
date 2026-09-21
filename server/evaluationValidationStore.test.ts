import { getTableColumns } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { evaluationValidationCases, evaluationValidationChanges, type EvaluationValidationCase } from "../drizzle/schema";
import { versionFromAiDraft } from "../shared/evaluationValidation";
import type { ValidationCasePatch } from "./services/evaluationValidationCore";
import { fromRow, isDuplicateKeyError, isMissingTableError, orFallbackWhenTablesMissing, toRowValues } from "./services/evaluationValidationStore";
import { missingTablesError, sampleAiDraft } from "./services/evaluationValidationTestkit";

const NOW = new Date("2026-09-21T09:00:00.000Z");

function fullPatch(): ValidationCasePatch {
  const draft = sampleAiDraft();
  return {
    workflowStatus: "validee_publiee",
    aiDraft: draft,
    aiDraftGeneratedAt: NOW,
    aiDraftModel: "gemini-test",
    aiDraftWarnings: [{ field: "Pays prioritaire", message: "x" }],
    aiDraftError: "erreur",
    adminVersion: versionFromAiDraft(draft, { evaluationDate: "2026-09-20" }),
    adminVersionUpdatedAt: NOW,
    adminVersionUpdatedBy: "admin@3m.test",
    firstValidatedBy: "admin@3m.test",
    firstValidatedAt: NOW,
    infoRequest: { message: "m", items: [{ id: "q1", label: "Diplôme" }], requestedAt: NOW.toISOString(), response: null },
    infoRequestedAt: NOW,
    infoRequestedBy: "admin@3m.test",
    publishedReport: null,
    publishedAt: NOW,
    publishedBy: "admin@3m.test",
    publishedChecklist: { coherence: true },
    emailSubject: "Objet",
    emailSentAt: NOW,
    emailError: null,
    emailClaimedAt: NOW,
  };
}

describe("conversions ligne ↔ modèle", () => {
  it("n'écrit que des colonnes qui existent réellement dans la table (Drizzle ignorerait sinon la clé en silence)", () => {
    const columns = new Set(Object.keys(getTableColumns(evaluationValidationCases)));
    const written = Object.keys(toRowValues(fullPatch()));
    expect(written.length).toBeGreaterThan(15);
    for (const key of written) expect(columns.has(key), key).toBe(true);
    // et chaque champ du modèle modifiable est bien écrit quelque part
    const patchKeys = Object.keys(fullPatch());
    expect(written).toHaveLength(patchKeys.length);
  });

  it("ne réécrit jamais un champ absent, et efface explicitement un champ à null", () => {
    expect(toRowValues({})).toEqual({});
    expect(toRowValues({ emailError: null })).toEqual({ emailError: null });
    expect(toRowValues({ adminVersion: null })).toEqual({ adminVersionJson: null });
    expect(toRowValues({ workflowStatus: "en_revue_admin" })).toEqual({ workflowStatus: "en_revue_admin" });
  });

  it("restitue à l'identique ce qui a été écrit (aller-retour ligne → modèle)", () => {
    const patch = fullPatch();
    const values = toRowValues(patch) as Record<string, unknown>;
    const base: EvaluationValidationCase = {
      id: 7,
      evaluationId: 3,
      versionNumber: 2,
      workflowStatus: "dossier_recu",
      aiDraftJson: null,
      aiDraftGeneratedAt: null,
      aiDraftModel: null,
      aiDraftWarningsJson: null,
      aiDraftError: null,
      adminVersionJson: null,
      adminVersionUpdatedAt: null,
      adminVersionUpdatedBy: null,
      firstValidatedBy: null,
      firstValidatedAt: null,
      infoRequestJson: null,
      infoRequestedAt: null,
      infoRequestedBy: null,
      publishedReportJson: null,
      publishedAt: null,
      publishedBy: null,
      publishedChecklistJson: null,
      emailSubject: null,
      emailSentAt: null,
      emailError: null,
      emailClaimedAt: null,
      createdAt: NOW,
      updatedAt: NOW,
    };
    const model = fromRow({ ...base, ...values } as EvaluationValidationCase);
    expect(model).toMatchObject({ id: 7, evaluationId: 3, versionNumber: 2, workflowStatus: "validee_publiee", aiDraftModel: "gemini-test", firstValidatedBy: "admin@3m.test", emailSubject: "Objet" });
    expect(model.aiDraft).toEqual(patch.aiDraft);
    expect(model.adminVersion).toEqual(patch.adminVersion);
    expect(model.aiDraftWarnings).toEqual(patch.aiDraftWarnings);
    expect(model.infoRequest).toEqual(patch.infoRequest);
    expect(model.publishedChecklist).toEqual({ coherence: true });
    expect(model.publishedReport).toBeNull();
  });

  it("tolère un JSON corrompu ou obsolète sans casser la lecture, et refuse un statut inconnu", () => {
    const row = { id: 1, evaluationId: 1, versionNumber: 1, workflowStatus: "dossier_recu", aiDraftJson: "{pas du json", adminVersionJson: JSON.stringify({ priorityCountry: "Canada" }), infoRequestJson: "[]", aiDraftWarningsJson: "{}", publishedReportJson: null, publishedChecklistJson: null, createdAt: NOW, updatedAt: NOW } as unknown as EvaluationValidationCase;
    const model = fromRow(row);
    expect(model.aiDraft).toBeNull();
    expect(model.adminVersion).toBeNull();
    expect(model.infoRequest).toBeNull();
    expect(model.aiDraftWarnings).toEqual([]);
    expect(() => fromRow({ ...row, workflowStatus: "approuve" } as EvaluationValidationCase)).toThrow(/Statut de workflow inconnu/);
  });

  it("garde le jeu de colonnes de l'historique en phase avec ce que le store écrit", () => {
    const columns = Object.keys(getTableColumns(evaluationValidationChanges));
    for (const key of ["evaluationId", "versionNumber", "adminEmail", "field", "oldValueJson", "newValueJson"]) expect(columns).toContain(key);
  });
});

describe("erreurs SQL reconnues", () => {
  it("reconnaît une table absente, y compris quand Drizzle enveloppe l'erreur mysql2", () => {
    expect(isMissingTableError(missingTablesError())).toBe(true);
    expect(isMissingTableError(Object.assign(new Error("Failed query: select 1 from `evaluation_validation_changes`"), { cause: { code: "ER_NO_SUCH_TABLE" } }))).toBe(true);
    // un code « table absente » sans table de la validation structurée n'est PAS la migration 0072 manquante
    expect(isMissingTableError({ code: "ER_NO_SUCH_TABLE" })).toBe(false);
    expect(isMissingTableError({ errno: 1146 })).toBe(false);
    expect(isMissingTableError(new Error("Failed query", { cause: { code: "ER_NO_SUCH_TABLE", errno: 1146 } }))).toBe(false);
    expect(isMissingTableError(Object.assign(new Error("Failed query: insert into `evaluation_review_events` values (?)"), { cause: { code: "ER_NO_SUCH_TABLE", errno: 1146 } }))).toBe(false);
    expect(isMissingTableError(new Error("Table 'railway.evaluation_validation_cases' doesn't exist"))).toBe(true);
    expect(isMissingTableError(new Error("Table 'railway.candidates' doesn't exist"))).toBe(false);
    expect(isMissingTableError(new Error("Connection lost"))).toBe(false);
    expect(isMissingTableError(null)).toBe(false);
  });

  it("reconnaît un doublon de clé unique", () => {
    expect(isDuplicateKeyError({ code: "ER_DUP_ENTRY" })).toBe(true);
    expect(isDuplicateKeyError(new Error("Failed query", { cause: { errno: 1062 } }))).toBe(true);
    expect(isDuplicateKeyError(new Error("autre"))).toBe(false);
  });

  it("retombe sur la valeur de repli uniquement quand les tables manquent, et laisse passer toute autre erreur", async () => {
    await expect(orFallbackWhenTablesMissing("repli", async () => { throw missingTablesError(); })).resolves.toBe("repli");
    await expect(orFallbackWhenTablesMissing("repli", async () => "ok")).resolves.toBe("ok");
    await expect(orFallbackWhenTablesMissing("repli", async () => { throw new Error("Connection lost"); })).rejects.toThrow("Connection lost");
  });
});
