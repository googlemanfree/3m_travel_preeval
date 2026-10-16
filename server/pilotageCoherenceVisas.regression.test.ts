import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolveEvaluationProjectKind } from "../shared/evaluationVisaCv";
import { generatePersonalizedRecommendations } from "./evaluationService";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("pilotage — cohérence visas + sync + dépôt documenté", () => {
  it("distingue études / travail / tourisme pour le type de projet", () => {
    expect(resolveEvaluationProjectKind("etudes")).toBe("etudes");
    expect(resolveEvaluationProjectKind(null, "Visa études Canada")).toBe("etudes");
    expect(resolveEvaluationProjectKind("travail", "luxembourg")).toBe("travail");
    expect(resolveEvaluationProjectKind("tourisme")).toBe("tourisme");
    expect(resolveEvaluationProjectKind("schengen_tourisme")).toBe("tourisme");
  });

  it("adapte les recommandations du bilan au type de projet", () => {
    const base = {
      fullName: "Test",
      email: "t@example.com",
      destination: "canada",
      dossierNumber: "3M-1",
      scoringDetails: "{}",
      scoringTotal: 70,
    } as any;
    const etudes = generatePersonalizedRecommendations(
      { education: 20, experience: 10, language: 10, sector: 10, ageAdjustment: 5 },
      { ...base, visaType: "etudes" },
    );
    expect(etudes.some((line) => /études|admission|académique|financement/i.test(line))).toBe(true);
    expect(etudes.some((line) => /CV à jour/i.test(line))).toBe(false);

    const travail = generatePersonalizedRecommendations(
      { education: 20, experience: 10, language: 10, sector: 10, ageAdjustment: 5 },
      { ...base, visaType: "travail" },
    );
    expect(travail.some((line) => /CV|employeur|professionnelle/i.test(line))).toBe(true);

    const tourisme = generatePersonalizedRecommendations(
      { education: 10, experience: 10, language: 8, sector: 10, ageAdjustment: 5 },
      { ...base, visaType: "tourisme" },
    );
    expect(tourisme.some((line) => /itinéraire|attaches|retour|statut/i.test(line))).toBe(true);
  });

  it("câble le pilotage sur le projectType d’évaluation et sécurise l’enregistrement", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("latestEvaluation?.projectType");
    expect(admin).toContain("Étape de traitement invalide");
    expect(admin).toContain("Échéance métier invalide");

    const workspace = read("client/src/components/Candidate360Workspace.tsx");
    expect(workspace).toContain("Étiquette trop longue");
    expect(workspace).toContain("destinationMutation.mutate");
    expect(workspace).toContain("evaluationContext?.projectType");

    const crm = read("client/src/components/CandidateDocumentsCrm.tsx");
    expect(crm).toContain("crm-deposit-free");
    expect(crm).toContain("deposit-document-type");
    expect(crm).toContain("Indiquez précisément quel document");

    const docs = read("client/src/components/AdminDocumentsManagement.tsx");
    expect(docs).toContain("admin-upload-document-type");
    expect(docs).toContain("Précisez le type de document");
    expect(docs).toContain('useState("")');
  });
});
