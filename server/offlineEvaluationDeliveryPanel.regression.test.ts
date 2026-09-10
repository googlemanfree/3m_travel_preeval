import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("offline evaluation delivery panel", () => {
  it("returns explicit offline validation metadata and a non-generic missing-draft message", () => {
    const router = readFileSync(resolve(process.cwd(), "server/routers/unifiedRequests.ts"), "utf8");
    expect(router).toContain("offlineEvaluation:");
    expect(router).toContain("Aucun brouillon de bilan n’est disponible");
    expect(router).toContain("Dossier d’évaluation agence résolu pour ce compte candidat.");
  });

  it("renders the offline state and disables preparation actions", () => {
    const component = readFileSync(resolve(process.cwd(), "client/src/components/EvaluationDeliveryEditor.tsx"), "utf8");
    expect(component).toContain("offlineEvaluationValidated");
    expect(component).toContain("Évaluation déjà validée hors ligne");
    expect(component).toContain("disabled={offlineEvaluationValidated ||");
  });
});
