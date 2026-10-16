import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { evaluationRequiresCv } from "../shared/evaluationVisaCv";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("admin — file Sans CV, aperçu, sync, export, relance", () => {
  it("filtre Sans CV + aperçu + relances sur le dashboard évaluations", () => {
    const dashboard = read("client/src/pages/AdminAIEvaluationDashboard.tsx");
    expect(dashboard).toContain("filter-sans-cv");
    expect(dashboard).toContain("cvMissingOnly");
    expect(dashboard).toContain("itemMissingRequiredCv");
    expect(dashboard).toContain("evaluation-cv-preview-btn");
    expect(dashboard).toContain("DocumentPreviewModal");
    expect(dashboard).toContain("evaluation-cv-remind-email");
    expect(dashboard).toContain("evaluation-cv-remind-whatsapp");
    expect(dashboard).toContain("CV_REMINDER_SUBJECT_FR");
    expect(dashboard).toContain('"CV requis"');
    expect(dashboard).toContain('"CV présent"');
    expect(dashboard).toContain('"Nom fichier CV"');
    expect(dashboard).toContain('"CV"'); // colonne PDF
  });

  it("copie le CV d’évaluation vers le dossier à l’activation et à la création online", () => {
    const sync = read("server/services/syncEvaluationCvToCandidate.ts");
    expect(sync).toContain("syncEvaluationCvToCandidate");
    expect(sync).toContain('fileType: "cv"');
    expect(sync).toContain("agencyDossiers");

    const activate = read("server/routers/adminCandidateManagement.ts");
    expect(activate).toContain("syncEvaluationCvToCandidate");
    expect(activate).toContain("Sync CV évaluation non effectué");

    const application = read("server/routers/application.ts");
    expect(application).toContain("resolvedCvUrl");
    expect(application).toContain("evaluations.cvFileUrl");
    expect(application).toContain("syncEvaluationCvToCandidate");
  });

  it("expose requiresCv / phone pour les relances WhatsApp", () => {
    const router = read("server/routers/aiEvaluationManagement.ts");
    expect(router).toContain("evaluationRequiresCv");
    expect(router).toContain("requiresCv:");
    expect(router).toContain("phone: e.phone ?? null");
    expect(evaluationRequiresCv("schengen_travail", "travail")).toBe(true);
    expect(evaluationRequiresCv("schengen_tourisme", "tourisme")).toBe(false);
  });
});
