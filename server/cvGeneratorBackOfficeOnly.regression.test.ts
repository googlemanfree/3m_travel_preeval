import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { LEGACY_PUBLIC_REDIRECTS } from "./legacyPublicRedirects";
import { PUBLIC_PAGES, getIndexablePublicPaths } from "./publicPrerender";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8").replace(/\r\n/g, "\n");

describe("le générateur de CV est un outil de back-office, plus une page publique", () => {
  it("/cv-generator n'est plus une page publique indexable : redirection permanente vers /services", () => {
    expect(Object.keys(PUBLIC_PAGES)).not.toContain("/cv-generator");
    expect(getIndexablePublicPaths()).not.toContain("/cv-generator");
    expect(LEGACY_PUBLIC_REDIRECTS["/cv-generator"]).toBe("/services");
    expect(read("client/src/App.tsx")).toContain('<Route path={"/cv-generator"}>{() => <Redirect to="/services" />}</Route>');
  });

  it("l'ancienne page publique, ses composants et l'appel à la route PDF inexistante ont disparu", () => {
    const app = read("client/src/App.tsx");
    expect(app).not.toContain("pages/CVGenerator");
    for (const removed of ["client/src/pages/CVGenerator.tsx", "client/src/components/CVPreview.tsx", "client/src/components/AIAssistant.tsx"]) {
      expect(() => read(removed), removed).toThrow();
    }
    expect(read("client/src/components/CvDraftPanel.tsx")).not.toContain("/api/cv/generate-pdf");
  });

  it("l'outil vit dans l'espace administrateur, à côté de la validation structurée de l'évaluation", () => {
    const dashboard = read("client/src/pages/AdminAIEvaluationDashboard.tsx");
    expect(dashboard).toContain('import CvDraftPanel from "@/components/CvDraftPanel"');
    expect(dashboard).toMatch(/<CvDraftPanel evaluationId=\{evaluationNumericId\(item\)\} sessionToken=\{sessionToken\} defaultCountry=\{item\.destinationCountry\} \/>/);
    expect(read("server/routers.ts")).toContain("cvDraft: cvDraftRouter");
  });

  it("la génération exige les deux consentements avant tout appel au modèle", () => {
    const service = read("server/services/cvDraftGenerator.ts");
    const consent = service.indexOf("hasAnalysisConsent(row)");
    const cvConsent = service.indexOf("cvAnalysisConsented(row)");
    const load = service.indexOf("loadCv ?? loadCvExcerpt");
    const call = service.indexOf("deps.invoke ?? invokeLLM");
    expect(consent).toBeGreaterThan(-1);
    expect(consent).toBeLessThan(cvConsent);
    expect(cvConsent).toBeLessThan(load);
    expect(load).toBeLessThan(call);
  });
});
