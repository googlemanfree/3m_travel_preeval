import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");
const readProjectFile = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("améliorations Procédures et suivi administratif", () => {
  it("conserve GA4 et propose les outils publics sans dupliquer le simulateur CRS", () => {
    const indexHtml = readProjectFile("client/index.html");
    const procedures = readProjectFile("client/src/pages/ProceduresAdvanced.tsx");
    expect(indexHtml).toContain("G-4HBHHH37VL");
    expect(procedures).toContain("Vérifier votre score CRS");
    expect(procedures).toContain('href="/canada"');
    expect(procedures).toContain("VISA_DOCUMENT_CHECKLISTS");
    expect(procedures).toContain("237698104832");
  });

  it("prévoit les échéances consulaires, la checklist contextuelle et les tendances réelles", () => {
    const schema = readProjectFile("drizzle/consularPortalSchema.ts");
    const registry = readProjectFile("client/src/components/AdminConsularRegistry.tsx");
    const workspace = readProjectFile("client/src/components/Candidate360Workspace.tsx");
    const analytics = readProjectFile("client/src/components/AdminDestinationAnalytics.tsx");
    expect(schema).toContain("revalidateDueAt");
    expect(registry).toContain("File de revalidation des liens officiels");
    expect(workspace).toContain("Préremplie depuis l’évaluation");
    expect(analytics).toContain("getEvaluationsByDestination");
  });
});
