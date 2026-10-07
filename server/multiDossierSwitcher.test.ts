import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const read = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), "utf8");

/**
 * Un candidat peut ouvrir deux dossiers en ligne distincts (ex. Visa Études puis Visa Travail),
 * chacun avec son propre paiement (déjà garanti par cinetpayPayment.ts, qui clé tout par
 * dossierNumber). Ce test verrouille le sélecteur ajouté dans l'espace client pour basculer
 * entre eux, sans toucher au parcours agence/admin qui reste volontairement à un seul dossier.
 */
describe("sélection d'un dossier parmi plusieurs (espace client)", () => {
  const summarySource = read("server/routers/candidate.ts");

  it("accepte un selectedDossierNumber optionnel sans casser l'appel sans argument existant", () => {
    const block = summarySource.slice(
      summarySource.indexOf("getClientDashboardSummary:"),
      summarySource.indexOf("saveDestinationComparison:")
    );
    expect(block).toContain(".input(z.object({ selectedDossierNumber: z.string().trim().min(1).max(50).optional() }).optional())");
    // La sélection explicite doit primer sur la règle par défaut (payé, sinon le plus récent),
    // qui doit rester le secours quand aucune sélection n'est fournie.
    expect(block).toContain("const selectedApp = input?.selectedDossierNumber");
    expect(block).toContain('appRows.find((app) => app.dossierNumber === input.selectedDossierNumber) ?? null');
    expect(block).toContain('const activeApp = selectedApp || appRows.find((app) => app.paymentStatus === "SUCCESS") || appRows[0] || null;');
  });

  it("expose la liste des dossiers en ligne du candidat pour alimenter le sélecteur", () => {
    const block = summarySource.slice(
      summarySource.indexOf("getClientDashboardSummary:"),
      summarySource.indexOf("saveDestinationComparison:")
    );
    expect(block).toContain("const onlineDossiers = appRows.map((app) => ({");
    expect(block).toContain("dossierNumber: app.dossierNumber,");
    expect(block).toContain("onlineDossiers,");
  });

  it("espace client : le sélecteur n'affiche des onglets qu'à partir de 2 dossiers, mais le lien d'ouverture reste visible dès le premier", () => {
    const dashboardSource = read("client/src/pages/EvaluationSpace.tsx");
    expect(dashboardSource).toContain("const [selectedDossierNumber, setSelectedDossierNumber] = useState<string | null>(null);");
    expect(dashboardSource).toContain("selectedDossierNumber ? { selectedDossierNumber } : undefined");
    expect(dashboardSource).toContain("onlineDossiers.length >= 1");
    expect(dashboardSource).toContain("onlineDossiers.length > 1 && onlineDossiers.map((dossier)");
    expect(dashboardSource).toContain('href="/evaluation"');
    expect(dashboardSource).toContain("+ Ouvrir un dossier pour un autre projet");
  });

  it("le parcours agence (pré-dossier admin) n'est pas touché par ce changement : le blocage à un seul dossier actif reste en place", () => {
    const adminSource = read("server/routers/adminCandidateManagement.ts");
    expect(adminSource).toContain('"Ce compte possède déjà un dossier actif."');
  });

  it("le paiement en ligne reste strictement clé par dossierNumber, indépendant d'un dossier à l'autre", () => {
    const paymentSource = read("server/routers/cinetpayPayment.ts");
    expect(paymentSource).toContain(".input(z.object({ dossierNumber: z.string().min(3).max(50) }))");
    expect(paymentSource).toContain("ensureApplicationOwnership(application, ctx.user.id)");
  });
});
