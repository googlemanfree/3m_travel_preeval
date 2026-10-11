import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { computeNextStep, type NextStepInput } from "@/lib/nextStep";

const projectRoot = resolve(import.meta.dirname, "..");
const dashboardSource = readFileSync(resolve(projectRoot, "client/src/pages/EvaluationSpace.tsx"), "utf8");
const nextStepSource = readFileSync(resolve(projectRoot, "client/src/lib/nextStep.ts"), "utf8");
const summarySource = readFileSync(resolve(projectRoot, "server/routers/candidate.ts"), "utf8");
const navigationSource = readFileSync(resolve(projectRoot, "client/src/components/ClientSpaceNavigation.tsx"), "utf8");

const base: NextStepInput = { evaluationRequired: false, agreementSignatureRequired: false };

describe("pilotage prioritaire de l’espace client", () => {
  it("priorise paiement, pièces, notifications puis messages via computeNextStep", () => {
    expect(dashboardSource).toContain("computeNextStep({");
    expect(dashboardSource).toContain("paymentDue");
    expect(dashboardSource).toContain("unreadNotifications");
    expect(dashboardSource).toContain("unreadMessages");
    expect(nextStepSource.indexOf('id: "payment-due"')).toBeGreaterThan(-1);
    expect(nextStepSource.indexOf('id: "documents-rejected"')).toBeGreaterThan(nextStepSource.indexOf('id: "payment-due"'));
    expect(nextStepSource.indexOf('id: "notifications-unread"')).toBeGreaterThan(nextStepSource.indexOf('id: "documents-pending"'));
    expect(nextStepSource.indexOf('id: "messages-unread"')).toBeGreaterThan(nextStepSource.indexOf('id: "notifications-unread"'));

    expect(computeNextStep({ ...base, paymentDue: true, unreadMessages: 3 }).id).toBe("payment-due");
    expect(computeNextStep({ ...base, requirements: [{ id: 1, status: "rejected", isRequired: true }], unreadNotifications: 2 }).id).toBe("documents-rejected");
    expect(dashboardSource).toContain("Lecture seule des dossiers actifs");
  });

  it("offre des raccourcis exploitables vers le suivi, les documents et la messagerie", () => {
    expect(navigationSource).toContain('href: "/mon-espace?section=dossier"');
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
