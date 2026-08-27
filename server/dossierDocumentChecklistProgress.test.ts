import { describe, expect, it } from "vitest";
import { calculateChecklistProgress } from "../client/src/components/DossierDocumentChecklist";

describe("calculateChecklistProgress", () => {
  it("compte les pièces reçues et validées sans compter les pièces à remplacer", () => {
    expect(calculateChecklistProgress([
      { state: { kind: "verified" } },
      { state: { kind: "received" } },
      { state: { kind: "replace" } },
      { state: { kind: "missing" } },
    ])).toEqual({ total: 4, completed: 2, percentage: 50 });
  });

  it("retourne zéro lorsqu’aucune pièce ne figure dans la checklist", () => {
    expect(calculateChecklistProgress([])).toEqual({ total: 0, completed: 0, percentage: 0 });
  });
});
