import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const dashboardSource = readFileSync(resolve(projectRoot, "client/src/pages/EvaluationSpace.tsx"), "utf8");
const summarySource = readFileSync(resolve(projectRoot, "server/routers/candidate.ts"), "utf8");
const navigationSource = readFileSync(resolve(projectRoot, "client/src/components/ClientSpaceNavigation.tsx"), "utf8");

describe("pilotage prioritaire de l’espace client", () => {
  it("priorise les messages, puis les documents, sans présenter une décision automatique", () => {
    const priorityBlock = dashboardSource.slice(
      dashboardSource.indexOf("const priority ="),
      dashboardSource.indexOf("const PriorityIcon"),
    );
    const messagePriority = priorityBlock.indexOf('stats.unreadMessages > 0');
    const documentPriority = priorityBlock.indexOf('cProfile.dossierStatus === "documents"');
    const evaluationPriority = priorityBlock.indexOf('!latestEvaluation');

    expect(messagePriority).toBeGreaterThan(-1);
    expect(documentPriority).toBeGreaterThan(messagePriority);
    expect(evaluationPriority).toBeGreaterThan(documentPriority);
    expect(dashboardSource).toContain("Aucune décision n’est prise automatiquement dans cet espace.");
  });

  it("offre des raccourcis exploitables vers le suivi, les documents et la messagerie", () => {
    expect(dashboardSource).toContain('setLocation("/mon-dossier")');
    expect(dashboardSource).toContain('switchToSection("documents")');
    expect(dashboardSource).toContain('switchToSection("messages")');
    expect(dashboardSource).toContain("Référence de dossier");
    expect(dashboardSource).toContain("Synchronisation");
    expect(navigationSource).toContain('href: "/assistance-acces"');
    expect(navigationSource).toContain('label: "Assistance accès"');
  });

  it("n’expose pas la note interne du conseiller dans le résumé client", () => {
    const summaryBlock = summarySource.slice(
      summarySource.indexOf("getClientDashboardSummary:"),
      summarySource.indexOf("saveDestinationComparison:"),
    );

    expect(summaryBlock).not.toContain("dossierNote:");
    expect(summaryBlock).not.toContain("scoreDetails:");
  });
});
