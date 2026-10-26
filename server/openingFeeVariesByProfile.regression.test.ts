import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8").replace(/\r/g, "");
const FIXED_65K = /65[\s  .,]?000/;

// Les frais d'ouverture varient selon le type de profil : aucun texte d'information (pages, FAQ, PDF, e-mail,
// consignes données aux IA) ne doit annoncer un montant unique. Les écrans de paiement d'un dossier précis
// lisent le montant du dossier (paymentAmount) et ne sont pas concernés par ce test.
const INFORMATIONAL_FILES = [
  "client/src/pages/HowItWorks.tsx",
  "client/src/components/HowItWorks.tsx",
  "client/src/components/FAQSection.tsx",
  "client/src/components/ProcedureDetailModal.tsx",
  "client/src/components/ScoreCalculator.tsx",
  "client/src/components/AiCopilotWidgetEnhanced.tsx",
  "client/src/components/DashboardStats.tsx",
  "client/src/lib/generateEvaluationPDF.ts",
  "client/src/content/visa_travail_processus.md",
  "server/admissibilityReportService.ts",
  "server/aiEvaluationService.ts",
  "server/routers/aiCopilot.ts",
  "server/routers/proceduresRouter.ts",
  "server/evaluationService.ts",
  "client/src/data/countryProcedures/luxembourg.ts",
  "server/luxembourgPdfGenerator.ts",
  "server/luxembourgScoringEngine.ts",
  "server/routers/luxembourgEvaluation.ts",
  "shared/agreementProtocolContent.ts",
];

describe("frais d'ouverture : le montant dépend du profil", () => {
  it.each(INFORMATIONAL_FILES)("%s n'annonce pas de montant unique", (file) => {
    expect(read(file)).not.toMatch(FIXED_65K);
  });

  it("les consignes données aux IA interdisent d'annoncer un montant précis", () => {
    expect(read("server/aiEvaluationService.ts")).toContain("montant selon votre profil");
    // Le prompt d'Aureol est construit dans shared/aureolSiteKnowledge.ts (buildAureolSystemPrompt).
    expect(read("shared/aureolSiteKnowledge.ts")).toContain("montant d'honoraires");
  });

  it("les fiches procédures n'annoncent plus « 65 000 FCFA » comme prix de l'ouverture de dossier", () => {
    // Seule exception légitime : la conversion d'un tarif tiers (e-Visa ASAN, 100 USD ≈ 65 000 FCFA), qui n'est pas un honoraire 3M.
    const data = read("shared/procedureData.ts").replace("100 USD (»65 000 FCFA)", "");
    expect(data).not.toMatch(/65[\s  ]000 FCFA/i);
  });

  it("le paiement en ligne ouvert après vérification de l'e-mail utilise le montant du dossier, pas une constante", () => {
    const application = read("server/routers/application.ts");
    expect(application).toContain("amount: app.paymentAmount ?? DEFAULT_OPENING_FEE_XAF,");
    expect(application).not.toMatch(/amount:\s*65000\s*,/);
  });

  it("les textes publics disent que le montant est confirmé par écrit avant tout paiement", () => {
    for (const file of ["client/src/pages/HowItWorks.tsx", "client/src/components/FAQSection.tsx", "client/src/components/ProcedureDetailModal.tsx", "server/admissibilityReportService.ts"]) {
      expect(read(file), file).toMatch(/confirmé(s)? par écrit avant tout paiement/);
    }
  });
});
