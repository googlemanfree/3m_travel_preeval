import { describe, expect, it } from "vitest";
import { DEFAULT_ACCOUNT_VIEW, accountStage, arrangeAccounts, parseStoredView, sortAccounts } from "../shared/accountOrdering";
import { evaluationDisplayReference } from "../shared/evaluationReference";

const NOW = new Date("2026-11-10T12:00:00Z").getTime();
const acc = (id: number, over: Record<string, unknown> = {}) => ({ id, fullName: `Candidat ${id}`, createdAt: `2026-11-0${id}T08:00:00Z`, lastLoginAt: null, documentsCount: 0, destinationPreference: "Canada", evaluationValidated: false, paymentValidated: false, pendingEvaluationReference: null, bilan: null, ...over });

describe("ranger, classer, réorganiser les comptes", () => {
  it("trie par date, nom, connexion, pièces et ancienneté du bilan en attente ; les valeurs absentes passent toujours en dernier", () => {
    const list = [acc(1, { fullName: "Zoé", documentsCount: 2, lastLoginAt: "2026-11-05T00:00:00Z" }), acc(2, { fullName: "Alice", documentsCount: 9 }), acc(3, { fullName: "Marc", documentsCount: 4, lastLoginAt: "2026-11-09T00:00:00Z" })];
    const ids = (sort: "created" | "name" | "activity" | "documents" | "waiting" | "stage", dir: "asc" | "desc") => sortAccounts(list, { sort, dir }, NOW).map((item) => item.id);
    expect(ids("created", "desc")).toEqual([3, 2, 1]);
    expect(ids("created", "asc")).toEqual([1, 2, 3]);
    expect(ids("name", "asc")).toEqual([2, 3, 1]);
    expect(ids("name", "desc")).toEqual([1, 3, 2]);
    expect(ids("documents", "desc")).toEqual([2, 3, 1]);
    expect(ids("activity", "desc")).toEqual([3, 1, 2]);
    expect(ids("activity", "asc")).toEqual([1, 3, 2]);
    const waiting = [acc(1, { bilan: { sent: true, sentAt: "2026-11-09T12:00:00Z" } }), acc(2, { bilan: { sent: true, sentAt: "2026-11-01T12:00:00Z" } }), acc(3, { bilan: { sent: true, sentAt: "2026-11-01T12:00:00Z", decision: "accepted" } }), acc(4)];
    expect(sortAccounts(waiting, { sort: "waiting", dir: "desc" }, NOW).map((item) => item.id)).toEqual([2, 1, 4, 3]);
    expect(list.map((item) => item.id)).toEqual([1, 2, 3]);
  });

  it("chaque compte est rangé dans l'étape qui correspond à son état réel", () => {
    expect(accountStage(acc(1, { evaluationValidated: true, paymentValidated: true })).id).toBe("ready");
    expect(accountStage(acc(1, { pendingEvaluationReference: "Évaluation externe à valider" })).id).toBe("eval_external");
    expect(accountStage(acc(1)).id).toBe("eval_todo");
    expect(accountStage(acc(1, { bilan: { sent: true } })).id).toBe("waiting_answer");
    expect(accountStage(acc(1, { bilan: { sent: true, decision: "declined" } })).id).toBe("declined");
    expect(accountStage(acc(1, { bilan: { sent: true, decision: "accepted" } })).id).toBe("opening");
    expect(accountStage(acc(1, { bilan: { sent: true, openingRequested: true } })).id).toBe("opening");
    expect(accountStage(acc(1, { evaluationValidated: true })).id).toBe("other");
  });

  it("le classement regroupe par étape (dans l'ordre du parcours) ou par destination, sans perdre ni dupliquer un compte", () => {
    const list = [acc(1, { destinationPreference: "Luxembourg" }), acc(2, { destinationPreference: "Canada", bilan: { sent: true } }), acc(3, { destinationPreference: null }), acc(4, { destinationPreference: "Canada" })];
    const byStage = arrangeAccounts(list, { ...DEFAULT_ACCOUNT_VIEW, group: "stage" }, NOW);
    expect(byStage.rows.map((item) => item.id).sort()).toEqual([1, 2, 3, 4]);
    expect(Array.from(byStage.starts.values()).map((item) => item.label)).toEqual(["Évaluation à faire", "Bilan envoyé : réponse attendue"]);
    expect(byStage.rows[0].id).toBe(4);
    const byDestination = arrangeAccounts(list, { ...DEFAULT_ACCOUNT_VIEW, group: "destination" }, NOW);
    expect(Array.from(byDestination.starts.values())).toEqual([{ label: "Canada", count: 2 }, { label: "Luxembourg", count: 1 }, { label: "Non précisée", count: 1 }]);
    expect(arrangeAccounts(list, DEFAULT_ACCOUNT_VIEW, NOW).starts.size).toBe(0);
  });

  it("le choix mémorisé n'accepte que des valeurs connues", () => {
    expect(parseStoredView(JSON.stringify({ sort: "name", dir: "asc", group: "stage" }))).toEqual({ sort: "name", dir: "asc", group: "stage" });
    expect(parseStoredView(JSON.stringify({ sort: "x", dir: "sideways", group: "y" }))).toEqual(DEFAULT_ACCOUNT_VIEW);
    expect(parseStoredView("pas du json")).toEqual(DEFAULT_ACCOUNT_VIEW);
    expect(parseStoredView(null)).toEqual(DEFAULT_ACCOUNT_VIEW);
  });
});

describe("référence affichée : COMPTE-… avant paiement, 3M-… seulement après", () => {
  it("un dossier non payé n'affiche jamais une référence 3M, même si son numéro technique commence par 3M", () => {
    expect(evaluationDisplayReference({ dossierNumber: "3M-2026-1320001", candidateId: 717, paymentStatus: "PENDING", dossierStatus: "bilan_envoye" })).toBe("COMPTE-00717");
    expect(evaluationDisplayReference({ dossierNumber: "EVAL-DRAFT-5", candidateId: 9, paymentStatus: "PENDING", dossierStatus: "en_evaluation" })).toBe("COMPTE-00009");
    expect(evaluationDisplayReference({ dossierNumber: "3M-2026-1320001", candidateId: null, paymentStatus: "PENDING" })).toBeNull();
  });

  it("après paiement, la référence 3M s'affiche ; un numéro provisoire ne devient jamais une référence", () => {
    expect(evaluationDisplayReference({ dossierNumber: "3M-2026-1320001", candidateId: 717, paymentStatus: "SUCCESS" })).toBe("3M-2026-1320001");
    expect(evaluationDisplayReference({ dossierNumber: "3M-2026-1320001", candidateId: 717, paymentStatus: "PENDING", dossierStatus: "documents_recus" })).toBe("3M-2026-1320001");
    expect(evaluationDisplayReference({ dossierNumber: "EVAL-DRAFT-5", candidateId: 9, paymentStatus: "SUCCESS" })).toBe("COMPTE-00009");
  });
});
