import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

describe("communications client neutres", () => {
  it("présente Aureol comme guide d’information sans exposer les mécanismes internes", () => {
    const widget = readProjectFile("client/src/components/AiCopilotWidgetEnhanced.tsx");
    const copilot = readProjectFile("server/routers/aiCopilot.ts");

    expect(widget).toContain("votre guide 3M Travel");
    expect(widget).not.toMatch(/assistant IA|assistant virtuel/i);
    expect(copilot).toContain("Ne mentionne jamais l'utilisation d'un outil automatisé");
    expect(copilot).not.toContain('Tu es le "Copilote IA 3M Travel"');
  });

  it("emploie des intitulés de rapports et d’évaluation non techniques", () => {
    const cvAnalysis = readProjectFile("server/routers/cvAnalysis.ts");
    const evaluation = readProjectFile("server/routers/evaluation.ts");
    const application = readProjectFile("server/routers/application.ts");

    expect(cvAnalysis).toContain("Rapport préparé le");
    expect(cvAnalysis).not.toContain("Rapport généré par l'IA");
    expect(evaluation).toContain("Brouillon préparatoire indisponible ; revue manuelle requise.");
    expect(evaluation).not.toContain("SCORE D'ADMISSIBILITÉ");
    expect(evaluation).not.toContain("generateAIEvaluationReport");
    expect(application).toContain("Rapport d\\'évaluation généré et envoyé avec succès");
    expect(application).not.toContain("Rapport d\\'évaluation IA généré et envoyé avec succès");
  });
});
