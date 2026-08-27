import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const readProjectFile = (relativePath: string) =>
  readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("lazy page timeout recovery contracts", () => {
  it("uses a 15-second timeout and rejects with a chunk-compatible error", () => {
    const helper = readProjectFile("client/src/lib/lazyWithTimeout.ts");

    expect(helper).toContain("LAZY_PAGE_TIMEOUT_MS = 15_000");
    expect(helper).toContain("Promise.race");
    expect(helper).toContain("Failed to fetch dynamically imported module");
    expect(helper).toContain("clearTimeout(timeoutId)");
  });

  it("wraps all deferred page imports in App.tsx", () => {
    const app = readProjectFile("client/src/App.tsx");
    const lazyImports = app.match(/lazyWithTimeout\(\(\) => import\(/g) ?? [];

    expect(app).toContain('import { lazyWithTimeout } from "./lib/lazyWithTimeout";');
    // Les pages de service et les articles d’études sont chargés à la demande.
    // La fiche publique de procédure reste une exception volontaire : elle est
    // chargée directement afin de ne pas exposer les 107 destinations à un
    // écran blanc en cas de délai de récupération d’un module. La page
    // historique submit-review est désormais une redirection, non une page
    // chargée à la demande.
    expect(lazyImports.length).toBeGreaterThanOrEqual(95);
    expect(app).toContain('import CountryDetailPage from "./pages/CountryDetailPage"');
    expect(app).not.toContain('const CountryDetailPage = lazyWithTimeout');
    for (const removedPage of ["Assurance", "SignUp", "Procedures", "ProceduresComplete", "ProceduresEnhanced", "AIEvaluation", "EvaluationRapideEnhanced", "ClientSpace", "AdminDossierManagement", "PrimaryEvaluationForm", "AdminEvaluationValidation", "ClientSpaceEnhanced", "EvisasPage", "EvisasEnhanced", "EvisasV3", "AdminPaymentValidation", "ClientDashboard", "Dashboard", "ClientSpaceEnhancedV2"]) {
      expect(app).not.toContain(`import(\"./pages/${removedPage}\")`);
    }
    expect(app).not.toContain("React.lazy(() => import(");
  });
});
