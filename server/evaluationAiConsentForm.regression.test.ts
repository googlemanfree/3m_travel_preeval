import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { AI_ANALYSIS_CONSENT_DETAIL, AI_ANALYSIS_CONSENT_LABEL, CV_ANALYSIS_CONSENT_DETAIL, CV_ANALYSIS_CONSENT_LABEL } from "../shared/evaluationCv";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");
const page = read("client/src/pages/Evaluation.tsx");
const router = read("server/routers/evaluation.ts");

describe("formulaire d'évaluation : deux accords distincts et facultatifs", () => {
  it("les deux cases sont décochées par défaut", () => {
    expect(page).toContain("const [aiAnalysisConsent, setAiAnalysisConsent] = useState(false);");
    expect(page).toContain("const [cvAnalysisConsent, setCvAnalysisConsent] = useState(false);");
  });

  it("affiche les deux libellés partagés, distincts l'un de l'autre", () => {
    expect(page).toContain("{AI_ANALYSIS_CONSENT_LABEL}");
    expect(page).toContain("{CV_ANALYSIS_CONSENT_LABEL}");
    expect(AI_ANALYSIS_CONSENT_LABEL).not.toBe(CV_ANALYSIS_CONSENT_LABEL);
    expect(CV_ANALYSIS_CONSENT_LABEL).toMatch(/CV/);
    expect(AI_ANALYSIS_CONSENT_LABEL).not.toMatch(/CV/);
  });

  it("annonce ce qui est lu et ce qui est masqué, sans promettre un résultat automatique", () => {
    expect(CV_ANALYSIS_CONSENT_DETAIL).toMatch(/PDF/);
    expect(CV_ANALYSIS_CONSENT_DETAIL).toMatch(/masqués/);
    expect(AI_ANALYSIS_CONSENT_DETAIL).toMatch(/validé par un conseiller/);
    expect(AI_ANALYSIS_CONSENT_DETAIL).toMatch(/aucun résultat automatique/);
  });

  it("la case du CV est bloquée tant que l'accord général ou le CV manque", () => {
    expect(page).toContain("disabled={!aiAnalysisConsent || !cvFile}");
  });

  it("retirer l'accord général retire aussi l'accord au CV", () => {
    expect(page).toContain("if (!event.target.checked) setCvAnalysisConsent(false);");
  });

  it("l'envoi ne transmet l'accord au CV que si l'accord général est donné ET un CV est joint", () => {
    expect(page).toContain("geminiAnalysisConsent: aiAnalysisConsent,");
    expect(page).toContain("cvAnalysisConsent: aiAnalysisConsent && cvAnalysisConsent && Boolean(cvFile),");
  });
});

describe("serveur : l'accord au CV n'est jamais déduit ni forgé", () => {
  it("le champ est un booléen faux par défaut", () => {
    expect(router).toContain("cvAnalysisConsent: z.boolean().default(false),");
  });

  it("est enregistré avec sa date seulement avec l'accord général ET un CV réellement enregistré", () => {
    expect(router).toContain("preparatoryCvAnalysisConsent: Boolean(input.geminiAnalysisConsent && input.cvAnalysisConsent && cvFileUrl),");
    expect(router).toContain("preparatoryCvAnalysisConsentRecordedAt: input.geminiAnalysisConsent && input.cvAnalysisConsent && cvFileUrl ? new Date().toISOString() : null,");
  });

  it("les clés de consentement viennent APRÈS les détails du client : un détail forgé ne peut pas les écraser", () => {
    const start = router.indexOf("...(input.projectDetails ?? {}),");
    expect(start).toBeGreaterThan(-1);
    expect(router.indexOf("preparatoryAnalysisConsent: input.geminiAnalysisConsent", start)).toBeGreaterThan(start);
    expect(router.indexOf("preparatoryCvAnalysisConsent: Boolean(", start)).toBeGreaterThan(start);
  });
});
